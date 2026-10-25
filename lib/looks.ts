import type { ColorCoverage, ColorMood, ColorStrategy, HeroColor } from "./combinations";
import type { Setup } from "./setup";
import { ceilingLights, ceilings, walls } from "./combinations";

/** The six color fields a Look controls. */
export type LookValues = Pick<
  Setup,
  | "colorMood"
  | "colorStrategy"
  | "colorCoverage"
  | "heroColor"
  | "colorIntensity"
  | "autoPaletteVariation"
>;

/** Wall, ceiling and ceiling-light picks a Look can set along with its colors. */
export type LookDetails = {
  walls: string[];
  ceilings: string[];
  ceilingLights: string[];
};

export type Look = {
  id: string;
  name: string;
  description: string;
  values: LookValues;
  /** When present, choosing the Look also sets these Details (the user can undo). */
  details?: LookDetails;
};

export type IntensityStep = {
  label: string;
  /** The single number sent to the API for this step. */
  value: number;
  hint: string;
};

/** Six steps matching the six wording bands in the prompt builder. */
export const INTENSITY_STEPS: IntensityStep[] = [
  { label: "Very muted", value: 5, hint: "Calm and tonal, palette as a quiet undertone" },
  { label: "Muted", value: 15, hint: "Soft, desaturated color touches" },
  { label: "Soft", value: 25, hint: "Restrained color supporting the room" },
  { label: "Balanced", value: 50, hint: "Color clearly present across the room" },
  { label: "Expressive", value: 70, hint: "Visible, confident color" },
  { label: "Bold", value: 90, hint: "Strong, room-wide color" },
];

/** Index of the step whose band contains this intensity (bands match the prompt builder). */
export function getIntensityStepIndex(intensity: number): number {
  if (intensity <= 10) return 0;
  if (intensity <= 20) return 1;
  if (intensity <= 40) return 2;
  if (intensity <= 60) return 3;
  if (intensity <= 80) return 4;
  return 5;
}

export function getIntensityStep(intensity: number): IntensityStep {
  return INTENSITY_STEPS[getIntensityStepIndex(intensity)] ?? INTENSITY_STEPS[2];
}

function look(
  id: string,
  name: string,
  description: string,
  colorMood: ColorMood,
  colorStrategy: ColorStrategy,
  colorCoverage: ColorCoverage,
  heroColor: HeroColor,
  colorIntensity: number
): Look {
  return {
    id,
    name,
    description,
    values: {
      colorMood,
      colorStrategy,
      colorCoverage,
      heroColor,
      colorIntensity,
      autoPaletteVariation: true,
    },
  };
}

export const DEFAULT_LOOK_ID = "designer-layered";

