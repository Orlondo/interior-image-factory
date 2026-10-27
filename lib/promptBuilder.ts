import type {
  ColorCoverage,
  ColorMood,
  ColorStrategy,
  HeroColor,
  RoomType,
} from "@/lib/combinations";
import { buildColorPaletteDirective, selectPalette } from "@/lib/promptBuilder/colorPalette";
import { HOME_QUALITY_PROFILES } from "@/lib/promptBuilder/homeQuality";
import { CAMERA_MODES, cameraAngleFor, type CameraKey } from "@/lib/promptBuilder/camera";
import { CONDITION_PROFILES, type ConditionKey } from "@/lib/promptBuilder/condition";
import { STYLE_OVERRIDES } from "@/lib/promptBuilder/styleOverrides";
import { AUTO_WALL_COLOR_PALETTE } from "@/lib/wallColorPalette";

const COLOR_MOOD_DIRECTION_MAP: Record<ColorMood, string> = {
  "Warm Neutral":
    "Warm undertones and soft material warmth can support the selected strategy without overriding strategy-driven palette choices.",
  "Organic Earthy":
    "Nature-derived undertones like clay, olive, and walnut can support the strategy-selected palette while preserving upscale realism.",
  "Light & Airy":
    "Airy tonal balance and brighter values can support the strategy-selected palette across light, materials, and spatial feel.",
  "Moody Luxury":
    "Deeper tonal contrast and premium materials can support strategy-led palette direction in an editorial, luxurious mood.",
  "Coastal Neutral":
    "Relaxed coastal tonality can support strategy-led palette choices with bright, refined, material-forward execution.",
  "Monochrome Tonal":
    "Build the room from a single hue family in layered values: pale, mid, and deep tones of the same hue across walls, upholstery, textiles, and decor, with texture and material variation doing the work instead of contrasting colors. Keep accents to that hue family plus natural wood and one metal finish. Quiet, restrained, tone-on-tone, with no second competing hue.",
  "Soft Pastel":
    "Use high-value, low-saturation pastel tones such as powdery blush, mint, butter, lilac, and sky tints in a light, gentle palette. Keep every color pale and chalky, grounded by creamy off-white, and avoid deep, dark, or heavily saturated colors. Tender and airy, but still upscale and realistic.",
  "Vivid Eclectic":
    "Use saturated, confident, playful color: several vivid hues such as cobalt, tangerine, magenta, emerald, and saffron layered through furniture, rugs, art, and decor in a collected, eclectic way. Colors should read clearly saturated and intentional, balanced by a few calm neutrals so the room feels curated, not chaotic.",
  "Cool Modern":
    "Use crisp cool tonality: slate, steel, graphite, fog gray, and icy blue with clean white and cool metals. A clean-lined, precise, contemporary feel with cool daylight, minimal warm tones, and pale cool-toned wood.",
  "Dark Earthy":
    "Use deep, dim earth tones: espresso, umber, forest green, charcoal-olive, and aged leather under low, warm, glowing light. A rich, enclosed, grounded feel with deep midtones and soft shadow falloff that never turns muddy, in premium natural materials.",
};

function clampColorIntensity(colorIntensity: number): number {
  if (!Number.isFinite(colorIntensity)) {
    return 25;
  }

  return Math.max(0, Math.min(100, Math.round(colorIntensity)));
}

function getColorIntensityLevel(colorIntensity: number):
  | "Muted"
  | "Soft"
  | "Balanced"
  | "Expressive"
  | "Bold" {
  if (colorIntensity <= 20) {
    return "Muted";
  }

  if (colorIntensity <= 40) {
    return "Soft";
  }

  if (colorIntensity <= 60) {
    return "Balanced";
  }

  if (colorIntensity <= 80) {
    return "Expressive";
  }

  return "Bold";
}

type ColorTier = "muted" | "soft" | "full";

function getColorTier(colorIntensity: number): ColorTier {
  if (colorIntensity <= 20) {
    return "muted";
  }

  if (colorIntensity <= 40) {
    return "soft";
  }

  return "full";
}

