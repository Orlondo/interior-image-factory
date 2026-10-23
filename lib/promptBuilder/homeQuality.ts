/**
 * Home quality profiles. Every line of the prompt that depends on the quality tier lives here, so a
 * tier changes the whole prompt (millwork, ceiling and lighting wording, furniture, styling,
 * photography), not only a few lines. See specs/home-quality/spec.md.
 */

export type HomeQualityKey =
  | "builder's grade layout"
  | "everyday"
  | "upscale"
  | "luxury"
  | "ultra luxury";

export type HomeQualityProfile = {
  /** One-line tier direction. */
  direction: string;
  atmosphere: string;
  materials: string;
  /** Replaces the old fixed "Bespoke millwork and seamless built-ins" line. */
  millwork: string;
  roomScale: string;
  trimAndDoors: string;
  furniture: string;
  /** Replaces the fixed "Perfect spatial balance, clean lines, no clutter" line. */
  staging: string;
  /** Wording that follows the selected ceiling treatment (the selection itself is never changed). */
  ceilingSuffix: string;
  /** Wording that follows the selected ceiling lighting (the selection itself is never changed). */
  ceilingLightingSuffix: string;
  /** Used when no ceiling lighting is selected. */
  defaultCeilingLighting: string;
  /** The main lighting line (the Moody Luxury mood keeps its own lighting lines). */
  lighting: string;
  /** Replaces "premium real-estate editorial photography". */
  photography: string;
  /** Word placed before "lighting balance" in the photography line, empty for the plainer tiers. */
  lightingBalanceStyle: string;
  camera: string;
  negative: string;
  /** The clutter wording in the shared negative cues. */
  clutterNegative: string;
};

