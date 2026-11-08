import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AUTO_PALETTE_VARIATION_DEFAULT,
  COLOR_COVERAGE_DEFAULT,
  COLOR_INTENSITY_DEFAULT,
  COLOR_INTENSITY_MAX,
  COLOR_INTENSITY_MIN,
  COLOR_STRATEGY_DEFAULT,
  HERO_COLOR_DEFAULT,
  colorMoods,
  colorProfiles,
  colorStrategies,
  ceilingLights,
  ceilings,
  type ColorMood,
  type ColorCoverage,
  type ColorStrategy,
  focalPoints,
  heroColors,
  legacyHeroColors,
  type HeroColor,
  type LegacyHeroColor,
  homeQualities,
  type RoomType,
  roomSizes,
  rooms,
  styles,
  views,
  wallColorPalettes,
  walls,
  windowStyles,
} from "@/lib/combinations";
import {
  accessoryOptionGroups,
  buildAccessoryPrompt,
  buildAccessorySafetyFallbackPrompt,
  type AccessoryOptions,
  type AccessoryScenario,
} from "@/lib/accessoryCombinations";
import {
  exteriorOptionGroups,
  photoTypes,
  type ExteriorOptions,
  type PhotoType,
} from "@/lib/exteriorCombinations";
import {
  buildExteriorPrompt,
  buildExteriorSafetyFallbackPrompt,
  type ExteriorScenario,
} from "@/lib/exteriorPromptBuilder";
import { submitImageBatchJob } from "@/lib/openaiBatch";
import { resolveWholeHouseShots } from "@/lib/wholeHouse";
import { createPromptScenarioSamples } from "@/lib/promptScenarioSelection";
import { buildPrompt } from "../../lib/promptBuilder";

const OUTPUT_DIR = path.join(process.cwd(), "output");
const DEFAULT_MAX_PROMPTS = 12;
const ABSOLUTE_MAX_PROMPTS = 200;
const BATCH_MODE_THRESHOLD = 24;
const CONCURRENCY = 4;
const LARGE_RUN_PREFLIGHT_MIN_IMAGES = 25;
const LARGE_RUN_PREFLIGHT_SAMPLE_SIZE = 8;
const PRIMARY_IMAGE_MODEL = "gpt-image-2";
const FALLBACK_IMAGE_MODEL = "gpt-image-1";
const MAX_RATE_LIMIT_RETRIES = 5;

type FileSizeOption = "small" | "medium" | "large";
type AspectRatioOption = "1:1" | "4:5" | "9:16" | "16:9";
type HomeQuality =
  | "builder's grade layout"
  | "everyday"
  | "upscale"
  | "luxury"
  | "ultra luxury";
type ImageData = {
  b64_json?: string | null;
};

type ImagesResponse = {
  data?: ImageData[];
};

type GeneratePayload = {
  rooms?: string[];
  outsideViews?: string[];
  colorProfiles?: string[];
  focalPoints?: string[];
  windowStyles?: string[];
  walls?: string[];
  ceilings?: string[];
  ceilingLights?: string[];
  roomSize?: string;
  designStyle?: string;
  designStyles?: string[];
  colorMood?: string;
  colorIntensity?: number;
  colorPresence?: number;
  colorCoverage?: string;
  colorStrategy?: string;
  heroColor?: string;
  autoPaletteVariation?: boolean;
  homeQuality?: HomeQuality;
  wallColorPalette?: string;
  randomizeWallColor?: boolean;
  runAsBatch?: boolean;
  fileSize?: FileSizeOption;
  aspectRatio?: AspectRatioOption;
  maxImages?: number;
  photoTypes?: string[];
  wholeHouse?: boolean;
  wholeHouseShotIds?: string[];
  exterior?: Partial<Record<keyof ExteriorOptions, string[]>>;
  accessory?: Partial<Record<keyof AccessoryOptions, string[]>>;
};

type PromptScenario = {
  room: RoomType;
  style: string;
  view: string;
  colorProfile: string;
  focalPoints: string[];
  windowStyle: string;
  wall: string;
  ceiling: string;
  ceilingLight: string;
  wallColorPalette: string;
};

type PromptRequest = {
  primaryPrompt: string;
  safetyFallbackPrompt: string;
};

const FILE_SIZE_TO_QUALITY: Record<FileSizeOption, "low" | "medium" | "high"> = {
  small: "low",
  medium: "medium",
  large: "high",
};

const FILE_SIZE_AND_ASPECT_TO_SIZE: Record<
  FileSizeOption,
  Record<AspectRatioOption, `${number}x${number}`>
> = {
  small: {
    "1:1": "768x768",
    "4:5": "768x960",
    "9:16": "864x1536",
    "16:9": "1536x864",
  },
  medium: {
    "1:1": "1024x1024",
    "4:5": "1024x1280",
    "9:16": "1152x2048",
    "16:9": "2048x1152",
  },
  large: {
    "1:1": "1536x1536",
    "4:5": "1536x1920",
    "9:16": "1296x2304",
    "16:9": "2304x1296",
  },
};

const FALLBACK_ASPECT_RATIO_TO_SIZE: Record<
  AspectRatioOption,
  "1024x1024" | "1536x1024" | "1024x1536"
> = {
  "1:1": "1024x1024",
  "4:5": "1024x1536",
  "9:16": "1024x1536",
  "16:9": "1536x1024",
};

export const runtime = "nodejs";

function extractErrorMessage(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
    ? (error as { message: string }).message
    : "";
}

