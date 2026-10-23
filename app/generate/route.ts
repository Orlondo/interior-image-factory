import { NextResponse } from "next/server";
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
  type HeroColor,
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
import { submitImageBatchJob } from "@/lib/openaiBatch";
import { buildPrompt } from "../../lib/promptBuilder";
import {
  buildPendingManifest,
  writeCompletedBatch,
  writePendingManifest,
} from "@/lib/batchManifest";
import { buildScenarioPlan } from "@/lib/scenarioPlan";
import {
  countsInOrder,
  evenSplit,
  validateRoomCounts,
  type RoomCounts,
} from "@/lib/roomMix";
import {
  getDefaultWallColorPalette,
  getWallColorRandomPool,
} from "@/lib/wallColorPalette";

const OUTPUT_DIR = path.join(process.cwd(), "output");
const DEFAULT_MAX_PROMPTS = 12;
const ABSOLUTE_MAX_PROMPTS = 200;
const BATCH_MODE_THRESHOLD = 24;
const CONCURRENCY = 4;
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
  fileSize?: FileSizeOption;
  aspectRatio?: AspectRatioOption;
  maxImages?: number;
  roomCounts?: unknown;
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
  ] as const;

  arrayFields.forEach((field) => {
    if (field in input && input[field] !== undefined && !isStringArray(input[field])) {
      errors.push(`${field} must be an array of strings.`);
    }
  });

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

function normalizePaletteFamilyFromPayload(heroColor: string | undefined): HeroColor {
  if (!heroColor) {
    return HERO_COLOR_DEFAULT;
  }

  if (heroColors.includes(heroColor as HeroColor)) {
    return heroColor as HeroColor;
  }

  // "Mixed" is the one legacy value that is not a current option.
  return heroColor === "Mixed" ? "Designer Mixed" : HERO_COLOR_DEFAULT;
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

    const styleSelection =
      typeof payload.designStyle === "string" && styles.includes(payload.designStyle)
        ? payload.designStyle
        : (styles[0] ?? "modern");

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
    const wallColorRandomPool = getWallColorRandomPool({
      colorProfileSelection,
      colorStrategy: colorStrategySelection,
      colorCoverage: colorCoverageSelection,
    });

    const maxImages =
      typeof payload.maxImages === "number" && Number.isInteger(payload.maxImages)
        ? Math.max(1, Math.min(payload.maxImages, ABSOLUTE_MAX_PROMPTS))
        : DEFAULT_MAX_PROMPTS;

    if (payload.roomCounts !== undefined) {
      const roomCountsError = validateRoomCounts(payload.roomCounts, roomSelection, maxImages);

      if (roomCountsError) {
        return NextResponse.json(
          { error: "Invalid request payload", details: [roomCountsError] },
          { status: 400 }
        );
      }
    }

    const roomCountsByRoom: RoomCounts =
      payload.roomCounts === undefined
        ? evenSplit(roomSelection, maxImages)
        : (payload.roomCounts as RoomCounts);

    const quality = FILE_SIZE_TO_QUALITY[fileSize];
    const size = FILE_SIZE_AND_ASPECT_TO_SIZE[fileSize][aspectRatio];
    const fallbackSize = FALLBACK_ASPECT_RATIO_TO_SIZE[aspectRatio];

    const seedInput = JSON.stringify({
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
      roomCounts: payload.roomCounts ?? null,
    });

    const seededRandom = createSeededRandom(hashStringToSeed(seedInput));

    const scenarios = buildScenarioPlan({
      rooms: roomSelection,
      counts: countsInOrder(roomSelection, roomCountsByRoom),
      views: viewSelection,
      colorProfiles: colorProfileSelection,
      focalPoints: focalPointSelection,
      windowStyles: windowSelection,
      walls: wallSelection,
      ceilings: ceilingSelection,
      ceilingLights: ceilingLightSelection,
      random: seededRandom,
      pickWallColorPalette: () =>
        randomizeWallColor
          ? pickRandomItem(wallColorRandomPool, seededRandom)
          : wallColorPaletteSelection,
    });

    if (scenarios.length === 0) {
      throw new Error("No prompts could be generated from the selected options");
    }

    const prompts = Array.from({ length: maxImages }, (_, index) => {
      const scenario = scenarios[index];

      if (!scenario) {
        throw new Error("Unable to select a prompt scenario");
      }

      const prompt = buildPrompt(
        scenario.room,
        roomSizeSelection,
        styleSelection,
        colorMoodSelection,
        colorIntensitySelection,
        colorStrategySelection,
        colorCoverageSelection,
        heroColorSelection,
        autoPaletteVariation,
        autoPaletteVariation ? index : 0,
        maxImages,
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

      return `${prompt}\n\nVariation ${index + 1} of ${maxImages}.`;
    });

    const batchSettings = {
      designStyle: styleSelection,
      homeQuality: homeQualitySelection,
      roomSize: roomSizeSelection,
      colorMood: colorMoodSelection,
      colorIntensity: colorIntensitySelection,
      colorStrategy: colorStrategySelection,
      colorCoverage: colorCoverageSelection,
      heroColor: heroColorSelection,
      aspectRatio,
      fileSize,
      quality,
      size,
    };

    if (maxImages > BATCH_MODE_THRESHOLD) {
      const submittedBatch = await submitImageBatchJob({
        prompts,
        model: PRIMARY_IMAGE_MODEL,
        quality,
        size,
        metadata: {
          source: "interior-image-factory",
          requested_images: String(maxImages),
        },
      });

      // The details of each image are saved now, because the result route runs later
      // and cannot know them. A failure here must not hide the submitted batch.
      try {
        await writePendingManifest(
          OUTPUT_DIR,
          buildPendingManifest({
            id: submittedBatch.id,
            mode: "openai-batch",
            settings: batchSettings,
            scenarios,
          })
        );
      } catch (error) {
        console.error("Could not save batch details", error);
      }

      return NextResponse.json({
        mode: "batch",
        batchId: submittedBatch.id,
        status: submittedBatch.status,
      });
    }

    const results: ImagesResponse[] = [];

    for (let i = 0; i < prompts.length; i += CONCURRENCY) {
      const batch = prompts.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((prompt) =>
          generateImageWithFallback(prompt, quality, size, fallbackSize)
        )
      );

      results.push(...batchResults);
    }

    const savedImages = results.flatMap((result, resultIndex) => {
      const b64 = result.data?.find((image) => image.b64_json)?.b64_json;
      return b64 ? [{ index: resultIndex, b64 }] : [];
    });

    await writeCompletedBatch(
      OUTPUT_DIR,
      buildPendingManifest({
        id: `run-${Date.now()}`,
        mode: "direct",
        settings: batchSettings,
        scenarios,
      }),
      savedImages
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
