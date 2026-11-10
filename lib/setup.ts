import {
  AUTO_PALETTE_VARIATION_DEFAULT,
  COLOR_COVERAGE_DEFAULT,
  COLOR_INTENSITY_DEFAULT,
  COLOR_STRATEGY_DEFAULT,
  HERO_COLOR_DEFAULT,
  ceilingLights,
  ceilings,
  cameras,
  colorCoverages,
  colorMoods,
  colorProfiles,
  colorStrategies,
  conditions,
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
import {
  accessoryOptionGroups,
  createEmptyAccessoryOptions,
  type AccessoryOptions,
} from "./accessoryCombinations";
import {
  createEmptyExteriorOptions,
  effectivePhotoTypes,
  photoTypeCounts,
  exteriorOptionGroups,
  type ExteriorOptions,
  type PhotoType,
} from "./exteriorCombinations";
import type { RoomCounts } from "./roomMix";
import { MAX_ANGLES } from "./roomSets";

export type FileSizeOption = "small" | "medium" | "large";
export type AspectRatioOption = "1:1" | "4:5" | "9:16" | "16:9";
export type Condition = (typeof conditions)[number];
export type Camera = (typeof cameras)[number];
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
  /** One or more styles. A batch spreads them evenly across its images; empty means the default style. */
  designStyles: string[];
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  heroColor: HeroColor;
  colorIntensity: number;
  autoPaletteVariation: boolean;
  homeQuality: HomeQuality;
  condition: Condition;
  /** "dramatic" or "cinematic" gives every image its own angle; "standard" is the usual wide, level shot. */
  camera: Camera;
  randomizeWallColor: boolean;
  fileSize: FileSizeOption;
  aspectRatio: AspectRatioOption;
  maxImages: number;
  /** "even" splits images equally across rooms; "custom" uses `roomCounts`. */
  roomSplitMode: RoomSplitMode;
  roomCounts: RoomCounts;
  /** Images of the same room shown from different angles (1 = every image is its own room). */
  anglesPerRoom: number;
  /** Rooms made to look like one house: shared style, palette and finishes. */
  sameHouse: boolean;
  /** What the run makes: interior rooms, exterior photos, accessory close-ups, or a mix (images are split evenly). */
  photoTypes: PhotoType[];
  /** Exterior choices. A group with nothing picked uses every option. */
  exterior: ExteriorOptions;
  /** Accessory close-up choices. A group with nothing picked uses every option. */
  accessory: AccessoryOptions;
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
  designStyles: [styles[0] ?? "modern"],
  colorMood: colorMoods[0] ?? "Warm Neutral",
  colorStrategy: COLOR_STRATEGY_DEFAULT,
  colorCoverage: COLOR_COVERAGE_DEFAULT,
  heroColor: HERO_COLOR_DEFAULT,
  colorIntensity: COLOR_INTENSITY_DEFAULT,
  autoPaletteVariation: AUTO_PALETTE_VARIATION_DEFAULT,
  homeQuality: "upscale",
  condition: "pristine",
  camera: "standard",
  randomizeWallColor: false,
  fileSize: "small",
  aspectRatio: "16:9",
  maxImages: 12,
  roomSplitMode: "even",
  roomCounts: {},
  anglesPerRoom: 1,
  sameHouse: false,
  photoTypes: ["interior"],
  exterior: createEmptyExteriorOptions(),
  accessory: createEmptyAccessoryOptions(),
};

/** The styles a run uses: the picked ones, or the default style when none is picked. */
export function effectiveStyles(setup: Pick<Setup, "designStyles">): string[] {
  return setup.designStyles.length > 0 ? setup.designStyles : [styles[0] ?? "modern"];
}

/** "modern", "modern and japandi", or "3 styles" for the page's summaries. */
export function describeStyles(picked: readonly string[]): string {
  return picked.length <= 2 ? picked.join(" and ") : `${picked.length} styles`;
}