function looksLikeHtmlDocument(value: string): boolean {
  return /<!doctype\s+html|<html\b|<head\b|<body\b/i.test(value);
}

function toClientSafeUpstreamMessage(message: string, status: number): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return `Image service request failed (status ${status}). Please try again.`;
  }

  if (!looksLikeHtmlDocument(trimmed)) {
    return trimmed;
  }

  if (status === 429) {
    return "Image service is rate-limited right now. Please try again shortly.";
  }

  if (status === 401 || status === 403) {
    return "Image service rejected this request. Check API key, billing, and prompt safety settings.";
  }

  return `Image service returned an unexpected HTML error page (status ${status}). Please try again.`;
}

function isSafetyViolationError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();

  return (
    message.includes("safety") ||
    message.includes("safety system") ||
    message.includes("safety_violations") ||
    message.includes("sexual")
  );
}

function isRateLimitError(error: unknown): boolean {
  return typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === 429;
}

function getRetryDelayMs(error: unknown): number {
  const message = extractErrorMessage(error);
  const match = message.match(/try again in\s*(\d+)s/i);

  if (!match) {
    return 15_000;
  }

  const seconds = Number(match[1]);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 15_000;
  }

  return (seconds + 1) * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function shouldUseBatchModeForImageGeneration(
  maxImages: number,
  model: string,
  batchRequested?: boolean
): boolean {
  if (model !== PRIMARY_IMAGE_MODEL) {
    return false;
  }

  // An explicit choice wins; the size threshold only applies when none was sent.
  return batchRequested ?? maxImages > BATCH_MODE_THRESHOLD;
}

function pickRandomItem<T>(items: T[], random: () => number = Math.random): T {
  return items[Math.floor(random() * items.length)] as T;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateGeneratePayloadShape(payload: unknown): string[] {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return ["Request body must be a JSON object."];
  }

  const input = payload as Record<string, unknown>;
  const errors: string[] = [];

  const arrayFields = [
    "rooms",
    "outsideViews",
    "colorProfiles",
    "focalPoints",
    "windowStyles",
    "walls",
    "ceilings",
    "ceilingLights",
    "photoTypes",
    "wholeHouseShotIds",
  ] as const;

  arrayFields.forEach((field) => {
    if (field in input && input[field] !== undefined && !isStringArray(input[field])) {
      errors.push(`${field} must be an array of strings.`);
    }
  });

  if ("exterior" in input && input.exterior !== undefined) {
    const exterior = input.exterior;

    if (exterior === null || typeof exterior !== "object" || Array.isArray(exterior)) {
      errors.push("exterior must be an object.");
    } else {
      exteriorOptionGroups.forEach(({ key }) => {
        const value = (exterior as Record<string, unknown>)[key];

        if (value !== undefined && !isStringArray(value)) {
          errors.push(`exterior.${key} must be an array of strings.`);
        }
      });
    }
  }

  if ("accessory" in input && input.accessory !== undefined) {
    const accessory = input.accessory;

    if (accessory === null || typeof accessory !== "object" || Array.isArray(accessory)) {
      errors.push("accessory must be an object.");
    } else {
      accessoryOptionGroups.forEach(({ key }) => {
        const value = (accessory as Record<string, unknown>)[key];

        if (value !== undefined && !isStringArray(value)) {
          errors.push(`accessory.${key} must be an array of strings.`);
        }
      });
    }
  }

  const stringFields = [
    "roomSize",
    "designStyle",
    "colorMood",
    "colorStrategy",
    "colorCoverage",
    "heroColor",
    "homeQuality",
    "wallColorPalette",
    "fileSize",
    "aspectRatio",
  ] as const;

  stringFields.forEach((field) => {
    if (field in input && input[field] !== undefined && typeof input[field] !== "string") {
      errors.push(`${field} must be a string.`);
    }
  });

  if (
    "colorIntensity" in input &&
    input.colorIntensity !== undefined &&
    (typeof input.colorIntensity !== "number" || !Number.isFinite(input.colorIntensity))
  ) {
    errors.push("colorIntensity must be a number.");
  }

  if (
    "colorPresence" in input &&
    input.colorPresence !== undefined &&
    (typeof input.colorPresence !== "number" || !Number.isFinite(input.colorPresence))
  ) {
    errors.push("colorPresence must be a number.");
  }

  if (
    "autoPaletteVariation" in input &&
    input.autoPaletteVariation !== undefined &&
    typeof input.autoPaletteVariation !== "boolean"
  ) {
    errors.push("autoPaletteVariation must be a boolean.");
  }

  if (
    "runAsBatch" in input &&
    input.runAsBatch !== undefined &&
    typeof input.runAsBatch !== "boolean"
  ) {
    errors.push("runAsBatch must be a boolean.");
  }

  if (
    "randomizeWallColor" in input &&
    input.randomizeWallColor !== undefined &&
    typeof input.randomizeWallColor !== "boolean"
  ) {
    errors.push("randomizeWallColor must be a boolean.");
  }

  if (
    "maxImages" in input &&
    input.maxImages !== undefined &&
    (!Number.isInteger(input.maxImages) || typeof input.maxImages !== "number")
  ) {
    errors.push("maxImages must be an integer.");
  }

  return errors;
}

