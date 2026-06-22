import type {
  ColorCoverage,
  ColorMood,
  ColorStrategy,
  HeroColor,
  RoomType,
} from "@/lib/combinations";
import { buildColorPaletteDirective } from "@/lib/promptBuilder/colorPalette";

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

function getCoverageDirective(colorCoverage: ColorCoverage): string {
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

function getColorProfileExecutionRule(
  colorProfileTypes: string[],
  useLegacyNeutralGuardrails: boolean
): string {
  const colorProfileExecutionMap: Record<string, string> = {
    "current balanced palette (default)":
      useLegacyNeutralGuardrails
        ? "Keep a designer-curated neutral story centered on warm white, cream, taupe, greige, stone, and natural wood, with subtle accent restraint."
        : "Keep the palette cohesive and color-led across surfaces, furnishings, and styling without reasserting neutral-wall defaults.",
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
    input.colorCoverage === "Decor Only" ||
    clampColorIntensity(input.colorIntensity) <= 20
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
  ceilingLightTypes: string[]
) {
  const colorMoodDirection =
    COLOR_MOOD_DIRECTION_MAP[colorMood] ?? COLOR_MOOD_DIRECTION_MAP["Warm Neutral"];

  const normalizedColorIntensity = clampColorIntensity(colorIntensity);
  const colorIntensityLevel = getColorIntensityLevel(normalizedColorIntensity);
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
    useLegacyNeutralGuardrails
  );
  const allowEarthyBias =
    normalizedColorProfileTypes.length === 1 &&
    normalizedColorProfileTypes.includes("earthy saturated palette");

  const hueGuardrailRule = allowEarthyBias
    ? "Earthy saturation is allowed because the earthy profile was explicitly selected."
    : useLegacyNeutralGuardrails
      ? "Keep dominant walls in warm-neutral families (warm white, ivory, cream, linen, taupe, greige, sand, warm charcoal). Avoid blue accent walls, highly saturated paint colors, and excessive cool-gray dominance."
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
  } else if (normalizedColorIntensity <= 20) {
    furnitureToneRule =
      "Use the lightest color touches on furniture, but allow a colored chair, sofa, bench, or rug to carry the palette when coverage asks for architectural surfaces.";
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
  } else if (normalizedColorIntensity <= 20) {
    accentIntensityRule =
      "Accent colors can be very light, but still allow a colored wall or built-in when coverage selects Architectural Surfaces.";
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
    "Keep palette family cohesion while allowing controlled variation and tonal exploration across walls, cabinetry, millwork, built-ins, rugs, furniture, and artwork.";

  const focalPointDirection =
    focalPointTypes.length > 0
      ? focalPointTypes.join(", ")
      : "balanced composition with subtle design elements";

  const focalPointRule =
    focalPointTypes.length > 0
      ? `Feature one or more avant-garde focal points: ${focalPointTypes.join(", ")}. Make these elements daringly bold, conceptually interesting, and visually commanding. Prioritize artistic expression and experimental design over conventional aesthetics. These should provoke thought or challenge expectations.`
      : "Compose with subtle design elements and balanced spatial flow without one dominating focal point.";

  const windowDesignDirection =
    windowStyleTypes.length > 0
      ? windowStyleTypes.join(", ")
      : "balanced windows (standard residential)";

  const wallTreatmentDirection = getWallTreatmentDirective(wallTypes);

  const wallColorPaletteInstruction = useLegacyNeutralGuardrails
    ? "Strictly honor the selected wall color palette. Keep dominant walls neutral-forward and avoid abrupt hue shifts unless coverage explicitly calls for architectural color."
    : "Strictly honor the selected wall color palette. Let strategy and coverage decide when walls, millwork, and built-ins become color carriers.";

  const legacyNegativeCues = useLegacyNeutralGuardrails
    ? `- Avoid brightly saturated furniture upholstery or large furniture pieces in vivid green, vivid orange, or vivid red
- Avoid dominant blue accent walls, bright wall colors, and artificial-looking palettes`
    : `- Keep furniture, rugs, and built-ins aligned with the selected palette and coverage
- Avoid abrupt color shifts that break the palette story`;

  const ceilingDirection =
    ceilingTypes.length > 0
      ? ceilingTypes.join(", ")
      : "smooth white ceiling";

  const ceilingLightingDirection =
    ceilingLightTypes.length > 0
      ? ceilingLightTypes.join(", ")
      : "concealed cove lighting";

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
      "Transitional uncanny ambiance, sparse composition, atmospheric lighting, quiet emptiness, clean geometric corridors and thresholds, subtly surreal but realistic architectural mood.",
  };

  const styleDirection =
    styleDirections[style] ??
    "Strongly adhere to the selected style with distinct forms, materials, and styling choices.";

  const restrainedStyles = new Set([
    "minimalist",
    "scandinavian",
    "japandi",
    "quiet luxury",
  ]);

  const wallColorExecutionRule = !useLegacyNeutralGuardrails
    ? "Let color coverage and strategy determine whether walls and built-ins carry palette color; do not reassert neutral defaults."
    : restrainedStyles.has(style)
      ? "Keep the wall surface calm when the coverage setting is low, but let color coverage override wall neutrality when architectural surfaces are selected. Use layered whites, creams, taupes, wood, and stone rather than saturated wall paint unless coverage explicitly calls for stronger architectural color."
      : "Ensure tasteful palette variation through nuanced warm-neutral shifts, material contrast, and controlled accent detailing. Let color coverage determine whether walls stay neutral or carry palette color.";

  const homeQualityDirections: Record<"builder's grade layout" | "everyday" | "upscale" | "luxury" | "ultra luxury", string> = {
    "builder's grade layout":
      "Standard tract-home planning with common room proportions, practical circulation, and straightforward spatial organization.",
    everyday:
      "Comfortable, practical, realistic materials and furniture; clean but approachable styling and moderate finishes.",
    upscale:
      "Higher-end finishes, refined detailing, curated furniture mix, elevated but still realistic residential quality.",
    luxury:
      "Premium finishes, bespoke detailing, designer furniture, polished composition, and clearly luxurious execution.",
    "ultra luxury":
      "Top-tier bespoke architecture and interiors, exceptional craftsmanship, museum-grade styling, and ultra-premium finishes.",
  };

  const homeQualityDirection = homeQualityDirections[homeQuality];

  const qualityAtmosphere: Record<"builder's grade layout" | "everyday" | "upscale" | "luxury" | "ultra luxury", string> = {
    "builder's grade layout":
      "Simple, familiar, mass-market residential atmosphere without premium or bespoke architectural drama.",
    everyday:
      "Warm, functional, realistic everyday residential atmosphere with thoughtful but practical choices.",
    upscale:
      "Refined and elevated residential atmosphere with polished details and higher-end selections.",
    luxury:
      "Calm, refined, high-end atmosphere with premium finish quality and designer-level composition.",
    "ultra luxury":
      "Exceptionally refined, opulent, and impeccably crafted atmosphere with top-tier bespoke execution.",
  };

  const qualityMaterialDirection: Record<"builder's grade layout" | "everyday" | "upscale" | "luxury" | "ultra luxury", string> = {
    "builder's grade layout":
      "Builder-grade finishes: painted drywall, stock cabinetry, laminate or entry-level quartz counters, standard hardware, simple baseboards.",
    everyday:
      "Painted drywall, practical wood finishes, quartz or laminate surfaces, ceramic tile, matte black or brushed nickel hardware.",
    upscale:
      "Quality hardwood or engineered wood, quartz or selected stone, tailored millwork, premium textiles, mixed metal accents.",
    luxury:
      "Premium marble and stone accents, bespoke millwork, designer textiles, white oak or walnut, brushed brass details.",
    "ultra luxury":
      "Museum-grade stone slabs, custom artisan millwork, couture textiles, collectible furnishings, exceptional custom detailing.",
  };

  const qualityCameraDirection: Record<"builder's grade layout" | "everyday" | "upscale" | "luxury" | "ultra luxury", string> = {
    "builder's grade layout":
      "Straightforward real-estate framing with practical composition and no high-luxury editorial dramatization.",
    everyday:
      "Professional real-estate style framing, realistic proportions, natural lived-in feel.",
    upscale:
      "Editorial residential framing with refined composition and balanced detail emphasis.",
    luxury:
      "High-end design magazine framing with premium lighting and precise composition.",
    "ultra luxury":
      "Architectural Digest-level hero composition with dramatic yet elegant cinematic precision.",
  };

  const qualityNegativeDirection: Record<"builder's grade layout" | "everyday" | "upscale" | "luxury" | "ultra luxury", string> = {
    "builder's grade layout":
      "Avoid bespoke luxury detailing, palatial scale, exotic premium materials, and couture styling.",
    everyday:
      "Avoid opulent mansion cues, excessive marble, palatial detailing, or ultra-luxury staging.",
    upscale:
      "Avoid both bargain/basic look and excessive ultra-luxury opulence.",
    luxury:
      "Avoid cheap/basic finishes and avoid cartoonish excess.",
    "ultra luxury":
      "Avoid budget materials or generic catalog-level styling.",
  };

  return `
Ultra realistic ${style} ${room} with architecture and interior styling that clearly reflects this style.

Design Direction:
- Residential quality tier: ${homeQuality}; ${homeQualityDirection}
- Atmosphere direction: ${qualityAtmosphere[homeQuality]}
- Style fidelity (critical): ${styleDirection}
- Every major design decision must reinforce ${style} characteristics so this image reads unmistakably as ${style}
- Bespoke millwork and seamless built-ins
- Material direction: ${qualityMaterialDirection[homeQuality]}
  - Focal point direction: ${focalPointDirection}
  - Focal point rule (critical): ${focalPointRule}
  - When focal points are selected: prioritize artistic impact, conceptual clarity, and avant-garde expression over comfort or conventionality
  - Sculptural and experimental designer furniture, collectible art objects, unconventional materials
  - Styling accessories: bold art pieces, conceptual sculptures, unconventional objects that challenge the eye
  - Accessories should feel intentional, provocative, and culturally aware - pushing boundaries while maintaining cohesion
- Room size direction: ${roomSize}; architecture, furniture scale, circulation space, and camera composition should match this size faithfully
- Wall color palette direction: ${wallColorPalette}
- Color mood direction: ${colorMood}; ${colorMoodDirection}
- Color rule priority (critical): Room Type > Color Strategy > Color Coverage > Color Intensity > Palette Family > Color Mood > Interior Style > Home Quality > Wall Type
- Strategy precedence rule (critical): when strategy conflicts with mood, strategy wins.
- Color intensity direction: ${normalizedColorIntensity}/100 (${colorIntensityLevel})
- Color coverage direction: ${colorCoverage}; ${getCoverageDirective(colorCoverage)}
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
  - ${useLegacyNeutralGuardrails ? "Prevent flat monotony by varying warm neutrals, wood tones, and stone textures across images while keeping palettes restrained and cohesive" : "Prevent flat monotony by varying tones, textures, and material layers across images while maintaining palette cohesion"}
  - Hue guardrail (critical): ${hueGuardrailRule}
  - ${wallColorPaletteInstruction}
  - Accent color intensity rule (critical): ${accentIntensityRule}
- Window design direction: ${windowDesignDirection}, balanced with wall area and aligned to the selected outside view
- Window rule (critical): keep window-to-wall ratio consistent with the selected window style and avoid full glazing unless "floor-to-ceiling glazing walls" is selected
- Ceiling treatment direction: ${ceilingDirection}, elegant and integrated with the lighting design
- Ceiling lighting direction: ${ceilingLightingDirection}, refined and appropriate for luxury residential interiors
- Color cast guardrail (critical): ${noGreenCastRule}
- Perfect spatial balance, clean lines, no clutter

Lighting:
- Bright natural daylight with an airy, sunlit interior feel and clean ambient bounce
- Lifted midtones and soft shadow detail so corners read clearly without looking flat
- Warm indirect cove lighting and layered practical fixtures to create an elegant luminous glow
- Realistic high-key exposure with preserved highlight detail (no blown windows)
- HDR photoreal rendering, physically accurate materials

Camera:
- Wide interior composition, straight verticals, professional framing
- Composition target: ${qualityCameraDirection[homeQuality]}
- 8k detail, tack-sharp focus, premium real-estate editorial photography with bright editorial lighting balance

View:
- ${view}, framed according to the selected window style

Negative cues:
- No cartoon look, no CGI plastic surfaces, no neon-like oversaturation, no distortion, no clutter
- ${legacyNegativeCues}
${useLegacyNeutralGuardrails ? "- No green hue cast, green tint, teal cast, blue-green cast, or gray-green cast on walls, stone, plaster, millwork, or dominant artwork unless explicitly selected" : "- Avoid unintentional color casts; walls, stone, plaster, and millwork must remain true to the selected palette"}
- Dark walls must be warm charcoal or soft near-black, not blue-heavy, not gray-green, and not muddy
- Keep accent colors cohesive to the selected palette and color intensity target; avoid neon-like or chaotic oversaturation
- Avoid off-palette statement artwork; artwork tones must remain inside the selected palette
- ${qualityNegativeDirection[homeQuality]}
`;
}