export const HOME_QUALITY_PROFILES: Record<HomeQualityKey, HomeQualityProfile> = {
  "builder's grade layout": {
    direction:
      "Standard tract-home planning with common room proportions, practical circulation, and straightforward spatial organization.",
    atmosphere:
      "Simple, familiar, mass-market residential atmosphere without premium or bespoke architectural drama.",
    materials:
      "Builder-grade finishes: painted drywall, stock cabinetry, laminate or entry-level quartz counters, standard hardware, simple baseboards.",
    millwork:
      "Stock, factory-made millwork only: plain flat-panel doors, simple baseboards, no custom built-ins or decorative paneling.",
    roomScale:
      "Ordinary room proportions with a standard 8-foot flat ceiling; nothing grand, nothing oversized.",
    trimAndDoors:
      "Plain narrow baseboards, hollow-core doors, basic window trim with no crown molding or decorative casing.",
    furniture:
      "Mass-market, mixed retail furniture in ordinary condition and modest scale; simple rugs and basic decor, not coordinated by a designer.",
    staging:
      "Tidy, ordinary lived-in room with a simple, practical arrangement; no heavy staging and no styled vignettes.",
    ceilingSuffix: "plain and practical, with basic lighting",
    ceilingLightingSuffix: "practical and appropriate for a standard builder-grade home",
    defaultCeilingLighting: "plain flush-mount fixtures and a few standard recessed downlights",
    lighting:
      "Ordinary ceiling fixtures and a few table lamps give an even, functional room glow",
    photography: "straightforward real-estate listing photography",
    lightingBalanceStyle: "",
    camera:
      "Straightforward real-estate framing with practical composition and no high-luxury editorial dramatization.",
    negative:
      "Avoid bespoke luxury detailing, palatial scale, exotic premium materials, couture styling, and designer showroom staging.",
    clutterNegative: "no heavy clutter or mess",
  },
  everyday: {
    direction:
      "Comfortable, practical, realistic materials and furniture; clean but approachable styling and moderate finishes.",
    atmosphere:
      "Warm, functional, realistic everyday residential atmosphere with thoughtful but practical choices.",
    materials:
      "Painted drywall, practical wood finishes, quartz or laminate surfaces, ceramic tile, matte black or brushed nickel hardware.",
    millwork:
      "Simple, practical millwork: clean flat-panel cabinetry and basic shelving, with no ornate or custom detailing.",
    roomScale: "Comfortable, realistic proportions with a standard ceiling height.",
    trimAndDoors:
      "Simple baseboards and window trim, standard painted doors, modest hardware.",
    furniture:
      "Practical retail furniture with a few better pieces; comfortable seating, simple rugs and ordinary decor.",
    staging:
      "Warm, lived-in arrangement with clean lines and a few personal items; comfortable, not staged.",
    ceilingSuffix: "simple and clean, integrated with the lighting",
    ceilingLightingSuffix: "simple and appropriate for a comfortable everyday home",
    defaultCeilingLighting: "recessed downlights",
    lighting:
      "Practical ceiling fixtures and lamps give a warm, comfortable room glow",
    photography: "clean real-estate photography",
    lightingBalanceStyle: "",
    camera:
      "Professional real-estate style framing, realistic proportions, natural lived-in feel.",
    negative:
      "Avoid opulent mansion cues, excessive marble, palatial detailing, or ultra-luxury staging.",
    clutterNegative: "no heavy clutter or mess",
  },
  upscale: {
    direction:
      "Higher-end finishes, refined detailing, curated furniture mix, elevated but still realistic residential quality.",
    atmosphere:
      "Refined and elevated residential atmosphere with polished details and higher-end selections.",
    materials:
      "Quality hardwood or engineered wood, quartz or selected stone, tailored millwork, premium textiles, mixed metal accents.",
    millwork:
      "Tailored millwork and well-built, seamless built-ins with clean, refined detailing.",
    roomScale:
      "Generous proportions with a 9-foot ceiling and well-planned circulation.",
    trimAndDoors:
      "Tailored baseboards and casing, solid-core doors, quality hardware.",
    furniture:
      "Curated mix of quality pieces with good upholstery, layered rugs and considered decor.",
    staging: "Perfect spatial balance, clean lines, no clutter",
    ceilingSuffix: "elegant and integrated with the lighting design",
    ceilingLightingSuffix: "refined and appropriate for upscale residential interiors",
    defaultCeilingLighting: "concealed cove lighting",
    lighting:
      "Warm indirect cove lighting and layered practical fixtures to create an elegant luminous glow",
    photography: "premium real-estate editorial photography",
    lightingBalanceStyle: "editorial ",
    camera:
      "Editorial residential framing with refined composition and balanced detail emphasis.",
    negative: "Avoid both bargain/basic look and excessive ultra-luxury opulence.",
    clutterNegative: "no clutter",
  },
  luxury: {
    direction:
      "Premium finishes, bespoke detailing, designer furniture, polished composition, and clearly luxurious execution.",
    atmosphere:
      "Calm, refined, high-end atmosphere with premium finish quality and designer-level composition.",
    materials:
      "Premium marble and stone accents, bespoke millwork, designer textiles, white oak or walnut, brushed brass details.",
    millwork:
      "Bespoke millwork and seamless custom built-ins with precise, premium detailing.",
    roomScale:
      "Large, well-proportioned room with high ceilings and a sense of spaciousness.",
    trimAndDoors:
      "Deep crown molding and substantial casing, custom doors, premium architectural hardware.",
    furniture:
      "Designer furniture and premium textiles, coordinated with intent, layered rugs and quality art.",
    staging:
      "Perfect spatial balance, precise clean lines, polished and uncluttered",
    ceilingSuffix: "refined, with detailed finishing integrated with the lighting design",
    ceilingLightingSuffix: "refined and appropriate for luxury residential interiors",
    defaultCeilingLighting: "concealed cove lighting",
    lighting:
      "Warm indirect cove lighting and layered designer fixtures to create a refined luminous glow",
    photography: "high-end design-magazine photography",
    lightingBalanceStyle: "editorial ",
    camera:
      "High-end design magazine framing with premium lighting and precise composition.",
    negative: "Avoid cheap/basic finishes and avoid cartoonish excess.",
    clutterNegative: "no clutter",
  },
  "ultra luxury": {
    direction:
      "Top-tier bespoke architecture and interiors, exceptional craftsmanship, museum-grade styling, and ultra-premium finishes.",
    atmosphere:
      "Exceptionally refined, opulent, and impeccably crafted atmosphere with top-tier bespoke execution.",
    materials:
      "Museum-grade stone slabs, custom artisan millwork, couture textiles, collectible furnishings, exceptional custom detailing.",
    millwork:
      "Museum-grade custom joinery and artisan built-ins with exceptional, hand-finished detailing.",
    roomScale:
      "Grand scale with an exceptional ceiling, double-height where the room allows, and generous space around every piece.",
    trimAndDoors:
      "Museum-grade custom joinery, oversized custom doors, and hand-finished architectural detailing.",
    furniture:
      "Collectible, custom and couture furnishings, one-of-a-kind pieces, rare textiles and gallery-quality art.",
    staging:
      "Flawless spatial balance, exacting lines, gallery-level restraint with nothing out of place",
    ceilingSuffix: "exquisitely detailed and fully integrated with the lighting design",
    ceilingLightingSuffix: "exquisite and appropriate for ultra-luxury residences",
    defaultCeilingLighting: "concealed cove lighting",
    lighting:
      "Concealed cove lighting, sculptural fixtures and layered accent light create a rarefied luminous glow",
    photography: "architectural-hero editorial photography",
    lightingBalanceStyle: "editorial ",
    camera:
      "Architectural Digest-level hero composition with dramatic yet elegant cinematic precision.",
    negative: "Avoid budget materials or generic catalog-level styling.",
    clutterNegative: "no clutter",
  },
};
