import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  accentWalls,
  accessories,
  backyards,
  basementFeatures,
  homeBarFeatures,
  homeGymFeatures,
  pantryFeatures,
  homeOfficeFeatures,
  laundryRoomFeatures,
  mudRoomFeatures,
  walkInClosetFeatures,
  cabinetStyles,
  ceilingLights,
  homeTheaterFeatures,
  ceilings,
  doorways,
  fireplaces,
  roomDividers,
  roomSizes,
  rooms,
  stairways,
  styles,
  wallPaintColors,
  walls,
} from "@/lib/combinations";
import { buildPrompt } from "@/lib/promptBuilder";

const OUTPUT_DIR = path.join(process.cwd(), "output");
const DEFAULT_MAX_PROMPTS = 12;
const ABSOLUTE_MAX_PROMPTS = 24;
const CONCURRENCY = 4;
const PRIMARY_IMAGE_MODEL = "gpt-image-2";
const FALLBACK_IMAGE_MODEL = "gpt-image-1";
const MAX_RATE_LIMIT_RETRIES = 5;

type FileSizeOption = "small" | "medium" | "large";
type AspectRatioOption = "1:1" | "4:5" | "9:16" | "16:9";
type CharacterIntensityOption = "subtle" | "balanced" | "bold";
type ImageData = {
  b64_json?: string | null;
};

type ImagesResponse = {
  data?: ImageData[];
};

type PromptError = Error & {
  prompt?: string;
  status?: number;
};

const FILE_SIZE_TO_QUALITY: Record<FileSizeOption, "low" | "medium" | "high"> = {
  small: "low",
  medium: "medium",
  large: "high",
};

