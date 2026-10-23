import {
  AUTO_PALETTE_VARIATION_DEFAULT,
  COLOR_COVERAGE_DEFAULT,
  COLOR_INTENSITY_DEFAULT,
  COLOR_STRATEGY_DEFAULT,
  HERO_COLOR_DEFAULT,
  ceilingLights,
  ceilings,
  colorCoverages,
  colorMoods,
  colorProfiles,
  colorStrategies,
  focalPoints,
  heroColors,
  homeQualities,
  roomSizes,
  rooms,
  styles,
  views,
  walls,
  windowStyles,
  type ColorCoverage,
  type ColorMood,
  type ColorStrategy,
  type HeroColor,
  type RoomType,
} from "./combinations";
import type { RoomCounts } from "./roomMix";

export type FileSizeOption = "small" | "medium" | "large";
export type AspectRatioOption = "1:1" | "4:5" | "9:16" | "16:9";
export type HomeQuality =
  | "builder's grade layout"
  | "everyday"
  | "upscale"
  | "luxury"
  | "ultra luxury";

/** Every selection on the page. One object makes saving and restoring a setup trivial. */
export type Setup = {
  rooms: RoomType[];
  views: string[];
  colorProfiles: string[];
  focalPoints: string[];
  windowStyles: string[];
  walls: string[];
  ceilings: string[];
  ceilingLights: string[];
  roomSize: string;
  designStyle: string;
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  heroColor: HeroColor;
  colorIntensity: number;
  autoPaletteVariation: boolean;
  homeQuality: HomeQuality;
  randomizeWallColor: boolean;
  fileSize: FileSizeOption;
  aspectRatio: AspectRatioOption;
  maxImages: number;
  /** "even" splits images equally across rooms; "custom" uses `roomCounts`. */
  roomSplitMode: RoomSplitMode;
  roomCounts: RoomCounts;
};

export type RoomSplitMode = "even" | "custom";

export const MAX_IMAGE_CHOICES = [4, 8, 12, 16, 20, 24, 32, 50, 75, 100] as const;
export const ASPECT_RATIOS: AspectRatioOption[] = ["1:1", "4:5", "9:16", "16:9"];
export const FILE_SIZES: FileSizeOption[] = ["small", "medium", "large"];

export const DEFAULT_SETUP: Setup = {
  rooms: [rooms[0] ?? "living room"],
  views: [views[0] ?? "regular inner-city neighborhood"],
  colorProfiles: [colorProfiles[0] ?? "current balanced palette (default)"],
  focalPoints: [],
  windowStyles: [windowStyles[1] ?? "balanced windows (standard residential)"],
  walls: [walls[2] ?? "wallpaper walls"],
  ceilings: [ceilings[0] ?? "smooth white ceiling"],
  ceilingLights: [ceilingLights[0] ?? "recessed downlights"],
  roomSize: roomSizes[1] ?? "standard room (180-280 sq ft)",
  designStyle: styles[0] ?? "modern",
  colorMood: colorMoods[0] ?? "Warm Neutral",
  colorStrategy: COLOR_STRATEGY_DEFAULT,
  colorCoverage: COLOR_COVERAGE_DEFAULT,
  heroColor: HERO_COLOR_DEFAULT,
  colorIntensity: COLOR_INTENSITY_DEFAULT,
  autoPaletteVariation: AUTO_PALETTE_VARIATION_DEFAULT,
  homeQuality: "upscale",
  randomizeWallColor: false,
  fileSize: "small",
  aspectRatio: "16:9",
  maxImages: 12,
  roomSplitMode: "even",
  roomCounts: {},
};