function getCoverageDirective(colorCoverage: ColorCoverage, tier: ColorTier = "full"): string {
  const base = getBaseCoverageDirective(colorCoverage);
  const needsTint = colorCoverage === "Architectural Surfaces" || colorCoverage === "Whole Room";

  return tier === "muted" && needsTint
    ? `${base} Because intensity is low, render that color as a pale, desaturated tint, not saturated paint.`
    : base;
}

function getBaseCoverageDirective(colorCoverage: ColorCoverage): string {
  switch (colorCoverage) {
    case "Decor Only":
      return "Color coverage Decor Only: keep architecture mostly neutral and confine palette use to art, pillows, throws, rugs, table accessories, vases, and small styling objects.";
    case "Softly Distributed":
      return "Color coverage Softly Distributed: extend palette into decor, textiles, soft goods, and some furniture pieces while keeping most architecture restrained.";
    case "Architectural Surfaces":
      return "Color coverage Architectural Surfaces: the palette must appear on at least one major surface such as a feature wall, cabinetry, millwork, built-in shelving, ceiling treatment, or fireplace surround, not just decor.";
    case "Whole Room":
      return "Color coverage Whole Room: the palette should define multiple major surfaces and the room-wide composition, with color present across architecture, furniture, textiles, and styling.";
  }
}

function getWallTreatmentDirective(wallTypes: string[]): string {
  return wallTypes.length > 0 ? wallTypes.join(", ") : "wall surface material and texture cues";
}

function getViewDirectionDirective(view: string): string {
  if (view === "regular inner-city neighborhood") {
    return "Street-level inner-city residential neighborhood view: show neighboring houses, fences, porches, small yards, and visible backyards with trees and everyday residential details (no storefront rows and no elevated apartment-only outlook).";
  }

  if (view === "inner-city apartments (elevated view)") {
    return "Elevated apartment outlook: urban residential blocks and mid/high-rise apartment facades viewed from an upper-floor perspective.";
  }

  return `${view}, framed naturally with realistic depth and context.`;
}

function getColorProfileExecutionRule(
  colorProfileTypes: string[],
  useLegacyNeutralGuardrails: boolean,
  tier: ColorTier
): string {
  const balancedPaletteRule =
    tier === "muted"
      ? "Keep the room calm, tonal, and mostly neutral, with the palette appearing as quiet tints and small touches."
      : tier === "soft"
        ? "Keep the palette cohesive and restrained, letting color support the room rather than lead it."
        : "Keep the palette cohesive and color-led across surfaces, furnishings, and styling without reasserting neutral-wall defaults.";

  const colorProfileExecutionMap: Record<string, string> = {
    "current balanced palette (default)":
      useLegacyNeutralGuardrails
        ? "Keep a designer-curated neutral story centered on warm white, cream, taupe, greige, stone, and natural wood, with subtle accent restraint."
        : balancedPaletteRule,
    "rich color-forward palette":
      "Allow richer depth through layered materials and warm contrast, while keeping walls primarily neutral and professionally curated.",
    "high-contrast palette":
      "Use black, warm charcoal, and warm white contrast with crisp separation and restrained accent usage.",
    "earthy saturated palette":
      "Favor earthy neutrals (clay, terracotta, sand, cognac, olive accents) with controlled saturation and high-end material realism.",
    "soft pastel palette":
      "Favor pale warm-neutral tints and muted mineral tones with soft tonal harmony, avoiding candy-like saturation.",
  };

  return colorProfileTypes
    .map((profile) => colorProfileExecutionMap[profile])
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ");
}

function shouldUseLegacyNeutralGuardrails(input: {
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
  colorIntensity: number;
}): boolean {
  return (
    input.colorStrategy === "Neutral Base" ||
    input.colorCoverage === "Decor Only"
  );
}