function getDefaultWallColorPalette(colorProfileSelection: string[]): string {
  const selectedProfiles = new Set(colorProfileSelection);
  const noFixedPaletteSelection =
    colorProfileSelection.length === 1 &&
    selectedProfiles.has("no fixed color palette (material-led)");

  if (noFixedPaletteSelection) {
    return (
      wallColorPalettes.find((palette) => palette.includes("balanced modern mix")) ??
      "balanced modern mix (white, warm gray, dusty blue, pure charcoal)"
    );
  }

  const earthyOnlySelection =
    colorProfileSelection.length === 1 &&
    selectedProfiles.has("earthy saturated palette");

  if (earthyOnlySelection) {
    return (
      wallColorPalettes.find((palette) => palette.includes("earthy warm mix")) ??
      "earthy warm mix (sand, clay, terracotta, olive)"
    );
  }

  if (selectedProfiles.has("high-contrast palette")) {
    return (
      wallColorPalettes.find((palette) => palette.includes("high-contrast mix")) ??
      "high-contrast mix (white, black, and one strong accent color)"
    );
  }

  if (selectedProfiles.has("rich color-forward palette")) {
    return (
      wallColorPalettes.find((palette) => palette.includes("coastal blue mix")) ??
      "coastal blue mix (powder blue, dusty navy, soft teal, white trim)"
    );
  }

  if (selectedProfiles.has("soft pastel palette")) {
    return (
      wallColorPalettes.find((palette) => palette.includes("blush and rose mix")) ??
      "blush and rose mix (blush pink, rose beige, warm ivory, soft taupe)"
    );
  }

  return (
    wallColorPalettes.find((palette) => palette.includes("cool contemporary mix")) ??
    "cool contemporary mix (white, gray, slate blue, charcoal accents)"
  );
}

function normalizePaletteFamilyFromPayload(heroColor: string | undefined): HeroColor {
  if (!heroColor) {
    return HERO_COLOR_DEFAULT;
  }

  if (heroColors.includes(heroColor as HeroColor)) {
    return heroColor as HeroColor;
  }

  const legacyToFamily: Record<LegacyHeroColor, HeroColor> = {
    "Deep Blue": "Cool Mixed",
    Teal: "Cool Mixed",
    Emerald: "Jewel Tone Mixed",
    Olive: "Earthy Mixed",
    Sage: "Earthy Mixed",
    Terracotta: "Warm Mixed",
    Rust: "Warm Mixed",
    Burgundy: "Jewel Tone Mixed",
    Plum: "Jewel Tone Mixed",
    Mustard: "Warm Mixed",
    Gold: "Jewel Tone Mixed",
    Mixed: "Designer Mixed",
  };

  if (legacyHeroColors.includes(heroColor as LegacyHeroColor)) {
    return legacyToFamily[heroColor as LegacyHeroColor];
  }

  return HERO_COLOR_DEFAULT;
}

function getWallColorRandomPoolByProfile(colorProfileSelection: string[]): string[] {
  const selectedProfiles = new Set(colorProfileSelection);
  const noFixedPaletteSelection =
    colorProfileSelection.length === 1 &&
    selectedProfiles.has("no fixed color palette (material-led)");

  if (noFixedPaletteSelection) {
    return wallColorPalettes;
  }

  const earthyOnlySelection =
    colorProfileSelection.length === 1 &&
    selectedProfiles.has("earthy saturated palette");

  if (earthyOnlySelection) {
    return wallColorPalettes;
  }

  const filtered = wallColorPalettes.filter(
    (palette) =>
      !palette.includes("earthy warm mix") &&
      !palette.includes("green designer mix") &&
      !palette.includes("wine accent mix") &&
      !palette.includes("blush and rose mix") &&
      !palette.includes("balanced modern mix") &&
      !palette.includes("fresh light mix") &&
      !palette.includes("jewel accent mix") &&
      !palette.includes("high-contrast mix")
  );

  return filtered.length > 0 ? filtered : wallColorPalettes;
}

function hashStringToSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1;

  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 0x100000000;
  };
}

function shuffleArray<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    const temp = copy[index] as T;
    copy[index] = copy[randomIndex] as T;
    copy[randomIndex] = temp;
  }

  return copy;
}

async function generateWithRateLimitRetry(input: {
  model: string;
  prompt: string;
  quality: "low" | "medium" | "high";
  size: `${number}x${number}` | "1024x1024" | "1536x1024" | "1024x1536";
}): Promise<ImagesResponse> {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        const error = new Error("OPENAI_API_KEY is not set") as Error & {
          status?: number;
        };
        error.status = 500;
        throw error;
      }

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(input),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        let message = `OpenAI request failed with status ${response.status}`;

        try {
          const parsed = JSON.parse(responseBody) as {
            error?: { message?: string };
          };

          if (parsed.error?.message) {
            message = parsed.error.message;
          }
        } catch {
          if (responseBody) {
            message = responseBody.slice(0, 300);
          }
        }

        message = toClientSafeUpstreamMessage(message, response.status);

        const error = new Error(message) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      return JSON.parse(responseBody) as ImagesResponse;
    } catch (error) {
      const canRetry = isRateLimitError(error) && attempt < MAX_RATE_LIMIT_RETRIES;

      if (!canRetry) {
        throw error;
      }

      const retryDelayMs = getRetryDelayMs(error);
      await sleep(retryDelayMs);
    }
  }

  throw new Error("Image generation failed after rate-limit retries");
}