const BASE_LOOKS: Look[] = [
  look("designer-layered", "Designer Layered", "Layered designer palette on architectural surfaces (the default).", "Warm Neutral", "Designer Layered", "Architectural Surfaces", "Auto", 25),
  look("warm-neutral-classic", "Warm Neutral Classic", "Calm warm neutrals with color kept to decor.", "Warm Neutral", "Neutral Base", "Decor Only", "Auto", 15),
  look("organic-earthy", "Organic Earthy", "Nature-inspired earth tones spread softly through the room.", "Organic Earthy", "Nature Inspired", "Softly Distributed", "Earthy Mixed", 50),
  look("light-airy", "Light & Airy", "Bright rooms with a gentle accent color.", "Light & Airy", "Accent Color", "Softly Distributed", "Auto", 25),
  look("coastal", "Coastal", "Relaxed coastal tones in cool mixed colors.", "Coastal Neutral", "Accent Color", "Softly Distributed", "Cool Mixed", 25),
  look("gallery", "Gallery", "Colors drawn from a large piece of art.", "Warm Neutral", "Gallery Inspired", "Softly Distributed", "Auto", 50),
  look("moody-luxury", "Moody Luxury", "Deep jewel tones on a dramatic feature room.", "Moody Luxury", "Statement Room", "Architectural Surfaces", "Jewel Tone Mixed", 70),
  look("deep-color-drenched", "Deep Color Drenched", "Whole-room, saturated jewel-tone color.", "Moody Luxury", "Color Drenched", "Whole Room", "Jewel Tone Mixed", 90),
  look("sage-cream", "Sage & Cream", "Soft sage green on a warm neutral base.", "Warm Neutral", "Accent Color", "Softly Distributed", "Sage", 25),
  look("terracotta-warm", "Terracotta Warm", "Sun-baked clay and terracotta accents.", "Organic Earthy", "Accent Color", "Softly Distributed", "Terracotta", 50),
  look("olive-earth", "Olive Earth", "Olive-led earth tones on architectural surfaces.", "Organic Earthy", "Nature Inspired", "Architectural Surfaces", "Olive", 50),
  look("navy-study", "Navy Study", "Deep blue statement room with a library feel.", "Moody Luxury", "Statement Room", "Architectural Surfaces", "Deep Blue", 70),
  look("emerald-library", "Emerald Library", "Emerald feature room, dramatic and enclosed.", "Moody Luxury", "Statement Room", "Architectural Surfaces", "Emerald", 70),
  look("burgundy-lounge", "Burgundy Lounge", "Wine tones in a moody feature room.", "Moody Luxury", "Statement Room", "Architectural Surfaces", "Burgundy", 70),
  look("plum-evening", "Plum Evening", "Whole-room plum, luxe and enveloping.", "Moody Luxury", "Color Drenched", "Whole Room", "Plum", 70),
  look("mustard-retro", "Mustard Retro", "Mustard accents with a warm, retro feel.", "Warm Neutral", "Accent Color", "Softly Distributed", "Mustard", 70),
  look("teal-fresh", "Teal Fresh", "Fresh teal accents with relaxed coastal light.", "Coastal Neutral", "Accent Color", "Softly Distributed", "Teal", 50),
  look("warm-eclectic", "Warm Eclectic", "Layered warm mixed colors across the room.", "Warm Neutral", "Designer Layered", "Architectural Surfaces", "Warm Mixed", 50),
  look("rust-gold", "Rust & Gold", "Rust lead color with gold and brass accents.", "Organic Earthy", "Designer Layered", "Architectural Surfaces", "Rust", 50),
  look("monochrome-tonal", "Monochrome Tonal", "One hue family in pale, mid, and deep values.", "Monochrome Tonal", "Designer Layered", "Softly Distributed", "Monochrome", 25),
  look("soft-pastel", "Soft Pastel", "Pale, powdery, low-saturation color.", "Soft Pastel", "Accent Color", "Softly Distributed", "Pastel Mixed", 25),
  look("vivid-eclectic", "Vivid Eclectic", "Saturated, playful color layered through the room.", "Vivid Eclectic", "Designer Layered", "Architectural Surfaces", "Vivid Mixed", 70),
  look("cool-modern", "Cool Modern", "Crisp slate, steel, and icy blue.", "Cool Modern", "Designer Layered", "Softly Distributed", "Slate & Steel", 25),
  look("dark-earthy-retreat", "Dark Earthy Retreat", "Espresso, forest green, and leather in low warm light.", "Dark Earthy", "Statement Room", "Architectural Surfaces", "Dark Earthy Mixed", 50),
];

function d(w: string[], c: string[], l: string[]): LookDetails {
  return { walls: w, ceilings: c, ceilingLights: l };
}

/** Details each built-in Look sets. Every value must be a real option (tested). */
const LOOK_DETAILS: Record<string, LookDetails> = {
  "designer-layered": d(["wallpaper walls"], ["smooth white ceiling"], ["recessed downlights"]),
  "warm-neutral-classic": d(["textured plaster walls"], ["smooth white ceiling"], ["recessed downlights"]),
  "organic-earthy": d(["textured plaster walls"], ["wood beam ceiling"], ["architectural pendant lights"]),
  "light-airy": d(["white walls"], ["smooth white ceiling"], ["recessed downlights", "flush mount ceiling lights"]),
  coastal: d(["white walls"], ["wood beam ceiling"], ["architectural pendant lights"]),
  gallery: d(["white walls"], ["smooth white ceiling"], ["minimal track lighting"]),
  "moody-luxury": d(["wood panel walls"], ["coffered ceiling"], ["statement chandelier"]),
  "deep-color-drenched": d(["textured plaster walls"], ["soft cove-lit ceiling"], ["concealed cove lighting"]),
  "sage-cream": d(["textured plaster walls"], ["smooth white ceiling"], ["architectural pendant lights"]),
  "terracotta-warm": d(["textured plaster walls"], ["wood beam ceiling"], ["architectural pendant lights"]),
  "olive-earth": d(["wood panel walls"], ["wood beam ceiling"], ["architectural pendant lights"]),
  "navy-study": d(["wood panel walls"], ["coffered ceiling"], ["architectural pendant lights"]),
  "emerald-library": d(["wood panel walls"], ["coffered ceiling"], ["statement chandelier"]),
  "burgundy-lounge": d(["fluted/ribbed panel walls"], ["soft cove-lit ceiling"], ["concealed cove lighting"]),
  "plum-evening": d(["wallpaper walls"], ["coffered ceiling"], ["statement chandelier"]),
  "mustard-retro": d(["wallpaper walls"], ["smooth white ceiling"], ["architectural pendant lights"]),
  "teal-fresh": d(["textured plaster walls"], ["soft cove-lit ceiling"], ["architectural pendant lights"]),
  "warm-eclectic": d(["wallpaper walls"], ["smooth white ceiling"], ["statement chandelier"]),
  "rust-gold": d(["stone walls"], ["coffered ceiling"], ["statement chandelier"]),
  "monochrome-tonal": d(["textured plaster walls"], ["microcement ceiling"], ["concealed cove lighting"]),
  "soft-pastel": d(["textured plaster walls"], ["soft cove-lit ceiling"], ["flush mount ceiling lights"]),
  "vivid-eclectic": d(["wallpaper walls"], ["smooth white ceiling"], ["statement chandelier", "architectural pendant lights"]),
  "cool-modern": d(["fluted/ribbed panel walls"], ["microcement ceiling"], ["minimal track lighting"]),
  "dark-earthy-retreat": d(["wood panel walls"], ["coffered ceiling"], ["concealed cove lighting"]),
};

