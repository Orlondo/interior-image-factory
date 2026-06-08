import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  accentWalls,
  accessories,
  backyards,
  ceilingLights,
  ceilings,
  doorways,
  fireplaces,
  roomDividers,
  roomSizes,
  rooms,
  stairways,
  styles,
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
type ImageData = {
  b64_json?: string | null;
};

type ImagesResponse = {
  data?: ImageData[];
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
      roomDividers?: string[];
      fireplaces?: string[];
      ceilings?: string[];
      ceilingLights?: string[];
      backyard?: string;
      roomSize?: string;
      fileSize?: FileSizeOption;
      aspectRatio?: AspectRatioOption;
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
        roomDividers?: string[];
        fireplaces?: string[];
        ceilings?: string[];
        ceilingLights?: string[];
        backyard?: string;
        roomSize?: string;
        fileSize?: FileSizeOption;
        aspectRatio?: AspectRatioOption;
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

    const accessorySelection =
      selectedAccessories.length > 0
        ? selectedAccessories
        : [accessories[0] ?? "oversized indoor olive tree in sculptural planter"];

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

    const selectedFireplaces =
      Array.isArray(payload.fireplaces)
        ? payload.fireplaces.filter((fireplace): fireplace is string =>
            typeof fireplace === "string" && fireplaces.includes(fireplace)
          )
        : [];

    const fireplaceSelection =
      selectedFireplaces.length > 0
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

    const roomSizeSelection =
      typeof payload.roomSize === "string" && roomSizes.includes(payload.roomSize)
        ? payload.roomSize
        : (roomSizes[1] ?? "standard room (180-280 sq ft)");

    const backyardSelection =
      typeof payload.backyard === "string" && backyards.includes(payload.backyard)
        ? payload.backyard
        : (backyards[0] ?? "regular neighborhood home backyard");

    const maxImages =
      typeof payload.maxImages === "number" && Number.isInteger(payload.maxImages)
        ? Math.max(1, Math.min(payload.maxImages, ABSOLUTE_MAX_PROMPTS))
        : DEFAULT_MAX_PROMPTS;

    const quality = FILE_SIZE_TO_QUALITY[fileSize];
    const size = FILE_SIZE_AND_ASPECT_TO_SIZE[fileSize][aspectRatio];
    const fallbackSize = FALLBACK_ASPECT_RATIO_TO_SIZE[aspectRatio];

    const prompts = roomSelection
      .flatMap((room) =>
        styles.map((style) =>
          buildPrompt(
            room,
            roomSizeSelection,
            style,
            backyardSelection,
            wallSelection,
            accentWallSelection,
            doorwaySelection,
            stairwaySelection,
            accessorySelection,
            roomDividerSelection,
            fireplaceSelection,
            ceilingSelection,
            ceilingLightSelection
          )
        )
      )
      .slice(0, maxImages);

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