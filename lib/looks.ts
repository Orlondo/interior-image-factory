import type { ColorCoverage, ColorMood, ColorStrategy, HeroColor } from "./combinations";
import type { Setup } from "./setup";

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

export type Look = {
  id: string;
  name: string;
  description: string;
  values: LookValues;
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

export const BUILT_IN_LOOKS: Look[] = [
  look("designer-layered", "Designer Layered", "Layered designer palette on architectural surfaces (the default).", "Warm Neutral", "Designer Layered", "Architectural Surfaces", "Auto", 25),
  look("warm-neutral-classic", "Warm Neutral Classic", "Calm warm neutrals with color kept to decor.", "Warm Neutral", "Neutral Base", "Decor Only", "Auto", 15),
  look("organic-earthy", "Organic Earthy", "Nature-inspired earth tones spread softly through the room.", "Organic Earthy", "Nature Inspired", "Softly Distributed", "Earthy Mixed", 50),
  look("light-airy", "Light & Airy", "Bright rooms with a gentle accent color.", "Light & Airy", "Accent Color", "Softly Distributed", "Auto", 25),
  look("coastal", "Coastal", "Relaxed coastal tones in cool mixed colors.", "Coastal Neutral", "Accent Color", "Softly Distributed", "Cool Mixed", 25),
  look("gallery", "Gallery", "Colors drawn from a large piece of art.", "Warm Neutral", "Gallery Inspired", "Softly Distributed", "Auto", 50),
  look("moody-luxury", "Moody Luxury", "Deep jewel tones on a dramatic feature room.", "Moody Luxury", "Statement Room", "Architectural Surfaces", "Jewel Tone Mixed", 70),
  look("deep-color-drenched", "Deep Color Drenched", "Whole-room, saturated jewel-tone color.", "Moody Luxury", "Color Drenched", "Whole Room", "Jewel Tone Mixed", 90),
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