export const BUILT_IN_LOOKS: Look[] = BASE_LOOKS.map((entry) => ({
  ...entry,
  details: LOOK_DETAILS[entry.id],
}));

/** Keeps only valid wall, ceiling and light options; null when anything is missing or unknown. */
export function sanitizeLookDetails(raw: unknown): LookDetails | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const v = raw as Record<string, unknown>;
  const pick = (value: unknown, allowed: readonly string[]): string[] | null => {
    if (!Array.isArray(value)) {
      return null;
    }

    const kept = value.filter((item): item is string => typeof item === "string" && allowed.includes(item));

    return kept.length > 0 ? kept : null;
  };
  const w = pick(v.walls, walls);
  const c = pick(v.ceilings, ceilings);
  const l = pick(v.ceilingLights, ceilingLights);

  return w && c && l ? { walls: w, ceilings: c, ceilingLights: l } : null;
}

export function getLookDetails(setup: Setup): LookDetails {
  return {
    walls: [...setup.walls],
    ceilings: [...setup.ceilings],
    ceilingLights: [...setup.ceilingLights],
  };
}

/** Built-in Looks grouped for the picker. Every built-in Look appears in exactly one group. */
export const LOOK_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: "Calm & neutral",
    ids: ["warm-neutral-classic", "light-airy", "coastal", "monochrome-tonal", "soft-pastel", "cool-modern"],
  },
  {
    label: "Natural & earthy",
    ids: ["organic-earthy", "sage-cream", "terracotta-warm", "olive-earth", "dark-earthy-retreat"],
  },
  {
    label: "Designer",
    ids: ["designer-layered", "gallery", "warm-eclectic", "rust-gold", "teal-fresh"],
  },
  {
    label: "Bold & dramatic",
    ids: [
      "moody-luxury",
      "deep-color-drenched",
      "navy-study",
      "emerald-library",
      "burgundy-lounge",
      "plum-evening",
      "mustard-retro",
      "vivid-eclectic",
    ],
  },
];

export function getLookValues(setup: Setup): LookValues {
  return {
    colorMood: setup.colorMood,
    colorStrategy: setup.colorStrategy,
    colorCoverage: setup.colorCoverage,
    heroColor: setup.heroColor,
    colorIntensity: setup.colorIntensity,
    autoPaletteVariation: setup.autoPaletteVariation,
  };
}

export function lookMatches(values: LookValues, setup: Setup): boolean {
  return (
    values.colorMood === setup.colorMood &&
    values.colorStrategy === setup.colorStrategy &&
    values.colorCoverage === setup.colorCoverage &&
    values.heroColor === setup.heroColor &&
    values.autoPaletteVariation === setup.autoPaletteVariation &&
    getIntensityStepIndex(values.colorIntensity) === getIntensityStepIndex(setup.colorIntensity)
  );
}

/** First Look (built-in first, then saved) that matches the current color fields, or null for Custom. */
export function findMatchingLook(setup: Setup, looks: Look[]): Look | null {
  return looks.find((candidate) => lookMatches(candidate.values, setup)) ?? null;
}

export type DetailChange = {
  key: keyof LookDetails;
  label: string;
  before: string[];
  after: string[];
  changed: boolean;
};

const DETAIL_LABELS: Record<keyof LookDetails, string> = {
  walls: "Wall type",
  ceilings: "Ceiling type",
  ceilingLights: "Ceiling lights",
};

function sameOptions(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
}

/** One row per detail field, saying what it was and what it is now (order of picks is ignored). */
export function describeDetailChanges(before: LookDetails, after: LookDetails): DetailChange[] {
  return (Object.keys(DETAIL_LABELS) as (keyof LookDetails)[]).map((key) => ({
    key,
    label: DETAIL_LABELS[key],
    before: before[key],
    after: after[key],
    changed: !sameOptions(before[key], after[key]),
  }));
}