const FILE_SIZE_AND_ASPECT_TO_SIZE: Record<FileSizeOption, Record<AspectRatioOption, `${number}x${number}`>> = {
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

const FALLBACK_ASPECT_RATIO_TO_SIZE: Record<AspectRatioOption, "1024x1024" | "1536x1024" | "1024x1536"> = {
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

async function generateWithRateLimitRetry(
  input: {
    model: string;
    prompt: string;
    quality: "low" | "medium" | "high";
    size: `${number}x${number}` | "1024x1024" | "1536x1024" | "1024x1536";
  }
): Promise<ImagesResponse> {
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

      const payload = { ...input, n: 1 };

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
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

      const parsed = JSON.parse(responseBody) as ImagesResponse;

      return parsed;
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
    const primaryResponse = await generateWithRateLimitRetry({
      model: PRIMARY_IMAGE_MODEL,
      prompt,
      quality,
      size,
    });

    return primaryResponse;
  } catch (error) {
    const message = extractErrorMessage(error).toLowerCase();
    const shouldFallback = message.includes("model") || message.includes("size");

    if (!shouldFallback) {
      throw error;
    }

    const fallbackResponse = await generateWithRateLimitRetry({
      model: FALLBACK_IMAGE_MODEL,
      prompt,
      quality,
      size: fallbackSize,
    });

    return fallbackResponse;
  }
}

export async function POST(request: Request) {
  try {
    let payload: {
      rooms?: string[];
      walls?: string[];
      accentWalls?: string[];
      doorways?: string[];
      stairways?: string[];
      accessories?: string[];
      accessoryNotes?: Record<string, string>;
      basementFeatures?: string[];
      homeBarFeatures?: string[];
      pantryFeatures?: string[];
      homeOfficeFeatures?: string[];
      laundryRoomFeatures?: string[];
      mudRoomFeatures?: string[];
      walkInClosetFeatures?: string[];
      homeGymFeatures?: string[];
      cabinetStyles?: string[];
      cabinetColor?: string;
      cabinetFinish?: string;
      homeTheaterFeatures?: string[];
      houseLevel?: string;
      wallPaintColors?: string[];
      roomDividers?: string[];
      fireplaces?: string[];
      ceilings?: string[];
      ceilingLights?: string[];
      backyard?: string;
      customRequest?: string;
      customRequestCount?: number;
      roomSize?: string;
      fileSize?: FileSizeOption;
      aspectRatio?: AspectRatioOption;
      characterIntensity?: CharacterIntensityOption;
      maxImages?: number;
    } = {};

    try {
      payload = (await request.json()) as {
        rooms?: string[];
        walls?: string[];
        accentWalls?: string[];
        doorways?: string[];
        stairways?: string[];
        accessories?: string[];
        basementFeatures?: string[];
        homeBarFeatures?: string[];
        pantryFeatures?: string[];
        homeOfficeFeatures?: string[];
        laundryRoomFeatures?: string[];
        mudRoomFeatures?: string[];
        walkInClosetFeatures?: string[];
        homeGymFeatures?: string[];
        cabinetStyles?: string[];
        cabinetColor?: string;
        cabinetFinish?: string;
        homeTheaterFeatures?: string[];
        wallPaintColors?: string[];
        roomDividers?: string[];
        fireplaces?: string[];
        ceilings?: string[];
        ceilingLights?: string[];
        backyard?: string;
        customRequest?: string;
        customRequestCount?: number;
        roomSize?: string;
        fileSize?: FileSizeOption;
        aspectRatio?: AspectRatioOption;
        characterIntensity?: CharacterIntensityOption;
        maxImages?: number;
      };
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
        ? payload.rooms.filter((room): room is string =>
            typeof room === "string" && rooms.includes(room)
          )
        : [];

    const roomSelection =
      selectedRooms.length > 0 ? selectedRooms : [rooms[0] ?? "living room"];

    const hasBasementRoomSelected = roomSelection.includes("basement");
    const hasTheaterRoomSelected = roomSelection.includes("in-home theater");

    const selectedWalls =
      Array.isArray(payload.walls)
        ? payload.walls.filter((wallType): wallType is string =>
            typeof wallType === "string" && walls.includes(wallType)
          )
        : [];

    const wallSelection =
      selectedWalls.length > 0 ? selectedWalls : [walls[0] ?? "white walls"];

    const selectedAccentWalls =
      Array.isArray(payload.accentWalls)
        ? payload.accentWalls.filter((accentWall): accentWall is string =>
            typeof accentWall === "string" && accentWalls.includes(accentWall)
          )
        : [];

    const accentWallSelection =
      selectedAccentWalls.length > 0
        ? selectedAccentWalls
        : [accentWalls[0] ?? "deep charcoal fluted accent wall"];

    const selectedDoorways =
      Array.isArray(payload.doorways)
        ? payload.doorways.filter((doorway): doorway is string =>
            typeof doorway === "string" && doorways.includes(doorway)
          )
        : [];

    const doorwaySelection =
      selectedDoorways.length > 0
        ? selectedDoorways
        : [doorways[0] ?? "solid walnut wood doorway surround"];

    const selectedStairways =
      Array.isArray(payload.stairways)
        ? payload.stairways.filter((stairway): stairway is string =>
            typeof stairway === "string" && stairways.includes(stairway)
          )
        : [];

    const stairwaySelection =
      selectedStairways.length > 0
        ? selectedStairways
        : [stairways[0] ?? "floating timber stairs with hidden supports"];

    const selectedAccessories =
      Array.isArray(payload.accessories)
        ? payload.accessories.filter((accessory): accessory is string =>
            typeof accessory === "string" && accessories.includes(accessory)
          )
        : [];

    const selectedAccessoryNotes =
      typeof payload.accessoryNotes === "object" && payload.accessoryNotes !== null
        ? Object.fromEntries(
            Object.entries(payload.accessoryNotes).filter(
              ([accessory, note]) =>
                typeof accessory === "string" &&
                typeof note === "string" &&
                selectedAccessories.includes(accessory)
            )
          ) as Record<string, string>
        : {};

    const accessorySelection =
      selectedAccessories.length > 0
        ? selectedAccessories
        : [accessories[0] ?? "oversized indoor olive tree in sculptural planter"];

    const accessoryDescriptionSelection = accessorySelection.map((accessory) => {
      const note = selectedAccessoryNotes[accessory]?.trim();
      return note ? `${accessory} (${note})` : accessory;
    });

    const selectedBasementFeatures =
      Array.isArray(payload.basementFeatures)
        ? payload.basementFeatures.filter((feature): feature is string =>
            typeof feature === "string" && basementFeatures.includes(feature)
          )
        : [];

    const basementFeatureSelection = hasBasementRoomSelected
      ? selectedBasementFeatures.length > 0
        ? selectedBasementFeatures
        : [basementFeatures[0] ?? "finished basement lounge with rich textures"]
      : [];

    const hasHomeBarFeatureFilter = Array.isArray(payload.homeBarFeatures);

    const selectedHomeBarFeatures = hasHomeBarFeatureFilter
      ? payload.homeBarFeatures.filter((feature): feature is string =>
          typeof feature === "string" && homeBarFeatures.includes(feature)
        )
      : [];

    const homeBarFeatureSelection = hasHomeBarFeatureFilter
      ? selectedHomeBarFeatures
      : [homeBarFeatures[0] ?? "wet bar with quartz countertop and brass accents"];

    const selectedHomeGymFeatures =
      Array.isArray(payload.homeGymFeatures)
        ? payload.homeGymFeatures.filter((feature): feature is string =>
            typeof feature === "string" && homeGymFeatures.includes(feature)
          )
        : [];

    const homeGymFeatureSelection =
      selectedHomeGymFeatures.length > 0
        ? selectedHomeGymFeatures
        : [
            homeGymFeatures[0] ??
              "mirrored wall with rubber flooring and free weights",
          ];

    const selectedPantryFeatures =
      Array.isArray(payload.pantryFeatures)
        ? payload.pantryFeatures.filter((feature): feature is string =>
            typeof feature === "string" && pantryFeatures.includes(feature)
          )
        : [];

    const pantryFeatureSelection =
      selectedPantryFeatures.length > 0
        ? selectedPantryFeatures
        : [pantryFeatures[0] ?? "walk-in pantry with open shelving and labeled containers"];

    const selectedHomeOfficeFeatures =
      Array.isArray(payload.homeOfficeFeatures)
        ? payload.homeOfficeFeatures.filter((feature): feature is string =>
            typeof feature === "string" && homeOfficeFeatures.includes(feature)
          )
        : [];

    const homeOfficeFeatureSelection =
      selectedHomeOfficeFeatures.length > 0
        ? selectedHomeOfficeFeatures
        : [homeOfficeFeatures[0] ?? "built-in desk with floating shelving and integrated task lighting"];

    const selectedLaundryRoomFeatures =
      Array.isArray(payload.laundryRoomFeatures)
        ? payload.laundryRoomFeatures.filter((feature): feature is string =>
            typeof feature === "string" && laundryRoomFeatures.includes(feature)
          )
        : [];

    const laundryRoomFeatureSelection =
      selectedLaundryRoomFeatures.length > 0
        ? selectedLaundryRoomFeatures
        : [
            laundryRoomFeatures[0] ??
              "stacked washer-dryer with folding counter and hanging rod",
          ];

    const selectedMudRoomFeatures =
      Array.isArray(payload.mudRoomFeatures)
        ? payload.mudRoomFeatures.filter((feature): feature is string =>
            typeof feature === "string" && mudRoomFeatures.includes(feature)
          )
        : [];

    const mudRoomFeatureSelection =
      selectedMudRoomFeatures.length > 0
        ? selectedMudRoomFeatures
        : [mudRoomFeatures[0] ?? "built-in bench with cubbies and durable tile flooring"];

    const selectedWalkInClosetFeatures =
      Array.isArray(payload.walkInClosetFeatures)
        ? payload.walkInClosetFeatures.filter((feature): feature is string =>
            typeof feature === "string" && walkInClosetFeatures.includes(feature)
          )
        : [];

    const walkInClosetFeatureSelection =
      selectedWalkInClosetFeatures.length > 0
        ? selectedWalkInClosetFeatures
        : [
            walkInClosetFeatures[0] ??
              "custom walk-in closet with island and soft-close drawers",
          ];

    const selectedHomeTheaterFeatures =
      Array.isArray(payload.homeTheaterFeatures)
        ? payload.homeTheaterFeatures.filter((feature): feature is string =>
            typeof feature === "string" && homeTheaterFeatures.includes(feature)
          )
        : [];

    const homeTheaterFeatureSelection = hasTheaterRoomSelected
      ? selectedHomeTheaterFeatures.length > 0
        ? selectedHomeTheaterFeatures
        : [
            homeTheaterFeatures[0] ??
              "large projection screen with surround sound",
          ]
      : [];

    const selectedRoomDividers =
      Array.isArray(payload.roomDividers)
        ? payload.roomDividers.filter((roomDivider): roomDivider is string =>
            typeof roomDivider === "string" && roomDividers.includes(roomDivider)
          )
        : [];

    const roomDividerSelection =
      selectedRoomDividers.length > 0
        ? selectedRoomDividers
        : [roomDividers[0] ?? "clear glass divider with slim black metal frame"];

    const hasFireplaceFilter = Array.isArray(payload.fireplaces);

    const selectedFireplaces = hasFireplaceFilter
      ? payload.fireplaces.filter((fireplace): fireplace is string =>
          typeof fireplace === "string" && fireplaces.includes(fireplace)
        )
      : [];

    const fireplaceSelection = hasFireplaceFilter
      ? selectedFireplaces
      : [fireplaces[0] ?? "floor-to-ceiling statement fireplace"];

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

    const selectedWallPaintColors =
      Array.isArray(payload.wallPaintColors)
        ? payload.wallPaintColors.filter((color): color is string =>
            typeof color === "string" && wallPaintColors.includes(color)
          )
        : [];

    const wallPaintColorSelection =
      selectedWallPaintColors.length > 0
        ? selectedWallPaintColors
        : [wallPaintColors[0] ?? "soft dove gray paint"];

    const selectedCabinetStyles =
      Array.isArray(payload.cabinetStyles)
        ? payload.cabinetStyles.filter((cabinetStyle): cabinetStyle is string =>
            typeof cabinetStyle === "string" && cabinetStyles.includes(cabinetStyle)
          )
        : [];

    const cabinetColor =
      typeof payload.cabinetColor === "string" && payload.cabinetColor.length > 0
        ? payload.cabinetColor
        : "matte white";

    const cabinetFinish =
      typeof payload.cabinetFinish === "string" && payload.cabinetFinish.length > 0
        ? payload.cabinetFinish
        : "white lacquer finish";

    const houseLevelSelection =
      typeof payload.houseLevel === "string" &&
      ["builder grade", "mid-level", "luxury"].includes(payload.houseLevel)
        ? payload.houseLevel
        : "builder grade";

    const roomSizeSelection =
      typeof payload.roomSize === "string" && roomSizes.includes(payload.roomSize)
        ? payload.roomSize
        : (roomSizes[1] ?? "standard room (180-280 sq ft)");

    const backyardSelection =
      typeof payload.backyard === "string" && backyards.includes(payload.backyard)
        ? payload.backyard
        : (backyards[0] ?? "regular neighborhood home backyard");

    const customRequest =
      typeof payload.customRequest === "string"
        ? payload.customRequest.trim()
        : "";

    const requestedCustomCount =
      typeof payload.customRequestCount === "number" && Number.isInteger(payload.customRequestCount)
        ? Math.max(0, Math.min(payload.customRequestCount, ABSOLUTE_MAX_PROMPTS))
        : DEFAULT_MAX_PROMPTS;

    const maxImages =
      typeof payload.maxImages === "number" && Number.isInteger(payload.maxImages)
        ? Math.max(1, Math.min(payload.maxImages, ABSOLUTE_MAX_PROMPTS))
        : DEFAULT_MAX_PROMPTS;

    const characterIntensitySelection: CharacterIntensityOption =
      payload.characterIntensity === "subtle" ||
      payload.characterIntensity === "balanced" ||
      payload.characterIntensity === "bold"
        ? payload.characterIntensity
        : "balanced";

    const quality = FILE_SIZE_TO_QUALITY[fileSize];
    const size = FILE_SIZE_AND_ASPECT_TO_SIZE[fileSize][aspectRatio];
    const fallbackSize = FALLBACK_ASPECT_RATIO_TO_SIZE[aspectRatio];

    const defaultRoom = roomSelection[0];
    const defaultWall = wallSelection[0];
    const defaultAccentWall = accentWallSelection[0];
    const defaultDoorway = doorwaySelection[0];
    const defaultStairway = stairwaySelection[0];
    const defaultAccessory = accessorySelection[0];
    const defaultRoomDivider = roomDividerSelection[0];
    const defaultFireplace =
      fireplaceSelection[0] ?? "no dedicated fireplace feature";
    const defaultCeiling = ceilingSelection[0];
    const defaultCeilingLight = ceilingLightSelection[0];
    const defaultWallPaintColor = wallPaintColorSelection[0];
    const defaultBasementFeature =
      basementFeatureSelection[0] ?? "finished basement lounge with rich textures";
    const defaultHomeTheaterFeature =
      homeTheaterFeatureSelection[0] ?? "large projection screen with surround sound";
    const defaultHomeBarFeature =
      homeBarFeatureSelection[0] ?? "no dedicated home bar feature";
    const defaultHomeGymFeature = homeGymFeatureSelection[0];
    const defaultCabinetStyle = selectedCabinetStyles[0] ?? "shaker-style cabinetry";
    const defaultCabinetColor = cabinetColor;
    const defaultCabinetFinish = cabinetFinish;

    const totalRequiredItems =
      roomSelection.length +
      wallSelection.length +
      accentWallSelection.length +
      doorwaySelection.length +
      stairwaySelection.length +
      accessorySelection.length +
      basementFeatureSelection.length +
      homeTheaterFeatureSelection.length +
      homeBarFeatureSelection.length +
      pantryFeatureSelection.length +
      homeOfficeFeatureSelection.length +
      laundryRoomFeatureSelection.length +
      homeGymFeatureSelection.length +
      roomDividerSelection.length +
      fireplaceSelection.length +
      ceilingSelection.length +
      ceilingLightSelection.length +
      wallPaintColorSelection.length +
      selectedCabinetStyles.length;

    const effectiveMaxImages = Math.min(
      ABSOLUTE_MAX_PROMPTS,
      Math.max(maxImages, totalRequiredItems)
    );

    const buildPromptFor = (
      {
        room = defaultRoom,
        style = styles[0],
        wallType = defaultWall,
        accentWallType = defaultAccentWall,
        doorway = defaultDoorway,
        stairway = defaultStairway,
        accessory = defaultAccessory,
        basementFeature = defaultBasementFeature,
        homeTheaterFeature = defaultHomeTheaterFeature,
        homeBarFeature = defaultHomeBarFeature,
        homeGymFeature = defaultHomeGymFeature,
        pantryFeature = pantryFeatureSelection[0],
        homeOfficeFeature = homeOfficeFeatureSelection[0],
        laundryRoomFeature = laundryRoomFeatureSelection[0],
        mudRoomFeature = mudRoomFeatureSelection[0],
        walkInClosetFeature = walkInClosetFeatureSelection[0],
        roomDivider = defaultRoomDivider,
        fireplace = defaultFireplace,
        ceiling = defaultCeiling,
        ceilingLight = defaultCeilingLight,
        wallPaintColor = defaultWallPaintColor,
        cabinetStyleSelection = defaultCabinetStyle,
        cabinetColorSelection = defaultCabinetColor,
        cabinetFinishSelection = defaultCabinetFinish,
      }: {
        room?: string;
        style?: string;
        wallType?: string;
        accentWallType?: string;
        doorway?: string;
        stairway?: string;
        accessory?: string;
        basementFeature?: string;
        homeTheaterFeature?: string;
        homeBarFeature?: string;
        homeGymFeature?: string;
        pantryFeature?: string;
        homeOfficeFeature?: string;
        laundryRoomFeature?: string;
        mudRoomFeature?: string;
        walkInClosetFeature?: string;
        roomDivider?: string;
        fireplace?: string;
        ceiling?: string;
        ceilingLight?: string;
        wallPaintColor?: string;
        cabinetStyleSelection?: string;
        cabinetColorSelection?: string;
        cabinetFinishSelection?: string;
      },
      requestOverride = customRequest
    ) =>
      buildPrompt(
        room,
        roomSizeSelection,
        style,
        backyardSelection,
        requestOverride,
        [wallType],
        [accentWallType],
        [doorway],
        [stairway],
        [accessory],
        [basementFeature],
        [homeTheaterFeature],
        [homeBarFeature],
        [homeGymFeature],
        [pantryFeature],
        [homeOfficeFeature],
        [laundryRoomFeature],
        [mudRoomFeature],
        [walkInClosetFeature],
        [roomDivider],
        [fireplace],
        [ceiling],
        [ceilingLight],
        [wallPaintColor],
        cabinetStyleSelection,
        cabinetColorSelection,
        cabinetFinishSelection,
        houseLevelSelection,
        characterIntensitySelection
      );

    const prompts: string[] = [];
    const seen = new Set<string>();

    const addPrompt = (prompt: string): boolean => {
      if (!seen.has(prompt) && prompts.length < effectiveMaxImages) {
        seen.add(prompt);
        prompts.push(prompt);
        return true;
      }

      return false;
    };

    const requestedPromptCandidates: string[] = [];
    const basePromptCandidates: string[] = [];

    const collectPrompts = (request: string, target: string[]) => {
      let styleCursor = 0;
      let doorwayCursor = 0;
      const nextStyle = () => {
        const selectedStyle = styles[styleCursor % styles.length] ?? styles[0] ?? "warm modern luxury";
        styleCursor += 1;
        return selectedStyle;
      };

      const nextDoorway = () => {
        const selectedDoorway =
          doorwaySelection[doorwayCursor % doorwaySelection.length] ?? defaultDoorway;
        doorwayCursor += 1;
        return selectedDoorway;
      };

      for (const room of roomSelection) {
        target.push(buildPromptFor({ room, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const wallType of wallSelection) {
        target.push(buildPromptFor({ wallType, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const accentWallType of accentWallSelection) {
        target.push(buildPromptFor({ accentWallType, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const doorway of doorwaySelection) {
        target.push(buildPromptFor({ doorway, style: nextStyle() }, request));
      }
      for (const stairway of stairwaySelection) {
        target.push(buildPromptFor({ stairway, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const accessory of accessoryDescriptionSelection) {
        target.push(buildPromptFor({ accessory, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const basementFeature of basementFeatureSelection) {
        target.push(buildPromptFor({ basementFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const homeTheaterFeature of homeTheaterFeatureSelection) {
        target.push(buildPromptFor({ homeTheaterFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const homeBarFeature of homeBarFeatureSelection) {
        target.push(buildPromptFor({ homeBarFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const homeGymFeature of homeGymFeatureSelection) {
        target.push(buildPromptFor({ homeGymFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const pantryFeature of pantryFeatureSelection) {
        target.push(buildPromptFor({ pantryFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const homeOfficeFeature of homeOfficeFeatureSelection) {
        target.push(buildPromptFor({ homeOfficeFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const laundryRoomFeature of laundryRoomFeatureSelection) {
        target.push(buildPromptFor({ laundryRoomFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const mudRoomFeature of mudRoomFeatureSelection) {
        target.push(buildPromptFor({ mudRoomFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const walkInClosetFeature of walkInClosetFeatureSelection) {
        target.push(buildPromptFor({ walkInClosetFeature, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const roomDivider of roomDividerSelection) {
        target.push(buildPromptFor({ roomDivider, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const fireplace of fireplaceSelection) {
        target.push(buildPromptFor({ fireplace, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const ceiling of ceilingSelection) {
        target.push(buildPromptFor({ ceiling, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const ceilingLight of ceilingLightSelection) {
        target.push(buildPromptFor({ ceilingLight, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const wallPaintColor of wallPaintColorSelection) {
        target.push(buildPromptFor({ wallPaintColor, style: nextStyle(), doorway: nextDoorway() }, request));
      }
      for (const cabinetStyleSelection of selectedCabinetStyles) {
        target.push(buildPromptFor({ cabinetStyleSelection, style: nextStyle(), doorway: nextDoorway() }, request));
      }

      const interleaved = styles.flatMap((style) =>
        roomSelection.map((room) => ({ room, style }))
      );

      for (const { room, style } of interleaved) {
        target.push(buildPromptFor({ room, style, doorway: nextDoorway() }, request));
      }
    };

    if (customRequest && requestedCustomCount > 0) {
      collectPrompts(customRequest, requestedPromptCandidates);
    }
    collectPrompts("", basePromptCandidates);

    const requestedCount = Math.min(requestedCustomCount, effectiveMaxImages);
    let addedRequested = 0;

    for (const prompt of requestedPromptCandidates) {
      if (addedRequested >= requestedCount) break;
      if (addPrompt(prompt)) {
        addedRequested += 1;
      }
    }

    for (const prompt of basePromptCandidates) {
      if (prompts.length >= effectiveMaxImages) break;
      addPrompt(prompt);
    }

    const results: ImagesResponse[] = [];

    await mkdir(OUTPUT_DIR, { recursive: true });

    const generationRunId = Date.now();

    for (let i = 0; i < prompts.length; i += CONCURRENCY) {
      const batch = prompts.slice(i, i + CONCURRENCY);

      // Enrich per-prompt errors so we can log which prompt caused a safety rejection
      const batchPromises = batch.map((prompt) =>
        generateImageWithFallback(prompt, quality, size, fallbackSize).catch((err) => {
          const e: PromptError = err instanceof Error ? err : new Error(String(err));
          // attach the prompt for context
          e.prompt = prompt;
          throw e;
        })
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (err) {
        // If the API rejected a prompt (safety system), log the prompt and the error
        const error: PromptError = err instanceof Error ? err : new Error(String(err));
        const offendingPrompt = error.prompt ?? "<unknown prompt>";
        const timestamp = new Date().toISOString();
        const logContent = `Time: ${timestamp}\nError: ${error.message}\nPrompt:\n${offendingPrompt}\n\nStack:\n${error.stack ?? "<no stack>"}\n`;
        const logName = `failed-prompt-${generationRunId}.txt`;
        const logPath = path.join(OUTPUT_DIR, logName);

        try {
          await writeFile(logPath, logContent, { encoding: "utf8" });
        } catch (writeErr) {
          console.error("Failed to write failed-prompt log:", writeErr);
        }

        // If the error contains a request id, include it in the client-facing message
        const match = /req_[0-9a-fA-F]+/i.exec(error.message);
        const requestId = match ? match[0] : undefined;

        const clientMessage = requestId
          ? `Image generation blocked by safety filter (request id: ${requestId}). The exact prompt has been saved to ${logName}.`
          : `Image generation failed: ${error.message}. The exact prompt has been saved to ${logName}.`;

        const clientError = new Error(clientMessage) as Error & { status?: number };
        clientError.status = error.status ?? 500;
        throw clientError;
      }
    }

    const runId = generationRunId;

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
        : "Failed to generate images";

    console.error("Image generation failed:", error);

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