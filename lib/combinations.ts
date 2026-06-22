export type RoomType =
  | "living room"
  | "sunken living room"
  | "family room"
  | "breakfast nook"
  | "library"
  | "bedroom"
  | "nursery"
  | "kitchen"
  | "bathroom"
  | "foyer"
  | "dining room"
  | "basement"
  | "home office"
  | "home gym"
  | "theater room"
  | "game room"
  | "wine cellar"
  | "recording studio"
  | "pantry"
  | "mud room"
  | "walk-in closet"
  | "laundry room";

export const rooms: RoomType[] = [
  "living room",
  "sunken living room",
  "family room",
  "breakfast nook",
  "library",
  "bedroom",
  "nursery",
  "kitchen",
  "bathroom",
  "foyer",
  "dining room",
  "basement",
  "home office",
  "home gym",
  "theater room",
  "game room",
  "wine cellar",
  "recording studio",
  "pantry",
  "mud room",
  "walk-in closet",
  "laundry room",
];

export const views = [
  "regular inner-city neighborhood",
  "suburban neighborhood street",
  "park courtyard",
  "forest",
  "ocean",
  "city skyline",
];

export const styles = [
  "modern",
  "contemporary",
  "minimalist",
  "scandinavian",
  "japandi",
  "mid-century modern",
  "industrial",
  "bohemian",
  "coastal",
  "farmhouse",
  "transitional",
  "traditional",
  "art deco",
  "organic modern",
  "quiet luxury",
  "eclectic",
  "liminal spaces",
];

export const walls = [
  "white walls",
  "stone walls",
  "wallpaper walls",
  "textured plaster walls",
  "fluted/ribbed panel walls",
  "wood panel walls",
];

export const windowStyles = [
  "minimal windows (mostly solid walls)",
  "balanced windows (standard residential)",
  "large picture windows",
  "floor-to-ceiling glazing walls",
  "clerestory and transom windows",
];

export const wallColorPalettes = [
  "balanced modern mix (white, warm gray, dusty blue, pure charcoal)",
  "fresh light mix (white, pale blue, soft lilac, blush)",
  "cool contemporary mix (white, pure gray, deep navy blue, charcoal accents)",
  "earthy warm mix (sand, clay, terracotta, olive)",
  "jewel accent mix (neutral base with sapphire, amethyst, and deep navy accents)",
  "high-contrast mix (white, black, and one cool accent like cobalt or violet)",
  "coastal blue mix (powder blue, dusty navy, pure sky blue, white trim)",
  "blush and rose mix (blush pink, rose beige, warm ivory, soft taupe)",
  "green designer mix (sage green, olive green, eucalyptus, creamy white)",
  "wine accent mix (wine red, merlot, dusty mauve, warm gray base)",
];

export const colorProfiles = [
  "current balanced palette (default)",
  "rich color-forward palette",
  "high-contrast palette",
  "earthy saturated palette",
  "soft pastel palette",
];

export const focalPoints = [
  "dramatic raw material wall (exposed concrete, brick, metal)",
  "suspended or floating sculptural installation",
  "asymmetrical architectural intervention",
  "kinetic or light-based art installation",
  "monolithic single-material statement wall",
  "ceiling-as-canvas (painted, textured, or sculptural)",
  "oversized abstract art or mural",
  "radical geometric or angular architectural element",
  "unexpected material juxtaposition (marble meets rust, etc.)",
  "minimalist conceptual art piece",
];

export const ceilings = [
  "smooth white ceiling",
  "coffered ceiling",
  "wood beam ceiling",
  "vaulted ceiling",
  "microcement ceiling",
  "soft cove-lit ceiling",
];

export const ceilingLights = [
  "recessed downlights",
  "statement chandelier",
  "minimal track lighting",
  "architectural pendant lights",
  "concealed cove lighting",
  "flush mount ceiling lights",
];

export const roomSizes = [
  "compact room (120-180 sq ft)",
  "standard room (180-280 sq ft)",
  "large room (280-420 sq ft)",
  "grand room (420-650 sq ft)",
];

export const colorMoods = [
  "Warm Neutral",
  "Organic Earthy",
  "Light & Airy",
  "Moody Luxury",
  "Coastal Neutral",
] as const;

export type ColorMood = (typeof colorMoods)[number];

export const colorStrategies = [
  "Neutral Base",
  "Accent Color",
  "Designer Layered",
  "Statement Room",
  "Gallery Inspired",
  "Nature Inspired",
  "Color Drenched",
] as const;

export type ColorStrategy = (typeof colorStrategies)[number];

export const colorCoverages = [
  "Decor Only",
  "Softly Distributed",
  "Architectural Surfaces",
  "Whole Room",
] as const;

export type ColorCoverage = (typeof colorCoverages)[number];

export const heroColors = [
  "Auto",
  "Designer Mixed",
  "Earthy Mixed",
  "Jewel Tone Mixed",
  "Warm Mixed",
  "Cool Mixed",
] as const;

export const legacyHeroColors = [
  "Deep Blue",
  "Teal",
  "Emerald",
  "Olive",
  "Sage",
  "Terracotta",
  "Rust",
  "Burgundy",
  "Plum",
  "Mustard",
  "Gold",
  "Mixed",
] as const;

export type HeroColor = (typeof heroColors)[number];
export type LegacyHeroColor = (typeof legacyHeroColors)[number];

export const COLOR_STRATEGY_DEFAULT: ColorStrategy = "Designer Layered";
export const COLOR_COVERAGE_DEFAULT: ColorCoverage = "Architectural Surfaces";
export const HERO_COLOR_DEFAULT: HeroColor = "Auto";
export const AUTO_PALETTE_VARIATION_DEFAULT = true;

export const COLOR_INTENSITY_MIN = 0;
export const COLOR_INTENSITY_MAX = 100;
export const COLOR_INTENSITY_DEFAULT = 25;

export const COLOR_PRESENCE_MIN = COLOR_INTENSITY_MIN;
export const COLOR_PRESENCE_MAX = COLOR_INTENSITY_MAX;
export const COLOR_PRESENCE_DEFAULT = COLOR_INTENSITY_DEFAULT;

export const homeQualities = [
  "builder's grade layout",
  "everyday",
  "upscale",
  "luxury",
  "ultra luxury",
] as const;