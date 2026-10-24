import { sanitizeSetup, type Setup } from "./setup";
import { sanitizeLookDetails, type LookDetails, type LookValues } from "./looks";
import {
  colorCoverages,
  colorMoods,
  colorStrategies,
  heroColors,
  type ColorCoverage,
  type ColorMood,
  type ColorStrategy,
  type HeroColor,
} from "./combinations";

export const SAVED_LOOKS_KEY = "iif.savedLooks.v1";
export const SAVED_SETUPS_KEY = "iif.savedSetups.v1";
export const MAX_NAME_LENGTH = 40;

export type SavedLook = { id: string; name: string; values: LookValues; details?: LookDetails };
export type SavedSetup = { id: string; name: string; setup: Setup };

/** The small slice of the Storage API we use, so tests can pass a fake. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type SaveResult<T> = { ok: true; items: T[] } | { ok: false; message: string };

export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

function sanitizeLookValues(raw: unknown): LookValues | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const v = raw as Record<string, unknown>;
  const isIn = (list: readonly string[], value: unknown) =>
    typeof value === "string" && list.includes(value);

  if (
    !isIn(colorMoods, v.colorMood) ||
    !isIn(colorStrategies, v.colorStrategy) ||
    !isIn(colorCoverages, v.colorCoverage) ||
    !isIn(heroColors, v.heroColor) ||
    typeof v.colorIntensity !== "number" ||
    !Number.isFinite(v.colorIntensity) ||
    typeof v.autoPaletteVariation !== "boolean"
  ) {
    return null;
  }

  return {
    colorMood: v.colorMood as ColorMood,
    colorStrategy: v.colorStrategy as ColorStrategy,
    colorCoverage: v.colorCoverage as ColorCoverage,
    heroColor: v.heroColor as HeroColor,
    colorIntensity: Math.max(0, Math.min(100, Math.round(v.colorIntensity))),
    autoPaletteVariation: v.autoPaletteVariation,
  };
}

function parseList(serialized: string | null): unknown[] {
  if (!serialized) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Parses stored Looks, silently dropping anything malformed. */
export function parseSavedLooks(serialized: string | null): SavedLook[] {
  return parseList(serialized).flatMap((entry) => {
    const e = entry as Record<string, unknown> | null;
    const values = sanitizeLookValues(e?.values);

    const details = sanitizeLookDetails(e?.details);

    return typeof e?.id === "string" && typeof e.name === "string" && values
      ? [{ id: e.id, name: cleanName(e.name), values, ...(details ? { details } : {}) }]
      : [];
  });
}

/** Parses stored setups; unknown option values fall back to defaults. */
export function parseSavedSetups(serialized: string | null): SavedSetup[] {
  return parseList(serialized).flatMap((entry) => {
    const e = entry as Record<string, unknown> | null;

    return typeof e?.id === "string" && typeof e.name === "string"
      ? [{ id: e.id, name: cleanName(e.name), setup: sanitizeSetup(e.setup) }]
      : [];
  });
}

export function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Validates a name against existing names (built-in names included by the caller). */
export function validateName(name: string, takenNames: string[]): string | null {
  const cleaned = cleanName(name);

  if (cleaned.length === 0) {
    return "Enter a name.";
  }

  if (takenNames.some((taken) => taken.toLowerCase() === cleaned.toLowerCase())) {
    return "That name is already used.";
  }

  return null;
}

export function writeList<T>(storage: StorageLike, key: string, items: T[]): SaveResult<T> {
  try {
    storage.setItem(key, JSON.stringify(items));
    return { ok: true, items };
  } catch {
    return { ok: false, message: "Could not save. Browser storage is unavailable or full." };
  }
}
