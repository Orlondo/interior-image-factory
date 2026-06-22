import type {
  ColorCoverage,
  ColorMood,
  ColorStrategy,
  HeroColor,
} from "@/lib/combinations";

export type PaletteVariant = {
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  neutralBase: string;
  metalAccent: string;
  woodTone: string;
};

export type SelectedPalette = PaletteVariant & {
  family: HeroColor;
  source: string;
};

export type ColorPreviewData = {
  paletteFamily: HeroColor;
  selectedPalette: string;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  colorIntensity: number;
  variationNumber: number;
  variationTotal: number;
};

const MAJOR_SURFACES =
  "walls, cabinetry, built-ins, fireplace surrounds, millwork, shelving, and ceiling details";

const LEGACY_TO_FAMILY_MAP: Record<string, HeroColor> = {
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

const FAMILY_PALETTES: Record<HeroColor, readonly PaletteVariant[]> = {
  Auto: [
    {
      name: "Sage, Stone, Walnut",
      primary: "sage",
      secondary: "olive",
      tertiary: "warm stone",
      neutralBase: "ivory and light limestone",
      metalAccent: "brushed brass",
      woodTone: "natural walnut",
    },
    {
      name: "Terracotta, Cream, Oak",
      primary: "terracotta",
      secondary: "clay rose",
      tertiary: "burnt sienna",
      neutralBase: "cream and travertine",
      metalAccent: "aged bronze",
      woodTone: "white oak",
    },
    {
      name: "Teal, Charcoal, Brass",
      primary: "teal",
      secondary: "ink blue",
      tertiary: "charcoal",
      neutralBase: "warm white and stone",
      metalAccent: "soft brass",
      woodTone: "smoked oak",
    },
    {
      name: "Plum, Taupe, Gold",
      primary: "dusty plum",
      secondary: "aubergine",
      tertiary: "warm taupe",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "dark walnut",
    },
  ],
  "Designer Mixed": [
    {
      name: "Olive, Walnut, Brass",
      primary: "olive",
      secondary: "sage",
      tertiary: "warm sand",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Terracotta, Cream, Walnut",
      primary: "terracotta",
      secondary: "clay",
      tertiary: "soft rust",
      neutralBase: "cream and travertine",
      metalAccent: "antique brass",
      woodTone: "walnut",
    },
    {
      name: "Teal, Stone, Bronze",
      primary: "deep teal",
      secondary: "blue-green",
      tertiary: "warm gray",
      neutralBase: "stone and ivory",
      metalAccent: "bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Charcoal, Gold, Oat",
      primary: "warm charcoal",
      secondary: "graphite",
      tertiary: "muted olive",
      neutralBase: "oat and putty",
      metalAccent: "muted gold",
      woodTone: "dark oak",
    },
    {
      name: "Navy, Clay, Linen",
      primary: "deep navy",
      secondary: "dusty blue",
      tertiary: "clay",
      neutralBase: "linen and warm white",
      metalAccent: "soft brass",
      woodTone: "white oak",
    },
    {
      name: "Plum, Moss, Stone",
      primary: "dusty plum",
      secondary: "moss",
      tertiary: "cocoa",
      neutralBase: "pale stone and ivory",
      metalAccent: "aged bronze",
      woodTone: "walnut",
    },
  ],
  "Earthy Mixed": [
    {
      name: "Sage, Oak, Sand",
      primary: "sage",
      secondary: "olive",
      tertiary: "sand",
      neutralBase: "ivory and limestone",
      metalAccent: "brushed bronze",
      woodTone: "natural oak",
    },
    {
      name: "Olive, Walnut, Stone",
      primary: "olive",
      secondary: "moss",
      tertiary: "warm stone",
      neutralBase: "travertine and oat",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
    {
      name: "Terracotta, Clay, Cream",
      primary: "terracotta",
      secondary: "clay",
      tertiary: "rust",
      neutralBase: "cream and linen",
      metalAccent: "antique brass",
      woodTone: "smoked oak",
    },
    {
      name: "Rust, Walnut, Taupe",
      primary: "rust",
      secondary: "burnt sienna",
      tertiary: "cinnamon",
      neutralBase: "taupe and warm putty",
      metalAccent: "bronze",
      woodTone: "dark walnut",
    },
    {
      name: "Clay, Olive, Travertine",
      primary: "clay",
      secondary: "olive",
      tertiary: "dusty terracotta",
      neutralBase: "travertine and cream",
      metalAccent: "soft bronze",
      woodTone: "walnut",
    },
    {
      name: "Walnut, Moss, Oat",
      primary: "moss",
      secondary: "olive",
      tertiary: "cocoa",
      neutralBase: "oat and ivory",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
  ],
  "Jewel Tone Mixed": [
    {
      name: "Emerald, Charcoal, Gold",
      primary: "emerald",
      secondary: "deep green",
      tertiary: "charcoal",
      neutralBase: "warm stone",
      metalAccent: "muted gold",
      woodTone: "dark walnut",
    },
    {
      name: "Navy, Brass, Cocoa",
      primary: "navy",
      secondary: "ink blue",
      tertiary: "espresso",
      neutralBase: "oat and stone",
      metalAccent: "brushed brass",
      woodTone: "walnut",
    },
    {
      name: "Teal, Bronze, Linen",
      primary: "teal",
      secondary: "petrol blue",
      tertiary: "moss",
      neutralBase: "linen and pale stone",
      metalAccent: "aged bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Plum, Gold, Taupe",
      primary: "plum",
      secondary: "aubergine",
      tertiary: "warm taupe",
      neutralBase: "ivory and putty",
      metalAccent: "soft gold",
      woodTone: "walnut",
    },
    {
      name: "Gold, Charcoal, Olive",
      primary: "gold ochre",
      secondary: "amber",
      tertiary: "olive",
      neutralBase: "warm gray and stone",
      metalAccent: "brushed bronze",
      woodTone: "dark oak",
    },
    {
      name: "Emerald, Navy, Bronze",
      primary: "emerald",
      secondary: "navy",
      tertiary: "deep teal",
      neutralBase: "warm stone",
      metalAccent: "bronze",
      woodTone: "walnut",
    },
  ],
  "Warm Mixed": [
    {
      name: "Terracotta, Cream, Walnut",
      primary: "terracotta",
      secondary: "clay",
      tertiary: "dusty rust",
      neutralBase: "cream and travertine",
      metalAccent: "antique brass",
      woodTone: "walnut",
    },
    {
      name: "Rust, Stone, Bronze",
      primary: "rust",
      secondary: "burnt orange",
      tertiary: "cinnamon",
      neutralBase: "warm stone and oat",
      metalAccent: "bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Clay, Ivory, Brass",
      primary: "clay",
      secondary: "copper rose",
      tertiary: "dusty peach",
      neutralBase: "ivory and putty",
      metalAccent: "brushed brass",
      woodTone: "white oak",
    },
    {
      name: "Mustard, Taupe, Walnut",
      primary: "mustard",
      secondary: "ochre",
      tertiary: "olive",
      neutralBase: "taupe and cream",
      metalAccent: "aged brass",
      woodTone: "walnut",
    },
    {
      name: "Sienna, Sand, Bronze",
      primary: "sienna",
      secondary: "terracotta",
      tertiary: "dusty rose",
      neutralBase: "sand and ivory",
      metalAccent: "bronze",
      woodTone: "oak",
    },
    {
      name: "Rose Clay, Oat, Brass",
      primary: "rose clay",
      secondary: "dusty coral",
      tertiary: "cinnamon",
      neutralBase: "oat and cream",
      metalAccent: "soft brass",
      woodTone: "walnut",
    },
  ],
  "Cool Mixed": [
    {
      name: "Teal, Stone, Brass",
      primary: "teal",
      secondary: "sea green",
      tertiary: "slate",
      neutralBase: "warm white and stone",
      metalAccent: "satin brass",
      woodTone: "light oak",
    },
    {
      name: "Navy, Charcoal, Gold",
      primary: "navy",
      secondary: "ink blue",
      tertiary: "warm charcoal",
      neutralBase: "ivory and limestone",
      metalAccent: "muted gold",
      woodTone: "walnut",
    },
    {
      name: "Slate Blue, Oat, Bronze",
      primary: "slate blue",
      secondary: "dusty blue",
      tertiary: "charcoal",
      neutralBase: "oat and pale stone",
      metalAccent: "aged bronze",
      woodTone: "smoked oak",
    },
    {
      name: "Eucalyptus, Ivory, Brass",
      primary: "eucalyptus",
      secondary: "sage",
      tertiary: "soft teal",
      neutralBase: "ivory and linen",
      metalAccent: "soft brass",
      woodTone: "white oak",
    },
    {
      name: "Deep Blue, Sand, Walnut",
      primary: "deep blue",
      secondary: "petrol",
      tertiary: "muted olive",
      neutralBase: "sand and warm stone",
      metalAccent: "bronze",
      woodTone: "walnut",
    },
    {
      name: "Graphite, Teal, Gold",
      primary: "graphite",
      secondary: "deep teal",
      tertiary: "ink blue",
      neutralBase: "warm gray and oat",
      metalAccent: "muted gold",
      woodTone: "dark oak",
    },
  ],
};

function clampColorIntensity(colorIntensity: number): number {
  if (!Number.isFinite(colorIntensity)) {
    return 25;
  }

  return Math.max(0, Math.min(100, Math.round(colorIntensity)));
}

function shouldUseLegacyNeutralGuardrails(input: {
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  colorIntensity: number;
}): boolean {
  return (
    input.colorStrategy === "Neutral Base" ||
    input.colorCoverage === "Decor Only" ||
    clampColorIntensity(input.colorIntensity) <= 20
  );
}

function normalizePaletteFamily(heroColor: HeroColor | string): HeroColor {
  if (heroColor in FAMILY_PALETTES) {
    return heroColor as HeroColor;
  }

  return LEGACY_TO_FAMILY_MAP[heroColor] ?? "Auto";
}

function getMoodDefaultFamily(colorMood: ColorMood): HeroColor {
  switch (colorMood) {
    case "Organic Earthy":
      return "Earthy Mixed";
    case "Light & Airy":
      return "Cool Mixed";
    case "Moody Luxury":
      return "Jewel Tone Mixed";
    case "Coastal Neutral":
      return "Cool Mixed";
    default:
      return "Designer Mixed";
  }
}

function getCoverageDirective(colorCoverage: ColorCoverage): string {
  switch (colorCoverage) {
    case "Decor Only":
      return "Coverage Decor Only: keep color in decor and accessories.";
    case "Softly Distributed":
      return "Coverage Softly Distributed: color should appear in decor, textiles, and furniture.";
    case "Architectural Surfaces":
      return `Coverage Architectural Surfaces: at least one major surface must carry palette color (${MAJOR_SURFACES}).`;
    case "Whole Room":
      return `Coverage Whole Room: multiple major surfaces must carry palette color (${MAJOR_SURFACES}).`;
  }
}

export function selectPalette(input: {
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  heroColor: HeroColor;
  imageIndex: number;
  autoPaletteVariation: boolean;
}): SelectedPalette {
  const requestedFamily = normalizePaletteFamily(input.heroColor);
  const family =
    requestedFamily === "Auto" ? getMoodDefaultFamily(input.colorMood) : requestedFamily;
  const pool = FAMILY_PALETTES[family];
  const index = input.autoPaletteVariation ? input.imageIndex % pool.length : 0;
  const base = pool[index] ?? pool[0];

  return {
    ...base,
    family,
    source: `${input.colorMood} mood + ${input.colorStrategy} strategy + ${family} palette family`,
  };
}

export function getIntensityDirective(colorIntensity: number): string {
  const intensity = clampColorIntensity(colorIntensity);

  if (intensity <= 20) {
    return `Color intensity ${intensity}/100: minimal color with restrained accents and subtle palette traces.`;
  }

  if (intensity <= 50) {
    return `Color intensity ${intensity}/100: balanced palette presence across furniture, textiles, and selected surfaces.`;
  }

  if (intensity <= 80) {
    return `Color intensity ${intensity}/100: expressive palette presence across architecture and furnishings.`;
  }

  return `Color intensity ${intensity}/100: strong designer palette with clear room-wide continuity.`;
}

export function getStrategyDirective(
  colorStrategy: ColorStrategy,
  colorIntensity: number,
  colorCoverage: ColorCoverage
): string {
  const intensity = clampColorIntensity(colorIntensity);
  const useNeutralGuardrails = shouldUseLegacyNeutralGuardrails({
    colorStrategy,
    colorCoverage,
    colorIntensity: intensity,
  });

  if (colorStrategy === "Neutral Base") {
    return "Strategy Neutral Base: neutral-led room with only subtle color support.";
  }

  if (colorStrategy === "Gallery Inspired") {
    return "Strategy Gallery Inspired: derive palette from artwork and repeat it across architecture, furniture, textiles, and decor.";
  }

  if (colorStrategy === "Color Drenched") {
    return "Strategy Color Drenched: spread palette color across major surfaces with curated upscale restraint.";
  }

  if (useNeutralGuardrails) {
    return `Strategy ${colorStrategy}: keep color controlled while preserving palette cohesion.`;
  }

  return `Strategy ${colorStrategy}: strategy overrides mood when conflicts appear; avoid neutral defaults unless explicitly requested.`;
}

function getArchitecturalSurfaceDirective(
  colorStrategy: ColorStrategy,
  colorCoverage: ColorCoverage,
  colorIntensity: number,
  palette: SelectedPalette
): string {
  const intensity = clampColorIntensity(colorIntensity);

  const base = `Apply palette across walls, cabinetry, millwork, built-ins, rugs, furniture, and artwork with coherent tonal balance from ${palette.name}.`;

  if (colorStrategy === "Gallery Inspired") {
    const galleryRule =
      intensity > 75
        ? `Gallery rule: because intensity is ${intensity}, at least two major architectural surfaces must carry artwork-derived palette colors.`
        : intensity > 50
          ? `Gallery rule: because intensity is ${intensity}, at least one major architectural surface must carry artwork-derived palette colors.`
          : "Gallery rule: carry artwork tones into textiles, furniture, and one subtle architectural echo.";

    return `${base} Derive the color sequence from a large artwork and echo those tones through architecture, not just decor. ${galleryRule}`;
  }

  if (colorCoverage === "Decor Only") {
    return `${base} Keep architecture restrained; prioritize decor and accessories.`;
  }

  if (colorCoverage === "Softly Distributed") {
    return `${base} Distribute color through decor, textiles, and furniture with only subtle architectural support.`;
  }

  if (colorCoverage === "Architectural Surfaces") {
    return `${base} Require at least one major surface in palette color, beyond decor-only behavior.`;
  }

  return `${base} Require multiple major surfaces in palette color so the room reads as a full-room composition.`;
}

function getPaletteCohesionDirective(
  autoPaletteVariation: boolean,
  imageIndex: number,
  maxImages: number
): string {
  if (!autoPaletteVariation || maxImages <= 1) {
    return "Keep one cohesive palette per request while allowing tonal depth and material variation.";
  }

  const sequence = (imageIndex % Math.max(1, maxImages)) + 1;
  return `Variation ${sequence}/${maxImages}: maintain palette-family cohesion while allowing controlled variation, tonal exploration, and palette evolution across the batch.`;
}

export function getHeroColorDirective(heroColor: HeroColor, palette: SelectedPalette): string {
  const family = normalizePaletteFamily(heroColor);

  if (family === "Auto") {
    return `Palette family Auto: use the mood-curated family ${palette.family} with balanced color leadership.`;
  }

  return `Palette family ${family}: influence this variation with ${palette.primary}, ${palette.secondary}, and ${palette.tertiary} without forcing a single-color room.`;
}

export function generatePaletteVariation(
  palette: SelectedPalette,
  input: {
    colorStrategy: ColorStrategy;
    autoPaletteVariation: boolean;
    imageIndex: number;
    maxImages: number;
  }
): string {
  const sequencePosition = (input.imageIndex % Math.max(1, input.maxImages)) + 1;

  if (!input.autoPaletteVariation || input.maxImages <= 1) {
    return `Variation ${sequencePosition}/${input.maxImages}: keep ${palette.name} as the anchor palette with nuanced material and tonal changes.`;
  }

  return `Variation ${sequencePosition}/${input.maxImages}: rotate to ${palette.name} while preserving ${palette.family} family cohesion and ${input.colorStrategy} strategy intent.`;
}

export function getColorPreviewData(input: {
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  heroColor: HeroColor;
  colorIntensity: number;
  autoPaletteVariation: boolean;
  imageIndex: number;
  maxImages: number;
}): ColorPreviewData {
  const palette = selectPalette({
    colorMood: input.colorMood,
    colorStrategy: input.colorStrategy,
    heroColor: input.heroColor,
    imageIndex: input.autoPaletteVariation ? input.imageIndex : 0,
    autoPaletteVariation: input.autoPaletteVariation,
  });

  return {
    paletteFamily: palette.family,
    selectedPalette: palette.name,
    colorStrategy: input.colorStrategy,
    colorCoverage: input.colorCoverage,
    colorIntensity: clampColorIntensity(input.colorIntensity),
    variationNumber: (input.imageIndex % Math.max(1, input.maxImages)) + 1,
    variationTotal: Math.max(1, input.maxImages),
  };
}

export function buildColorPaletteDirective(input: {
  colorMood: ColorMood;
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  heroColor: HeroColor;
  colorIntensity: number;
  autoPaletteVariation: boolean;
  imageIndex: number;
  maxImages: number;
  style: string;
}): string {
  const palette = selectPalette({
    colorMood: input.colorMood,
    colorStrategy: input.colorStrategy,
    heroColor: input.heroColor,
    imageIndex: input.autoPaletteVariation ? input.imageIndex : 0,
    autoPaletteVariation: input.autoPaletteVariation,
  });

  const strategyDirective = getStrategyDirective(
    input.colorStrategy,
    input.colorIntensity,
    input.colorCoverage
  );
  const intensityDirective = getIntensityDirective(input.colorIntensity);
  const heroDirective = getHeroColorDirective(input.heroColor, palette);
  const coverageDirective = getCoverageDirective(input.colorCoverage);
  const architecturalSurfaceDirective = getArchitecturalSurfaceDirective(
    input.colorStrategy,
    input.colorCoverage,
    input.colorIntensity,
    palette
  );
  const paletteEvolutionDirective = getPaletteCohesionDirective(
    input.autoPaletteVariation,
    input.imageIndex,
    input.maxImages
  );
  const variationDirective = generatePaletteVariation(palette, {
    colorStrategy: input.colorStrategy,
    autoPaletteVariation: input.autoPaletteVariation,
    imageIndex: input.imageIndex,
    maxImages: input.maxImages,
  });

  return `Color system: mood ${input.colorMood}; strategy ${input.colorStrategy}; coverage ${input.colorCoverage}; style ${input.style}. Selected palette family ${palette.family}. Selected palette ${palette.name}: primary ${palette.primary}, secondary ${palette.secondary}, tertiary ${palette.tertiary}, neutral base ${palette.neutralBase}, wood ${palette.woodTone}, metal ${palette.metalAccent}. Palette source: ${palette.source}. ${strategyDirective} ${coverageDirective} ${architecturalSurfaceDirective} ${heroDirective} ${intensityDirective} ${variationDirective} ${paletteEvolutionDirective} Keep output realistic, upscale, and materially coherent. Avoid beige/cream/greige collapse unless neutral guardrails are explicitly active.`;
}