export function buildPrompt(
  room: RoomType,
  roomSize: string,
  style: string,
  colorMood: ColorMood,
  colorIntensity: number,
  colorStrategy: ColorStrategy,
  colorCoverage: ColorCoverage,
  heroColor: HeroColor,
  autoPaletteVariation: boolean,
  imageIndex: number,
  maxImages: number,
  homeQuality: "builder's grade layout" | "everyday" | "upscale" | "luxury" | "ultra luxury",
  wallColorPalette: string,
  colorProfileTypes: string[],
  view: string,
  windowStyleTypes: string[],
  focalPointTypes: string[],
  wallTypes: string[],
  ceilingTypes: string[],
  ceilingLightTypes: string[],
  condition: ConditionKey = "pristine",
  camera: CameraKey = "standard",
  /** This image's place in the batch. A dramatic or cinematic camera uses it to give each image its own angle. */
  cameraIndex = 0
) {
  // Everything that depends on the quality tier comes from one profile (lib/promptBuilder/homeQuality.ts).
  const quality = HOME_QUALITY_PROFILES[homeQuality];
  const styleOverride = STYLE_OVERRIDES[style];
  const cond = CONDITION_PROFILES[condition];
  const isPristine = condition === "pristine";
  const cameraMode = camera === "standard" ? null : CAMERA_MODES[camera];
  const dramatic = cameraMode ? cameraAngleFor(camera as "dramatic" | "cinematic", cameraIndex) : null;

  const colorMoodDirection =
    COLOR_MOOD_DIRECTION_MAP[colorMood] ?? COLOR_MOOD_DIRECTION_MAP["Warm Neutral"];

  const normalizedColorIntensity = clampColorIntensity(colorIntensity);
  const colorIntensityLevel = getColorIntensityLevel(normalizedColorIntensity);
  const colorTier = getColorTier(normalizedColorIntensity);
  const useLegacyNeutralGuardrails = shouldUseLegacyNeutralGuardrails({
    colorStrategy,
    colorCoverage,
    colorIntensity: normalizedColorIntensity,
  });

  const colorPaletteDirective = buildColorPaletteDirective({
    colorMood,
    colorStrategy,
    colorCoverage,
    heroColor,
    colorIntensity: normalizedColorIntensity,
    autoPaletteVariation,
    imageIndex,
    maxImages,
    style,
  });

  const normalizedColorProfileTypes = Array.isArray(colorProfileTypes)
    ? colorProfileTypes
    : [];

  const colorProfileDirection =
    normalizedColorProfileTypes.length > 0
      ? normalizedColorProfileTypes.join(", ")
      : "current balanced palette (default)";

  const colorProfileExecutionRule = getColorProfileExecutionRule(
    normalizedColorProfileTypes,
    useLegacyNeutralGuardrails,
    colorTier
  );
  const allowEarthyBias =
    normalizedColorProfileTypes.length === 1 &&
    normalizedColorProfileTypes.includes("earthy saturated palette");

  const hueGuardrailRule = allowEarthyBias
    ? "Earthy saturation is allowed because the earthy profile was explicitly selected."
    : useLegacyNeutralGuardrails
      ? "Keep dominant walls in warm-neutral families (warm white, ivory, cream, linen, taupe, greige, sand, warm charcoal). Avoid blue accent walls, highly saturated paint colors, and excessive cool-gray dominance."
      : colorTier === "muted"
        ? "Keep every palette color pale, desaturated, and tonal. Avoid saturated paint and bold color blocking; a calm, light room is correct at this intensity."
        : colorTier === "soft"
          ? "Keep palette color restrained and softened, aligned with the selected mood and coverage."
          : "Keep the palette aligned with the selected mood and coverage without defaulting back to neutral-wall framing or muted gray-beige behavior.";

  const noGreenCastRule = useLegacyNeutralGuardrails
    ? "Apply warm-neutral white balance with no artificial color cast. Dark walls, when present, must read as warm charcoal or soft near-black rather than blue-heavy tones. Stone should read as light limestone, travertine, or warm marble with realistic mineral character. Millwork, plaster, and dominant artwork must stay neutral-forward unless a subtle accent is intentionally specified."
    : "Apply clean white balance so walls, stone, plaster, millwork, and artwork stay true to the selected palette without unexpected color casts.";

  let furnitureToneRule: string;

  if (useLegacyNeutralGuardrails) {
    if (normalizedColorIntensity <= 20) {
      furnitureToneRule =
        "Use softer earthy/neutral furniture tones: oatmeal, sand, taupe, greige, warm gray, stone, walnut, white oak, linen, and camel leather. Keep major furniture pieces and upholstery low-saturation and calm, with minimal bold color blocking.";
    } else if (normalizedColorIntensity <= 40) {
      furnitureToneRule =
        "Keep furniture mostly neutral-forward with restrained accent textiles and decor moments.";
    } else if (normalizedColorIntensity <= 60) {
      furnitureToneRule =
        "Keep core furniture grounded in warm neutrals, but introduce clearly visible accent upholstery or decor in one to two coordinated color moments.";
    } else if (normalizedColorIntensity <= 80) {
      furnitureToneRule =
        "Allow richer accent visibility across pillows, throws, selected upholstery, and art while keeping major architectural surfaces neutral-forward.";
    } else {
      furnitureToneRule =
        "Allow a bold but curated accent narrative across textiles, selected upholstery, decor, and art while preserving realistic materials and neutral-forward architecture.";
    }
  } else if (normalizedColorIntensity <= 10) {
    furnitureToneRule =
      "Keep furniture, rugs, and upholstery in quiet, desaturated, low-contrast tones that only hint at the palette. No saturated or high-contrast color blocking on any large piece.";
  } else if (normalizedColorIntensity <= 20) {
    furnitureToneRule =
      "Keep major furniture and rugs soft and tonal, with the palette shown as pale, desaturated versions of its colors. Allow only small, low-contrast color touches on cushions, throws, and decor.";
  } else if (normalizedColorIntensity <= 40) {
    furnitureToneRule =
      "Allow color to appear clearly in furniture, rugs, and soft goods, with major pieces participating in the palette instead of defaulting to neutral-forward framing.";
  } else if (normalizedColorIntensity <= 60) {
    furnitureToneRule =
      "Let furniture, rugs, and textiles share the palette with architecture so the room reads intentionally color-led.";
  } else if (normalizedColorIntensity <= 80) {
    furnitureToneRule =
      "Use expressive palette color across furniture, rugs, and textiles alongside architectural surfaces.";
  } else {
    furnitureToneRule =
      "Use bold palette color across furniture, rugs, textiles, and architectural surfaces in a cohesive room-wide composition.";
  }

  let accentIntensityRule: string;

  if (useLegacyNeutralGuardrails) {
    if (normalizedColorIntensity <= 20) {
      accentIntensityRule = "Accent colors should be trace-level and limited to tiny decor moments.";
    } else if (normalizedColorIntensity <= 40) {
      accentIntensityRule = "Accent colors should be restrained and appear in a few curated accessories and textiles.";
    } else if (normalizedColorIntensity <= 60) {
      accentIntensityRule = "Accent colors should be clearly present across textiles, decor, and one small furniture moment, without overtaking the room.";
    } else if (normalizedColorIntensity <= 80) {
      accentIntensityRule = "Accent colors should be expressive and visible across multiple styling elements while staying cohesive and design-forward.";
    } else {
      accentIntensityRule = "Accent colors should be bold, intentional, and prominent across coordinated styling elements, while avoiding neon or chaotic color drift.";
    }
  } else if (normalizedColorIntensity <= 10) {
    accentIntensityRule =
      "Accent colors should be barely there: tiny, desaturated, low-contrast touches. Intensity overrides coverage, so surfaces stay pale and tonal.";
  } else if (normalizedColorIntensity <= 20) {
    accentIntensityRule =
      "Accent colors should be quiet and desaturated, limited to a few small decor and textile moments. Intensity overrides coverage, so any palette color on walls or built-ins must be a pale, low-saturation tint.";
  } else if (normalizedColorIntensity <= 40) {
    accentIntensityRule =
      "Accent colors should be present and visible across textiles, decor, furniture, and architectural details.";
  } else if (normalizedColorIntensity <= 60) {
    accentIntensityRule =
      "Accent colors should be clearly present across the room, with surfaces and furnishings sharing the palette.";
  } else if (normalizedColorIntensity <= 80) {
    accentIntensityRule =
      "Accent colors should be expressive and visible across major surfaces and large furnishings.";
  } else {
    accentIntensityRule =
      "Accent colors should be bold, intentional, and prominent across major surfaces, furnishings, and styling.";
  }

  const paletteCohesionRule =
    colorTier === "muted" && !useLegacyNeutralGuardrails
      ? "Keep palette family cohesion through quiet tonal variation in texture and material, with color staying low in saturation and contrast."
      : "Keep palette family cohesion while allowing controlled variation and tonal exploration across walls, cabinetry, millwork, built-ins, rugs, furniture, and artwork.";

  const focalPointDirection =
    focalPointTypes.length > 0
      ? focalPointTypes.join(", ")
      : "balanced composition with subtle design elements";

  const focalPointRule =
    focalPointTypes.length > 0
      ? `Feature one or more avant-garde focal points: ${focalPointTypes.join(", ")}. Make these elements daringly bold, conceptually interesting, and visually commanding. Prioritize artistic expression and experimental design over conventional aesthetics. These should provoke thought or challenge expectations.`
      : "Compose with subtle design elements and balanced spatial flow without one dominating focal point.";

  // The avant-garde lines belong to the focal point rule, so they only appear when focal points are selected.
  const focalPointStyleLines =
    focalPointTypes.length > 0
      ? `  - When focal points are selected: prioritize artistic impact, conceptual clarity, and avant-garde expression over comfort or conventionality
  - Sculptural and experimental designer furniture, collectible art objects, unconventional materials
  - Styling accessories: bold art pieces, conceptual sculptures, unconventional objects that challenge the eye
  - Accessories should feel intentional, provocative, and culturally aware - pushing boundaries while maintaining cohesion
`
      : "";

  const windowDesignDirection =
    windowStyleTypes.length > 0
      ? windowStyleTypes.join(", ")
      : "balanced windows (standard residential)";

  const wallTreatmentDirection = getWallTreatmentDirective(wallTypes);

  const usesAutoWallPalette = wallColorPalette === AUTO_WALL_COLOR_PALETTE;
  const selectedPalette = selectPalette({
    colorMood,
    colorStrategy,
    heroColor,
    imageIndex: autoPaletteVariation ? imageIndex : 0,
    autoPaletteVariation,
  });

  const wallColorPaletteDirection = !usesAutoWallPalette
    ? wallColorPalette
    : useLegacyNeutralGuardrails
      ? "warm-neutral walls (warm white, cream, taupe, greige, stone); bring the selected palette in through decor, textiles, and furniture"
      : colorTier === "muted"
        ? `follow the selected palette (${selectedPalette.name}) as pale, low-saturation tints; walls may stay light and tonal`
        : `follow the selected palette (${selectedPalette.name}); walls and built-ins take palette color according to strategy and coverage`;

  const wallColorPaletteInstruction = usesAutoWallPalette
    ? useLegacyNeutralGuardrails
      ? "Keep dominant walls neutral-forward and avoid abrupt hue shifts unless coverage explicitly calls for architectural color."
      : colorTier === "muted"
        ? "Let the selected palette set the hue of any wall color, but keep it a pale, low-saturation tint; light tonal walls are fine."
        : "Let the selected palette, strategy, and coverage decide wall color; do not default to white, gray, or navy walls unless the palette calls for them."
    : useLegacyNeutralGuardrails
      ? "Strictly honor the selected wall color palette. Keep dominant walls neutral-forward and avoid abrupt hue shifts unless coverage explicitly calls for architectural color."
      : "Strictly honor the selected wall color palette. Let strategy and coverage decide when walls, millwork, and built-ins become color carriers.";

  const isMoodyLuxury = colorMood === "Moody Luxury" || colorMood === "Dark Earthy";
  const lightingDirectionLines = styleOverride
    ? styleOverride.lightingLines
    : cond.lightingLines
    ? cond.lightingLines
    : isMoodyLuxury
    ? `- Soft overcast or late-afternoon daylight at the windows with a calm, enveloping interior feel
- Rich, deeper midtones and gentle shadow falloff so dark finishes keep depth without crushing detail
- Warm indirect cove lighting, backlit shelving, and layered practical fixtures create a glowing, intimate atmosphere
- Balanced exposure with preserved highlight detail (no blown windows)
- HDR photoreal rendering, physically accurate materials`
    : `- Bright natural daylight with an airy, sunlit interior feel and clean ambient bounce
- Lifted midtones and soft shadow detail so corners read clearly without looking flat
- ${quality.lighting}
- Realistic high-key exposure with preserved highlight detail (no blown windows)
- HDR photoreal rendering, physically accurate materials`;
  const cameraFinishLine = isMoodyLuxury
    ? `${quality.photography} with balanced ${quality.lightingBalanceStyle}lighting`
    : `${quality.photography} with bright ${quality.lightingBalanceStyle}lighting balance`;
  const darkWallRule = useLegacyNeutralGuardrails
    ? "Dark walls must be warm charcoal or soft near-black, not blue-heavy, not gray-green, and not muddy"
    : "Dark walls, when present, should read rich and true to the selected palette, never muddy or flat";

  const legacyNegativeCues = useLegacyNeutralGuardrails
    ? `- Avoid brightly saturated furniture upholstery or large furniture pieces in vivid green, vivid orange, or vivid red
- Avoid dominant blue accent walls, bright wall colors, and artificial-looking palettes`
    : `- Keep furniture, rugs, and built-ins aligned with the selected palette and coverage
- Avoid abrupt color shifts that break the palette story`;

  const lowIntensityNegativeCue =
    colorTier === "muted"
      ? "- Avoid saturated paint, vivid upholstery, and bold color blocking; the room should read calm, tonal, and mostly neutral with the palette as a quiet undertone\n"
      : "";

  const ceilingDirection =
    ceilingTypes.length > 0
      ? ceilingTypes.join(", ")
      : "smooth white ceiling";

  const ceilingLightingDirection =
    ceilingLightTypes.length > 0
      ? ceilingLightTypes.join(", ")
      : (styleOverride?.defaultCeilingLighting ?? cond.defaultCeilingLighting ?? quality.defaultCeilingLighting);

  const accentPhrase =
    colorTier === "muted"
      ? "quiet, restrained color touches"
      : colorTier === "soft"
        ? "restrained color accents"
        : null;
  const tuneAccentPhrase = (text: string): string =>
    accentPhrase
      ? text.replace(/(?:clearly )?visible color accents/, accentPhrase)
      : text;

  const styleDirections: Record<string, string> = {
    modern:
      "Clean geometry, contemporary palette with visible color accents, large format materials, minimal ornament, integrated lighting, uncluttered composition.",
    contemporary:
      "Current trend-forward mix of soft curves and clean lines, layered textures, statement pieces, balanced contrast.",
    minimalist:
      "Radical simplicity, tightly curated palette with one or two deliberate color moments, negative space, low visual noise, monolithic forms, minimal accessories.",
    scandinavian:
      "Light wood, white walls, soft daylight, cozy textiles, functional furniture, airy and warm simplicity.",
    japandi:
      "Japanese-Scandinavian fusion, natural materials, low-profile furniture, serene composition, restrained palette with subtle accent control.",
    "mid-century modern":
      "1950s-60s silhouettes, walnut/teak tones, tapered legs, iconic lounge forms, geometric rugs, playful vintage accents.",
    industrial:
      "Raw materials like concrete, steel, brick, exposed structure, matte black details, loft character and utilitarian forms.",
    bohemian:
      "Layered eclectic decor, artisanal textiles, mixed patterns, handmade objects, relaxed lived-in styling with global influences.",
    coastal:
      "Bright airy interiors, light woods, linen textures, ocean-inspired palette, breezy relaxed elegance, sunlit softness.",
    farmhouse:
      "Warm rustic-modern mix, painted millwork, natural wood beams, classic joinery, comfortable inviting family-oriented styling.",
    transitional:
      "Balanced blend of traditional and contemporary, timeless furniture shapes, balanced base with refined but clearly visible color accents.",
    traditional:
      "Classic detailing, symmetrical layouts, rich millwork, tailored upholstery, elegant layered decor and heritage finishes.",
    "art deco":
      "Bold geometry, luxurious materials, brass and lacquer accents, dramatic contrast, glamorous sculptural motifs.",
    "organic modern":
      "Soft contemporary forms, tactile natural materials, balanced tonal contrast, gentle curves, and calm ambiance.",
    "quiet luxury":
      "Understated premium finishes, tonal layering with refined visible color accents, bespoke detailing, sophisticated composition, impeccable craftsmanship.",
    eclectic:
      "Curated mix of eras and styles, intentional contrast, expressive art and objects, cohesive yet personality-driven composition.",
    "liminal spaces":
      "Empty, transitional interior with no people and almost no decor: an uncanny stillness, as if the place was abandoned minutes ago. Long sightlines and repeating architectural geometry (doorways, thresholds, evenly spaced fixtures), plain dated finishes, and a faint sense of déjà vu. Realistic, not stylized.",
  };

  const styleDirection = tuneAccentPhrase(
    styleDirections[style] ??
      "Strongly adhere to the selected style with distinct forms, materials, and styling choices."
  );

  const restrainedStyles = new Set([
    "minimalist",
    "scandinavian",
    "japandi",
    "quiet luxury",
  ]);

  const wallColorExecutionRule = !useLegacyNeutralGuardrails
    ? colorTier === "muted"
      ? "Keep walls light and tonal. Coverage may place the palette on surfaces, but only as pale, desaturated tints."
      : "Let color coverage and strategy determine whether walls and built-ins carry palette color; do not reassert neutral defaults."
    : restrainedStyles.has(style)
      ? "Keep the wall surface calm when the coverage setting is low, but let color coverage override wall neutrality when architectural surfaces are selected. Use layered whites, creams, taupes, wood, and stone rather than saturated wall paint unless coverage explicitly calls for stronger architectural color."
      : "Ensure tasteful palette variation through nuanced warm-neutral shifts, material contrast, and controlled accent detailing. Let color coverage determine whether walls stay neutral or carry palette color.";

  const conditionBlock = isPristine
    ? ""
    : `- Condition direction (critical): ${cond.direction}
- Surface wear: ${cond.wear}
${cond.colorRule ? `- Decay and color (critical): ${cond.colorRule}\n` : ""}`;

  return `
Ultra realistic ${style} ${room} with architecture and interior styling that clearly reflects this style.

Design Direction:
- Residential quality tier: ${homeQuality}; ${quality.direction}
- Atmosphere direction: ${styleOverride?.atmosphere ?? cond.atmosphere ?? quality.atmosphere}
${conditionBlock}- Style fidelity (critical): ${styleDirection}
- Every major design decision must reinforce ${style} characteristics so this image reads unmistakably as ${style}
- Millwork direction: ${quality.millwork}
- Material direction: ${quality.materials}
- Room scale direction: ${quality.roomScale}
- Trim and door direction: ${quality.trimAndDoors}
- Furniture and styling direction: ${styleOverride?.furniture ?? cond.furniture ?? quality.furniture}
  - Focal point direction: ${focalPointDirection}
  - Focal point rule (critical): ${focalPointRule}
${focalPointStyleLines}- Room size direction: ${roomSize}; architecture, furniture scale, circulation space, and camera composition should match this size faithfully
- Wall color palette direction: ${wallColorPaletteDirection}
- Color mood direction: ${colorMood}; ${colorMoodDirection}
- Color rule priority (critical): Room Type > ${cond.outranksColor ? "Condition > " : ""}Color Strategy > Color Intensity (strength of color) > Color Coverage (where color appears) > Home Quality > Palette Family > Color Mood > Interior Style > Wall Type
- Strategy precedence rule (critical): when strategy conflicts with mood, strategy wins.
- Color intensity direction: ${normalizedColorIntensity}/100 (${colorIntensityLevel})
- Color coverage direction: ${colorCoverage}; ${getCoverageDirective(colorCoverage, colorTier)}
- Enhanced color system directive (critical): ${colorPaletteDirective}
- Color profile direction: ${colorProfileDirection}
- Wall treatment / material direction: ${wallTreatmentDirection}, described as texture/material intent rather than a mandatory wall color restriction
- Furniture tone direction (critical): ${furnitureToneRule}
- Wall color execution rule: ${wallColorExecutionRule}
- Palette cohesion rule (critical): ${paletteCohesionRule}
- Color profile execution rule: ${
    colorProfileExecutionRule ||
    "Keep a balanced, tasteful, realistic color mix consistent with the selected palette."
  }
  - ${styleOverride ? styleOverride.sameness : cond.sameness ? cond.sameness : useLegacyNeutralGuardrails ? "Prevent flat monotony by varying warm neutrals, wood tones, and stone textures across images while keeping palettes restrained and cohesive" : "Prevent flat monotony by varying tones, textures, and material layers across images while maintaining palette cohesion"}
  - Hue guardrail (critical): ${hueGuardrailRule}
  - ${wallColorPaletteInstruction}
  - Accent color intensity rule (critical): ${cond.accentRule ?? accentIntensityRule}
- Window design direction: ${windowDesignDirection}, balanced with wall area and aligned to the selected outside view
- Window rule (critical): keep window-to-wall ratio consistent with the selected window style and avoid full glazing unless "floor-to-ceiling glazing walls" is selected
- Ceiling treatment direction: ${ceilingDirection}, ${cond.ceilingSuffix ?? quality.ceilingSuffix}
- Ceiling lighting direction: ${ceilingLightingDirection}, ${cond.ceilingLightingSuffix ?? quality.ceilingLightingSuffix}
- Color cast guardrail (critical): ${noGreenCastRule}
- ${styleOverride?.staging ?? (cond.staging || quality.staging)}

Lighting:
${lightingDirectionLines}

Camera:
${
  dramatic
    ? `- Camera angle (critical): ${dramatic.direction}
- ${cameraMode?.lens}
`
    : "- Wide interior composition, straight verticals, professional framing\n"
}- Composition target: ${styleOverride?.composition ?? cond.composition ?? quality.camera}${dramatic ? `; emphasis on ${dramatic.composition}` : ""}
- ${styleOverride?.cameraLine ?? cameraMode?.finish ?? `8k detail, tack-sharp focus, ${cond.cameraLine ?? cameraFinishLine}`}

View:
- ${getViewDirectionDirective(view)}
- Maintain framing according to the selected window style

Negative cues:
- No cartoon look, no CGI plastic surfaces, no neon-like oversaturation, ${cameraMode ? cameraMode.negative : "no distortion"}, ${cond.clutterNegative || quality.clutterNegative}
- ${legacyNegativeCues}
${useLegacyNeutralGuardrails ? "- No green hue cast, green tint, teal cast, blue-green cast, or gray-green cast on walls, stone, plaster, millwork, or dominant artwork unless explicitly selected" : "- Avoid unintentional color casts; walls, stone, plaster, and millwork must remain true to the selected palette"}
- ${darkWallRule}
- Keep accent colors cohesive to the selected palette and color intensity target; avoid neon-like or chaotic oversaturation
${lowIntensityNegativeCue}- Avoid off-palette statement artwork; artwork tones must remain inside the selected palette
- ${cond.negative ?? quality.negative}
${styleOverride ? `- ${styleOverride.negative}\n` : ""}`;
}