async function generateImageWithFallback(
  prompt: string,
  quality: "low" | "medium" | "high",
  size: `${number}x${number}`,
  fallbackSize: "1024x1024" | "1536x1024" | "1024x1536"
): Promise<ImagesResponse> {
  try {
    return await generateWithRateLimitRetry({
      model: PRIMARY_IMAGE_MODEL,
      prompt,
      quality,
      size,
    });
  } catch (error) {
    const message = extractErrorMessage(error).toLowerCase();
    const shouldFallback = message.includes("model") || message.includes("size");

    if (!shouldFallback) {
      throw error;
    }

    return generateWithRateLimitRetry({
      model: FALLBACK_IMAGE_MODEL,
      prompt,
      quality,
      size: fallbackSize,
    });
  }
}

function buildSafetyFallbackPrompt(input: {
  room: RoomType;
  roomSize: string;
  style: string;
  homeQuality: HomeQuality;
  colorMood: ColorMood;
  colorCoverage: ColorCoverage;
  wallColorPalette: string;
  colorProfile: string;
  view: string;
  windowStyle: string;
  wall: string;
  ceiling: string;
  ceilingLight: string;
  focalPoints: string[];
  index: number;
  maxImages: number;
}): string {
  const focalPointDirection =
    input.focalPoints.length > 0
      ? input.focalPoints.join(", ")
      : "subtle decor focal points";

  return `Photorealistic ${input.style} ${input.room} interior design photograph.
Room size: ${input.roomSize}. Home quality: ${input.homeQuality}.
Color direction: ${input.colorMood}; coverage ${input.colorCoverage}; wall palette ${input.wallColorPalette}; profile ${input.colorProfile}.
Architecture and materials: ${input.wall}; ${input.ceiling}; ${input.windowStyle}; ${input.ceilingLight}.
Focal point direction: ${focalPointDirection}.
Exterior view: ${input.view}.
Interior architecture and decor only; no people or character-like subjects.
Clean realistic residential composition, bright daylight, no surreal themes.

Variation ${input.index + 1} of ${input.maxImages}.`;
}