/** The exact request body the page has always sent to /generate. */
export function buildGeneratePayload(setup: Setup) {
  const customSplit = setup.roomSplitMode === "custom" && setup.rooms.length >= 2;

  return {
    rooms: setup.rooms,
    outsideViews: setup.views,
    colorProfiles: setup.colorProfiles,
    focalPoints: setup.focalPoints,
    windowStyles: setup.windowStyles,
    walls: setup.walls,
    ceilings: setup.ceilings,
    ceilingLights: setup.ceilingLights,
    roomSize: setup.roomSize,
    designStyle: setup.designStyle,
    colorMood: setup.colorMood,
    colorStrategy: setup.colorStrategy,
    colorCoverage: setup.colorCoverage,
    heroColor: setup.heroColor,
    colorIntensity: setup.colorIntensity,
    colorPresence: setup.colorIntensity,
    autoPaletteVariation: setup.autoPaletteVariation,
    homeQuality: setup.homeQuality,
    randomizeWallColor: setup.randomizeWallColor,
    fileSize: setup.fileSize,
    aspectRatio: setup.aspectRatio,
    maxImages: setup.maxImages,
    ...(customSplit ? { roomCounts: setup.roomCounts } : {}),
  };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function listOf(value: unknown, allowed: readonly string[], fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.filter(
    (item): item is string => typeof item === "string" && allowed.includes(item)
  );
}

/**
 * Turns untrusted stored data into a valid Setup. Unknown or legacy values
 * fall back to the defaults instead of throwing.
 */
export function sanitizeSetup(raw: unknown): Setup {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETUP;
  const intensity = source.colorIntensity;

  return {
    rooms: listOf(source.rooms, rooms, d.rooms) as RoomType[],
    views: listOf(source.views, views, d.views),
    colorProfiles: listOf(source.colorProfiles, colorProfiles, d.colorProfiles),
    focalPoints: listOf(source.focalPoints, focalPoints, d.focalPoints),
    windowStyles: listOf(source.windowStyles, windowStyles, d.windowStyles),
    walls: listOf(source.walls, walls, d.walls),
    ceilings: listOf(source.ceilings, ceilings, d.ceilings),
    ceilingLights: listOf(source.ceilingLights, ceilingLights, d.ceilingLights),
    roomSize: oneOf(source.roomSize, roomSizes, d.roomSize),
    designStyle: oneOf(source.designStyle, styles, d.designStyle),
    colorMood: oneOf(source.colorMood, colorMoods, d.colorMood),
    colorStrategy: oneOf(source.colorStrategy, colorStrategies, d.colorStrategy),
    colorCoverage: oneOf(source.colorCoverage, colorCoverages, d.colorCoverage),
    heroColor: oneOf(source.heroColor, heroColors, d.heroColor),
    colorIntensity:
      typeof intensity === "number" && Number.isFinite(intensity)
        ? Math.max(0, Math.min(100, Math.round(intensity)))
        : d.colorIntensity,
    autoPaletteVariation:
      typeof source.autoPaletteVariation === "boolean"
        ? source.autoPaletteVariation
        : d.autoPaletteVariation,
    homeQuality: oneOf(source.homeQuality, homeQualities, d.homeQuality),
    randomizeWallColor:
      typeof source.randomizeWallColor === "boolean"
        ? source.randomizeWallColor
        : d.randomizeWallColor,
    fileSize: oneOf(source.fileSize, FILE_SIZES, d.fileSize),
    aspectRatio: oneOf(source.aspectRatio, ASPECT_RATIOS, d.aspectRatio),
    maxImages:
      typeof source.maxImages === "number" &&
      (MAX_IMAGE_CHOICES as readonly number[]).includes(source.maxImages)
        ? source.maxImages
        : d.maxImages,
    ...sanitizeRoomSplit(source, listOf(source.rooms, rooms, d.rooms)),
  };
}

function sanitizeRoomSplit(
  source: Record<string, unknown>,
  selectedRooms: string[]
): Pick<Setup, "roomSplitMode" | "roomCounts"> {
  const rawCounts =
    typeof source.roomCounts === "object" && source.roomCounts !== null
      ? (source.roomCounts as Record<string, unknown>)
      : {};
  const counts: RoomCounts = {};

  for (const room of selectedRooms) {
    const count = rawCounts[room];
    counts[room] = typeof count === "number" && Number.isInteger(count) && count >= 0 ? count : 0;
  }

  const maxImages =
    typeof source.maxImages === "number" &&
    (MAX_IMAGE_CHOICES as readonly number[]).includes(source.maxImages)
      ? source.maxImages
      : DEFAULT_SETUP.maxImages;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  // Old setups have no counts, and counts that no longer fit fall back to the even split.
  if (source.roomSplitMode !== "custom" || total !== maxImages) {
    return { roomSplitMode: "even", roomCounts: {} };
  }

  return { roomSplitMode: "custom", roomCounts: counts };
}