/** Reads a list of styles, or the single `designStyle` that setups saved before multi-style hold. */
function sanitizeStyles(source: Record<string, unknown>): string[] {
  if (Array.isArray(source.designStyles)) {
    return listOf(source.designStyles, styles, []);
  }

  return [oneOf(source.designStyle, styles, DEFAULT_SETUP.designStyles[0] as string)];
}

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
    designStyle: effectiveStyles(setup)[0] as string,
    // Only sent when more than one style is picked, so the default payload stays what it was before multi-style.
    ...(effectiveStyles(setup).length > 1 ? { designStyles: effectiveStyles(setup) } : {}),
    colorMood: setup.colorMood,
    colorStrategy: setup.colorStrategy,
    colorCoverage: setup.colorCoverage,
    heroColor: setup.heroColor,
    colorIntensity: setup.colorIntensity,
    colorPresence: setup.colorIntensity,
    autoPaletteVariation: setup.autoPaletteVariation,
    homeQuality: setup.homeQuality,
    // Only sent when set, so the default payload stays exactly what it was before Condition existed.
    ...(setup.condition === "pristine" ? {} : { condition: setup.condition }),
    // Only sent when set, so the default payload stays exactly what it was before Camera existed.
    ...(setup.camera === "standard" ? {} : { camera: setup.camera }),
    randomizeWallColor: setup.randomizeWallColor,
    fileSize: setup.fileSize,
    aspectRatio: setup.aspectRatio,
    maxImages: setup.maxImages,
    ...(customSplit ? { roomCounts: setup.roomCounts } : {}),
    // Only sent when set, so the default payload stays exactly what it was before room sets existed.
    ...(setup.anglesPerRoom > 1 ? { anglesPerRoom: setup.anglesPerRoom } : {}),
    ...(setup.sameHouse ? { sameHouse: true } : {}),
    // Only sent when exterior or accessory photos are on, so the default payload stays what it was before photo types existed.
    ...(effectivePhotoTypes(setup.photoTypes).some((type) => type !== "interior")
      ? { photoTypes: effectivePhotoTypes(setup.photoTypes) }
      : {}),
    ...(effectivePhotoTypes(setup.photoTypes).includes("exterior") ? { exterior: setup.exterior } : {}),
    ...(effectivePhotoTypes(setup.photoTypes).includes("accessory") ? { accessory: setup.accessory } : {}),
  };
}

/** How many of a run's images are interior rooms (all of them unless exterior photos are on). */
export function interiorImageCount(setup: Pick<Setup, "maxImages" | "photoTypes">): number {
  return photoTypeCounts(setup.maxImages, setup.photoTypes).interior;
}

/** How many of a run's images are accessory close-ups. */
export function accessoryImageCount(setup: Pick<Setup, "maxImages" | "photoTypes">): number {
  return photoTypeCounts(setup.maxImages, setup.photoTypes).accessory;
}

/** How many of a run's images are exterior photos. */
export function exteriorImageCount(setup: Pick<Setup, "maxImages" | "photoTypes">): number {
  return photoTypeCounts(setup.maxImages, setup.photoTypes).exterior;
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
    designStyles: sanitizeStyles(source),
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
    condition: oneOf(source.condition, conditions, d.condition),
    camera: oneOf(source.camera, cameras, d.camera),
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
    anglesPerRoom:
      typeof source.anglesPerRoom === "number" &&
      Number.isInteger(source.anglesPerRoom) &&
      source.anglesPerRoom >= 1 &&
      source.anglesPerRoom <= MAX_ANGLES
        ? source.anglesPerRoom
        : d.anglesPerRoom,
    sameHouse: typeof source.sameHouse === "boolean" ? source.sameHouse : d.sameHouse,
    photoTypes: Array.isArray(source.photoTypes) ? effectivePhotoTypes(source.photoTypes as string[]) : d.photoTypes,
    exterior: sanitizeExterior(source.exterior),
    accessory: sanitizeAccessory(source.accessory),
  };
}

/** Reads saved exterior choices, keeping only known options. Nothing picked stays empty (every option). */
function sanitizeExterior(raw: unknown): ExteriorOptions {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const exterior = createEmptyExteriorOptions();

  for (const { key, options } of exteriorOptionGroups) {
    exterior[key] = listOf(source[key], options, []);
  }

  return exterior;
}

/** Reads saved accessory choices, keeping only known options. Nothing picked stays empty (every option). */
function sanitizeAccessory(raw: unknown): AccessoryOptions {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const accessory = createEmptyAccessoryOptions();

  for (const { key, options } of accessoryOptionGroups) {
    accessory[key] = listOf(source[key], options, []);
  }

  return accessory;
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