export async function POST(request: Request) {
  try {
    let payload: GeneratePayload = {};

    try {
      const parsedPayload = (await request.json()) as unknown;
      const payloadErrors = validateGeneratePayloadShape(parsedPayload);

      if (payloadErrors.length > 0) {
        return NextResponse.json(
          {
            error: "Invalid request payload",
            details: payloadErrors,
          },
          {
            status: 400,
          }
        );
      }

      payload = parsedPayload as GeneratePayload;
    } catch {
      payload = {};
    }

    const fileSize: FileSizeOption =
      payload.fileSize === "small" ||
      payload.fileSize === "medium" ||
      payload.fileSize === "large"
        ? payload.fileSize
        : "medium";

    const aspectRatio: AspectRatioOption =
      payload.aspectRatio === "1:1" ||
      payload.aspectRatio === "4:5" ||
      payload.aspectRatio === "9:16" ||
      payload.aspectRatio === "16:9"
        ? payload.aspectRatio
        : "1:1";

    const selectedRooms =
      Array.isArray(payload.rooms)
        ? payload.rooms.filter((room): room is RoomType =>
            typeof room === "string" && rooms.includes(room as RoomType)
          )
        : [];

    const roomSelection =
      selectedRooms.length > 0 ? selectedRooms : [rooms[0] ?? "living room"];

    const selectedOutsideViews =
      Array.isArray(payload.outsideViews)
        ? payload.outsideViews.filter((view): view is string =>
            typeof view === "string" && views.includes(view)
          )
        : [];

    const viewSelection =
      selectedOutsideViews.length > 0
        ? selectedOutsideViews
        : [views[views.length - 1] ?? "city skyline"];

    const selectedColorProfiles =
      Array.isArray(payload.colorProfiles)
        ? payload.colorProfiles.filter((colorProfile): colorProfile is string =>
            typeof colorProfile === "string" && colorProfiles.includes(colorProfile)
          )
        : [];

    const colorProfileSelection =
      selectedColorProfiles.length > 0
        ? selectedColorProfiles
        : [colorProfiles[0] ?? "current balanced palette (default)"];

    const focalPointSelection =
      Array.isArray(payload.focalPoints)
        ? payload.focalPoints.filter((focalPoint): focalPoint is string =>
            typeof focalPoint === "string" && focalPoints.includes(focalPoint)
          )
        : [];

    const selectedWindowStyles =
      Array.isArray(payload.windowStyles)
        ? payload.windowStyles.filter((windowStyle): windowStyle is string =>
            typeof windowStyle === "string" && windowStyles.includes(windowStyle)
          )
        : [];

    const windowSelection =
      selectedWindowStyles.length > 0
        ? selectedWindowStyles
        : [windowStyles[1] ?? "balanced windows (standard residential)"];

    const selectedWalls =
      Array.isArray(payload.walls)
        ? payload.walls.filter((wallType): wallType is string =>
            typeof wallType === "string" && walls.includes(wallType)
          )
        : [];

    const wallSelection =
      selectedWalls.length > 0 ? selectedWalls : [walls[2] ?? "wallpaper walls"];

    const selectedCeilings =
      Array.isArray(payload.ceilings)
        ? payload.ceilings.filter((ceilingType): ceilingType is string =>
            typeof ceilingType === "string" && ceilings.includes(ceilingType)
          )
        : [];

    const ceilingSelection =
      selectedCeilings.length > 0
        ? selectedCeilings
        : [ceilings[0] ?? "smooth white ceiling"];

    const selectedCeilingLights =
      Array.isArray(payload.ceilingLights)
        ? payload.ceilingLights.filter((lightType): lightType is string =>
            typeof lightType === "string" && ceilingLights.includes(lightType)
          )
        : [];

    const ceilingLightSelection =
      selectedCeilingLights.length > 0
        ? selectedCeilingLights
        : [ceilingLights[0] ?? "recessed downlights"];

    const roomSizeSelection =
      typeof payload.roomSize === "string" && roomSizes.includes(payload.roomSize)
        ? payload.roomSize
        : (roomSizes[1] ?? "standard room (180-280 sq ft)");

    const selectedDesignStyles =
      Array.isArray(payload.designStyles)
        ? payload.designStyles.filter(
            (style): style is string => typeof style === "string" && styles.includes(style)
          )
        : [];

    const styleSelection =
      selectedDesignStyles.length > 0
        ? selectedDesignStyles.join(", ")
        : typeof payload.designStyle === "string" && styles.includes(payload.designStyle)
          ? payload.designStyle
          : (styles[0] ?? "modern");

    const styleOptions =
      selectedDesignStyles.length > 0
        ? [...new Set(selectedDesignStyles)]
        : [
            typeof payload.designStyle === "string" && styles.includes(payload.designStyle)
              ? payload.designStyle
              : (styles[0] ?? "modern"),
          ];

    const colorMoodSelection: ColorMood =
      typeof payload.colorMood === "string" &&
      colorMoods.includes(payload.colorMood as ColorMood)
        ? (payload.colorMood as ColorMood)
        : (colorMoods[0] ?? "Warm Neutral");

    const rawColorIntensity =
      typeof payload.colorIntensity === "number" && Number.isFinite(payload.colorIntensity)
        ? payload.colorIntensity
        : typeof payload.colorPresence === "number" && Number.isFinite(payload.colorPresence)
          ? payload.colorPresence
          : COLOR_INTENSITY_DEFAULT;

    const colorIntensitySelection = Math.max(
      COLOR_INTENSITY_MIN,
      Math.min(COLOR_INTENSITY_MAX, Math.round(rawColorIntensity))
    );

    const colorStrategySelection: ColorStrategy =
      typeof payload.colorStrategy === "string" &&
      colorStrategies.includes(payload.colorStrategy as ColorStrategy)
        ? (payload.colorStrategy as ColorStrategy)
        : COLOR_STRATEGY_DEFAULT;

    const colorCoverageSelection: ColorCoverage =
      typeof payload.colorCoverage === "string" &&
      ["Decor Only", "Softly Distributed", "Architectural Surfaces", "Whole Room"].includes(
        payload.colorCoverage
      )
        ? (payload.colorCoverage as ColorCoverage)
        : COLOR_COVERAGE_DEFAULT;

    const heroColorSelection: HeroColor =
      typeof payload.heroColor === "string"
        ? normalizePaletteFamilyFromPayload(payload.heroColor)
        : HERO_COLOR_DEFAULT;

    const autoPaletteVariation =
      typeof payload.autoPaletteVariation === "boolean"
        ? payload.autoPaletteVariation
        : AUTO_PALETTE_VARIATION_DEFAULT;

    const homeQualitySelection: HomeQuality =
      payload.homeQuality && homeQualities.includes(payload.homeQuality)
        ? payload.homeQuality
        : "upscale";

    const wallColorPaletteSelection =
      typeof payload.wallColorPalette === "string" &&
      wallColorPalettes.includes(payload.wallColorPalette)
        ? payload.wallColorPalette
        : getDefaultWallColorPalette(colorProfileSelection);

    const randomizeWallColor = payload.randomizeWallColor === true;
    const randomRunSalt = randomizeWallColor ? `${Date.now()}-${Math.random()}` : "stable";

    const wholeHouse = payload.wholeHouse === true;
    const wholeHouseShotSelection = resolveWholeHouseShots(payload.wholeHouseShotIds);

    const maxImages = wholeHouse
      ? wholeHouseShotSelection.length
      : typeof payload.maxImages === "number" && Number.isInteger(payload.maxImages)
        ? Math.max(1, Math.min(payload.maxImages, ABSOLUTE_MAX_PROMPTS))
        : DEFAULT_MAX_PROMPTS;

    const requestedPhotoTypes = Array.isArray(payload.photoTypes)
      ? photoTypes.filter((type) => payload.photoTypes?.includes(type))
      : [];
    const photoTypeSelection: PhotoType[] =
      requestedPhotoTypes.length > 0 ? requestedPhotoTypes : ["interior"];
    const includeExterior = photoTypeSelection.includes("exterior");
    const includeAccessory = photoTypeSelection.includes("accessory");

    // Split images evenly across selected types; leftovers go to the earlier types.
    const photoTypeCounts = Object.fromEntries(
      photoTypeSelection.map((type, typeIndex) => [
        type,
        Math.floor(maxImages / photoTypeSelection.length) +
          (typeIndex < maxImages % photoTypeSelection.length ? 1 : 0),
      ])
    ) as Partial<Record<PhotoType, number>>;
    const interiorCount = wholeHouse ? 0 : (photoTypeCounts.interior ?? 0);
    const exteriorCount = wholeHouse ? 0 : (photoTypeCounts.exterior ?? 0);
    const accessoryCount = wholeHouse ? 0 : (photoTypeCounts.accessory ?? 0);

    const exteriorSelections = Object.fromEntries(
      exteriorOptionGroups.map(({ key, options }) => {
        const requested = payload.exterior?.[key];
        const valid = Array.isArray(requested)
          ? requested.filter((value) => options.includes(value))
          : [];

        return [key, valid.length > 0 ? valid : options];
      })
    ) as unknown as ExteriorOptions;

    const accessorySelections = Object.fromEntries(
      accessoryOptionGroups.map(({ key, options }) => {
        const requested = payload.accessory?.[key];
        const valid = Array.isArray(requested)
          ? requested.filter((value) => options.includes(value))
          : [];

        return [key, valid.length > 0 ? valid : options];
      })
    ) as unknown as AccessoryOptions;

    const exteriorSelectionsForSeed = includeExterior ? exteriorSelections : null;
    const accessorySelectionsForSeed = includeAccessory ? accessorySelections : null;
    const quality = FILE_SIZE_TO_QUALITY[fileSize];
    const size = FILE_SIZE_AND_ASPECT_TO_SIZE[fileSize][aspectRatio];
    const fallbackSize = FALLBACK_ASPECT_RATIO_TO_SIZE[aspectRatio];

    const seedInput = JSON.stringify({
      wholeHouse,
      wholeHouseShotIds: wholeHouse ? wholeHouseShotSelection.map((shot) => shot.id) : null,
      photoTypeSelection,
      exteriorSelectionsForSeed,
      accessorySelectionsForSeed,
      roomSelection,
      viewSelection,
      colorProfileSelection,
      focalPointSelection,
      windowSelection,
      wallSelection,
      ceilingSelection,
      ceilingLightSelection,
      roomSizeSelection,
      styleSelection,
      colorMoodSelection,
      colorIntensitySelection,
      colorStrategySelection,
      colorCoverageSelection,
      heroColorSelection,
      autoPaletteVariation,
      homeQualitySelection,
      wallColorPaletteSelection,
      randomizeWallColor,
      randomRunSalt,
      fileSize,
      aspectRatio,
    });

    const seededRandom = createSeededRandom(hashStringToSeed(seedInput));

    // One style per image, shuffled in rounds so each selected style is used evenly.
    const styleDeck: string[] = [];
    while (styleDeck.length < maxImages) {
      styleDeck.push(...shuffleArray(styleOptions, seededRandom));
    }

    const scenarios = createPromptScenarioSamples(
      roomSelection,
      interiorCount,
      (room, index) => ({
        room,
        style: styleDeck[index] ?? styleOptions[0] ?? "modern",
        view: pickRandomItem(viewSelection, seededRandom),
        colorProfile: pickRandomItem(colorProfileSelection, seededRandom),
        focalPoints:
          focalPointSelection.length > 0
            ? [pickRandomItem(focalPointSelection, seededRandom)]
            : [],
        windowStyle: pickRandomItem(windowSelection, seededRandom),
        wall: pickRandomItem(wallSelection, seededRandom),
        ceiling: pickRandomItem(ceilingSelection, seededRandom),
        ceilingLight: pickRandomItem(ceilingLightSelection, seededRandom),
        wallColorPalette: randomizeWallColor
          ? pickRandomItem(
              getWallColorRandomPoolByProfile(colorProfileSelection),
              seededRandom
            )
          : wallColorPaletteSelection,
      }),
      seededRandom
    );

    const promptRequests: PromptRequest[] = scenarios.map((scenario, index) => {
      const prompt = buildPrompt(
        scenario.room,
        roomSizeSelection,
        scenario.style,
        colorMoodSelection,
        colorIntensitySelection,
        colorStrategySelection,
        colorCoverageSelection,
        heroColorSelection,
        autoPaletteVariation,
        autoPaletteVariation ? index : 0,
        interiorCount,
        homeQualitySelection,
        scenario.wallColorPalette,
        [scenario.colorProfile],
        scenario.view,
        [scenario.windowStyle],
        scenario.focalPoints,
        [scenario.wall],
        [scenario.ceiling],
        [scenario.ceilingLight]
      );

      return {
        primaryPrompt: `${prompt}\n\nVariation ${index + 1} of ${interiorCount}.`,
        safetyFallbackPrompt: buildSafetyFallbackPrompt({
          room: scenario.room,
          roomSize: roomSizeSelection,
          style: scenario.style,
          homeQuality: homeQualitySelection,
          colorMood: colorMoodSelection,
          colorCoverage: colorCoverageSelection,
          wallColorPalette: scenario.wallColorPalette,
          colorProfile: scenario.colorProfile,
          view: scenario.view,
          windowStyle: scenario.windowStyle,
          wall: scenario.wall,
          ceiling: scenario.ceiling,
          ceilingLight: scenario.ceilingLight,
          focalPoints: scenario.focalPoints,
          index,
          maxImages: interiorCount,
        }),
      };
    });

    const exteriorScenarios: ExteriorScenario[] = Array.from(
      { length: exteriorCount },
      () => ({
        homeStyle: pickRandomItem(exteriorSelections.homeStyles, seededRandom),
        facadeMaterial: pickRandomItem(exteriorSelections.facadeMaterials, seededRandom),
        roofStyle: pickRandomItem(exteriorSelections.roofStyles, seededRandom),
        frontDoor: pickRandomItem(exteriorSelections.frontDoors, seededRandom),
        landscaping: pickRandomItem(exteriorSelections.landscaping, seededRandom),
        drivewayWalkway: pickRandomItem(exteriorSelections.drivewayWalkways, seededRandom),
        timeOfDay: pickRandomItem(exteriorSelections.timesOfDay, seededRandom),
        cameraView: pickRandomItem(exteriorSelections.cameraViews, seededRandom),
        garage: pickRandomItem(exteriorSelections.garages, seededRandom),
      })
    );

    exteriorScenarios.forEach((scenario, index) => {
      promptRequests.push({
        primaryPrompt: buildExteriorPrompt(
          scenario,
          homeQualitySelection,
          index,
          exteriorCount
        ),
        safetyFallbackPrompt: buildExteriorSafetyFallbackPrompt(
          scenario,
          index,
          exteriorCount
        ),
      });
    });

    const accessoryScenarios: AccessoryScenario[] = Array.from(
      { length: accessoryCount },
      () => ({
        item: pickRandomItem(accessorySelections.items, seededRandom),
        material: pickRandomItem(accessorySelections.materials, seededRandom),
        setting: pickRandomItem(accessorySelections.settings, seededRandom),
        lighting: pickRandomItem(accessorySelections.lighting, seededRandom),
        framing: pickRandomItem(accessorySelections.framing, seededRandom),
      })
    );

    accessoryScenarios.forEach((scenario, index) => {
      promptRequests.push({
        primaryPrompt: buildAccessoryPrompt(
          scenario,
          styleDeck[index] ?? styleOptions[0] ?? "modern",
          homeQualitySelection,
          index,
          accessoryCount
        ),
        safetyFallbackPrompt: buildAccessorySafetyFallbackPrompt(
          scenario,
          index,
          accessoryCount
        ),
      });
    });

    if (wholeHouse) {
      // Every choice below is made once so all rooms read as the same home.
      const houseStyle = pickRandomItem(styleOptions, seededRandom);
      const houseColorProfile = pickRandomItem(colorProfileSelection, seededRandom);
      const houseWindow = pickRandomItem(windowSelection, seededRandom);
      const houseWall = pickRandomItem(wallSelection, seededRandom);
      const houseCeiling = pickRandomItem(ceilingSelection, seededRandom);
      // Fixtures vary room to room: deal from a shuffled deck so none repeat until all are used.
      let ceilingLightDeck: string[] = [];
      const nextCeilingLight = (): string => {
        if (ceilingLightDeck.length === 0) {
          ceilingLightDeck = shuffleArray(ceilingLightSelection, seededRandom);
        }

        return ceilingLightDeck.pop() ?? ceilingLightSelection[0] ?? "recessed downlights";
      };
      const houseView = pickRandomItem(viewSelection, seededRandom);
      const houseWallPalette = randomizeWallColor
        ? pickRandomItem(getWallColorRandomPoolByProfile(colorProfileSelection), seededRandom)
        : wallColorPaletteSelection;
      const houseExterior: ExteriorScenario = {
        homeStyle: pickRandomItem(exteriorSelections.homeStyles, seededRandom),
        facadeMaterial: pickRandomItem(exteriorSelections.facadeMaterials, seededRandom),
        roofStyle: pickRandomItem(exteriorSelections.roofStyles, seededRandom),
        frontDoor: pickRandomItem(exteriorSelections.frontDoors, seededRandom),
        landscaping: pickRandomItem(exteriorSelections.landscaping, seededRandom),
        drivewayWalkway: pickRandomItem(exteriorSelections.drivewayWalkways, seededRandom),
        timeOfDay: pickRandomItem(exteriorSelections.timesOfDay, seededRandom),
        cameraView: "",
        garage: pickRandomItem(exteriorSelections.garages, seededRandom),
      };

      wholeHouseShotSelection.forEach((shot, index) => {
        const consistencyNote = `Whole-house consistency (critical): this is the ${shot.label} of ONE single cohesive ${houseStyle} home that also contains a ${houseExterior.facadeMaterial} exterior. Keep the same design style, color palette, wall finishes, flooring, trim, and hardware used throughout the entire house. Choose the light fixtures to suit this specific room; do not reuse the same fixture design as other rooms.`;

        if (shot.kind === "accessory") {
          const scenario: AccessoryScenario = {
            item: shot.item,
            material: pickRandomItem(accessorySelections.materials, seededRandom),
            setting: pickRandomItem(accessorySelections.settings, seededRandom),
            lighting: pickRandomItem(accessorySelections.lighting, seededRandom),
            framing: pickRandomItem(accessorySelections.framing, seededRandom),
          };

          promptRequests.push({
            primaryPrompt: `${buildAccessoryPrompt(
              scenario,
              houseStyle,
              homeQualitySelection,
              index,
              maxImages
            )}\n\n${consistencyNote}`,
            safetyFallbackPrompt: buildAccessorySafetyFallbackPrompt(
              scenario,
              index,
              maxImages
            ),
          });
          return;
        }

        if (shot.kind === "exterior") {
          const scenario = { ...houseExterior, cameraView: shot.cameraView };

          promptRequests.push({
            primaryPrompt: `${buildExteriorPrompt(
              scenario,
              homeQualitySelection,
              index,
              maxImages
            )}\n\n${consistencyNote}`,
            safetyFallbackPrompt: buildExteriorSafetyFallbackPrompt(
              scenario,
              index,
              maxImages
            ),
          });
          return;
        }

        const focalPoints =
          focalPointSelection.length > 0
            ? [pickRandomItem(focalPointSelection, seededRandom)]
            : [];
        const shotCeilingLight = nextCeilingLight();
        const prompt = buildPrompt(
          shot.room,
          roomSizeSelection,
          houseStyle,
          colorMoodSelection,
          colorIntensitySelection,
          colorStrategySelection,
          colorCoverageSelection,
          heroColorSelection,
          false,
          0,
          maxImages,
          homeQualitySelection,
          houseWallPalette,
          [houseColorProfile],
          houseView,
          [houseWindow],
          focalPoints,
          [houseWall],
          [houseCeiling],
          [shotCeilingLight]
        );

        promptRequests.push({
          primaryPrompt: `${prompt}\n\n${consistencyNote}\n\nVariation ${index + 1} of ${maxImages}.`,
          safetyFallbackPrompt: buildSafetyFallbackPrompt({
            room: shot.room,
            roomSize: roomSizeSelection,
            style: houseStyle,
            homeQuality: homeQualitySelection,
            colorMood: colorMoodSelection,
            colorCoverage: colorCoverageSelection,
            wallColorPalette: houseWallPalette,
            colorProfile: houseColorProfile,
            view: houseView,
            windowStyle: houseWindow,
            wall: houseWall,
            ceiling: houseCeiling,
            ceilingLight: shotCeilingLight,
            focalPoints,
            index,
            maxImages,
          }),
        });
      });
    }

    if (
      shouldUseBatchModeForImageGeneration(
        maxImages,
        PRIMARY_IMAGE_MODEL,
        payload.runAsBatch === true
      )
    ) {
      const submittedBatch = await submitImageBatchJob({
        prompts: promptRequests.map((entry) => entry.primaryPrompt),
        model: PRIMARY_IMAGE_MODEL,
        quality,
        size,
        metadata: {
          source: "interior-image-factory",
          requested_images: String(maxImages),
        },
      });

      return NextResponse.json({
        mode: "batch",
        batchId: submittedBatch.id,
        status: submittedBatch.status,
      });
    }

    const processPromptRequests = async (
      requests: PromptRequest[]
    ): Promise<{ results: ImagesResponse[]; finalSafetyFiltered: number }> => {
      const runResults: ImagesResponse[] = [];
      const safetyRetryQueue: string[] = [];
      let runFinalSafetyFiltered = 0;

      for (let i = 0; i < requests.length; i += CONCURRENCY) {
        const batch = requests.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map((promptRequest) =>
            generateImageWithFallback(
              promptRequest.primaryPrompt,
              quality,
              size,
              fallbackSize
            )
          )
        );

        batchResults.forEach((result, batchIndex) => {
          if (result.status === "fulfilled") {
            runResults.push(result.value);
            return;
          }

          if (isSafetyViolationError(result.reason)) {
            const promptRequest = batch[batchIndex];

            if (promptRequest) {
              safetyRetryQueue.push(promptRequest.safetyFallbackPrompt);
            }

            return;
          }

          throw result.reason;
        });
      }

      for (let i = 0; i < safetyRetryQueue.length; i += CONCURRENCY) {
        const batch = safetyRetryQueue.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map((prompt) =>
            generateImageWithFallback(prompt, quality, size, fallbackSize)
          )
        );

        batchResults.forEach((result) => {
          if (result.status === "fulfilled") {
            runResults.push(result.value);
            return;
          }

          if (isSafetyViolationError(result.reason)) {
            runFinalSafetyFiltered += 1;
            return;
          }

          throw result.reason;
        });
      }

      return { results: runResults, finalSafetyFiltered: runFinalSafetyFiltered };
    };

    const shouldRunPreflight = maxImages >= LARGE_RUN_PREFLIGHT_MIN_IMAGES;
    const preflightSample = shouldRunPreflight
      ? promptRequests.slice(0, LARGE_RUN_PREFLIGHT_SAMPLE_SIZE)
      : [];

    const remainingRequests = shouldRunPreflight
      ? promptRequests.slice(LARGE_RUN_PREFLIGHT_SAMPLE_SIZE)
      : promptRequests;

    const results: ImagesResponse[] = [];
    let finalSafetyFiltered = 0;

    if (preflightSample.length > 0) {
      const preflight = await processPromptRequests(preflightSample);
      results.push(...preflight.results);
      finalSafetyFiltered += preflight.finalSafetyFiltered;

      if (preflight.results.length === 0) {
        const costGuardError = new Error(
          "Large-run preflight failed: sampled prompts were filtered by safety checks. Adjust focal points or generate a smaller batch first to avoid extra charges."
        ) as Error & { status?: number };
        costGuardError.status = 422;
        throw costGuardError;
      }
    }

    if (remainingRequests.length > 0) {
      const remaining = await processPromptRequests(remainingRequests);
      results.push(...remaining.results);
      finalSafetyFiltered += remaining.finalSafetyFiltered;
    }

    if (results.length === 0) {
      throw new Error(
        "All prompt variations were rejected by the safety system. Try reducing max images or removing risky focal points."
      );
    }

    if (finalSafetyFiltered > 0) {
      console.warn(
        `Filtered ${finalSafetyFiltered} prompt variation(s) after safety fallback retry.`
      );
    }

    await mkdir(OUTPUT_DIR, { recursive: true });

    const runId = Date.now();

    await Promise.all(
      results.flatMap((result, resultIndex) =>
        (result.data ?? []).flatMap((image, imageIndex) => {
          if (!image.b64_json) {
            return [];
          }

          const fileName = `generated-${runId}-${resultIndex}-${imageIndex}.png`;
          const filePath = path.join(OUTPUT_DIR, fileName);

          return [writeFile(filePath, Buffer.from(image.b64_json, "base64"))];
        })
      )
    );

    await writeFile(
      path.join(OUTPUT_DIR, "responses.json"),
      JSON.stringify(results, null, 2),
      "utf-8"
    );

    return NextResponse.json(results);
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;

    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Image generation failed";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      }
    );
  }
}
