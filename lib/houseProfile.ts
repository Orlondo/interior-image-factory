import { singleHeroColors, views } from "./combinations";
import { exteriorTimesOfDay } from "./exteriorCombinations";
import type { ExteriorScenario } from "./exteriorPromptBuilder";

/**
 * House profile: one saved set of choices that every room of a house shares, so a run of rooms looks like
 * one home (same floors, wall colour, wood, metals, window view and palette). Everything is optional.
 * An empty profile changes nothing: prompts, seeds and saved batch details stay exactly as they were.
 *
 * The option lists are plain words, not tied to any channel or brand, so any project can use them.
 */

export const houseFloors = [
  "light oak hardwood",
  "wide-plank white oak",
  "honey oak hardwood",
  "dark walnut hardwood",
  "herringbone wood",
  "polished concrete",
  "large-format porcelain tile",
  "natural stone tile",
  "terrazzo",
  "warm gray vinyl plank",
] as const;

export const houseWallColors = [
  "warm white",
  "warm cream",
  "soft greige",
  "pale sage green",
  "dusty blue",
  "blush plaster",
  "terracotta clay",
  "olive green",
  "soft charcoal",
  "deep navy",
] as const;

export const houseWoodTones = [
  "pale whitewashed oak",
  "natural light oak",
  "honey oak",
  "warm walnut",
  "rich espresso",
  "ebonized black",
] as const;

export const houseMetals = [
  "brushed brass",
  "matte black",
  "polished nickel",
  "chrome",
  "aged bronze",
  "copper",
  "mixed brass and matte black",
] as const;

/** The palette is 4 to 6 of the app's named hero colours. */
export const HOUSE_PALETTE_MAX = 6;
/** Remembers the window view of the last run, so the page can nudge a new house toward a different one. */
export const LAST_HOUSE_VIEW_KEY = "iif.lastHouseView.v1";
export const housePaletteChoices: readonly string[] = singleHeroColors;

export type HouseProfile = {
  floor: string;
  wallColor: string;
  woodTone: string;
  metal: string;
  /** One of the window views. Locks every room of the house to it. */
  view: string;
  palette: string[];
};

export const EMPTY_HOUSE: HouseProfile = {
  floor: "",
  wallColor: "",
  woodTone: "",
  metal: "",
  view: "",
  palette: [],
};

export function isHouseSet(house: HouseProfile | null | undefined): boolean {
  return Boolean(
    house && (house.floor || house.wallColor || house.woodTone || house.metal || house.view || house.palette.length > 0)
  );
}

function pick(value: unknown, allowed: readonly string[]): string {
  return typeof value === "string" && allowed.includes(value) ? value : "";
}

/** Reads a saved or posted profile, keeping only known options. Anything else becomes "not set". */
export function sanitizeHouse(raw: unknown): HouseProfile {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const palette = Array.isArray(source.palette)
    ? source.palette.filter((c): c is string => typeof c === "string" && housePaletteChoices.includes(c))
    : [];

  return {
    floor: pick(source.floor, houseFloors),
    wallColor: pick(source.wallColor, houseWallColors),
    woodTone: pick(source.woodTone, houseWoodTones),
    metal: pick(source.metal, houseMetals),
    view: pick(source.view, views),
    palette: [...new Set(palette)].slice(0, HOUSE_PALETTE_MAX),
  };
}

/** The lines added to every room's prompt, or "" when the profile is empty. */
export function houseProfileLines(house: HouseProfile | null | undefined): string {
  if (!house || !isHouseSet(house)) {
    return "";
  }

  const lines = ["House profile (this is one single house: keep these identical in every room and never vary them between images):"];

  if (house.floor) lines.push(`- Flooring: ${house.floor}, the same flooring wherever the floor is visible.`);
  if (house.wallColor) lines.push(`- Wall color: ${house.wallColor} on the main walls.`);
  if (house.woodTone) lines.push(`- Wood tone: ${house.woodTone} for all visible wood (cabinetry, trim, furniture).`);
  if (house.metal) lines.push(`- Metal finishes: ${house.metal} for fixtures, hardware and lighting.`);
  if (house.view) lines.push(`- Window view: ${house.view}, the same view from every window of the house.`);
  if (house.palette.length > 0) {
    lines.push(`- House palette: ${house.palette.join(", ")}. Most rooms must clearly show these colors in furniture, art and decor.`);
  }

  return lines.join("\n");
}

/** The one line exterior photos get: the palette shows in the planting, door and trim. */
export function houseExteriorLines(house: HouseProfile | null | undefined): string {
  if (!house || house.palette.length === 0) {
    return "";
  }

  return `House palette: ${house.palette.join(", ")}. Let these colors show in the front door, trim, planting and landscape lighting.`;
}

/** "oak floor, brass, 5 colors" style text for the page and the saved batch details. */
export function describeHouse(house: HouseProfile | null | undefined): string {
  if (!house || !isHouseSet(house)) {
    return "";
  }

  return [
    house.floor,
    house.wallColor && `${house.wallColor} walls`,
    house.woodTone,
    house.metal,
    house.view,
    house.palette.length > 0 && `${house.palette.length} palette colors`,
  ]
    .filter(Boolean)
    .join(", ");
}

// ---------------------------------------------------------------------------------------------
// the house tour: a fixed order for a whole-house video
// ---------------------------------------------------------------------------------------------

/** Entry, living room, kitchen, dining room, bedroom, bathroom. Breather rooms can be added after these. */
export const TOUR_ROOMS = ["foyer", "living room", "kitchen", "dining room", "bedroom", "bathroom"];

/** A house tour opens on a daytime exterior and closes on the same house at dusk. */
export const TOUR_OPENING_LIGHT = exteriorTimesOfDay[0] as string;
export const TOUR_CLOSING_LIGHT = exteriorTimesOfDay[2] as string;
export const TOUR_MIN_IMAGES = 4;

/** A tour always has two exterior photos; every other image is a room. */
export function tourCounts(maxImages: number): { interior: number; exterior: number } {
  return { interior: Math.max(0, maxImages - 2), exterior: 2 };
}

/**
 * Where each image goes in the finished run. A run is made as the rooms, then the exteriors; a tour puts
 * the first exterior first and the second last. Entry n of the result is the old index of the image that
 * should sit in position n.
 */
export function tourOrder(interiorCount: number): number[] {
  return [interiorCount, ...Array.from({ length: interiorCount }, (_, index) => index), interiorCount + 1];
}

export function applyOrder<T>(items: readonly T[], order: readonly number[]): T[] {
  return order.map((from) => items[from] as T);
}

/** The two tour exteriors are one house: the same facade and landscaping, in daytime and at dusk. */
export function tourExteriors(base: readonly ExteriorScenario[]): ExteriorScenario[] {
  const first = base[0] as ExteriorScenario;

  return [
    { ...first, timeOfDay: TOUR_OPENING_LIGHT },
    { ...first, timeOfDay: TOUR_CLOSING_LIGHT },
  ];
}
