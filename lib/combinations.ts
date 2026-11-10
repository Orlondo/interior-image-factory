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
  | "laundry room"
  | "hallway"
  | "stairwell"
  | "lobby"
  | "waiting room"
  | "empty office"
  | "indoor pool"
  | "sunroom"
  | "garage"
  | "staircase"
  | "powder room"
  | "home bar";

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
  "hallway",
  "stairwell",
  "lobby",
  "waiting room",
  "empty office",
  "indoor pool",
  "sunroom",
  "garage",
  "staircase",
  "powder room",
  "home bar",
];

export const views = [
  "regular inner-city neighborhood",
  "inner-city apartments (elevated view)",
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
  "wabi-sabi",
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
  "no fixed color palette (material-led)",
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
  "floor-to-ceiling room divider wall with integrated storage or millwork",
  "wood-framed rectangular doorway with clean trim and warm natural grain",
  "travertine-framed rectangular doorway with a simple stone surround",
  "marble-framed curved doorway with a soft arch and minimal detailing",
  "TV wall with integrated cabinetry and a clean media console below",
  "indoor open-to-outdoor living space with sliding glass doors, integrated indoor-outdoor seating, and a seamless transition to the exterior",
  "built-in wine wall with shelving and glass-front bottle storage",
  "indoor planterium wall with layered greenery and integrated lighting",
  "large dining table with a cluster of flowering plants as the centerpiece",
  "dining table with a modern Thanksgiving-inspired table setting or an everyday dinner table setting, modest plated portions, and simple servingware (not a grand banquet)",
  "kitchen countertop with everyday dinner styling, practical plates, and small realistic food details (not a ceremonial feast)",
  "friendly pet dog lounging near the focal area as a lived-in lifestyle element",
  "friendly pet cat perched or curled near the focal area as a lived-in lifestyle element",
  "fall floral arrangement with warm-toned leaves, branches, and seasonal texture",
  "small indoor tree plants with autumn foliage in sculptural planters",
  "gallery wall of fall photography prints in coordinated frames",
  "floor-to-ceiling marble wall with subtle veining and minimal trim",
  "mirror tile wall made of small square mirrors set in a tight grid to form one large mirrored wall",
  "single large seamless full-height mirror wall with minimal frame",
  "French doors with slim-framed glass panes, a symmetrical double-door design, and soft natural light",
  "regular floor lamp with a drum shade and warm ambient glow",
  "hanging floor lamp with an elegant shade and soft layered light",
  "clear glass divider wall with a warm wood frame and minimal profile",
  "bookcase room divider with open shelving on both sides and a simple wood frame",
  "metal divider wall with sculptural framing and slim linear detailing",
  "bedroom fireplace wall with plaster or stone surround",
  "kitchen fireplace as a backsplash feature with a simple framed surround",
  "kitchen fireplace framed on the countertop with a clean built-in profile",
  "kitchen fireplace integrated into the island with a centered linear fire feature",
  "small cluster of cactus plants in ceramic or concrete planters",
  "small potted tree in a simple ceramic or plaster planter",
  "curtains with layered sheer panels and a tailored linen drape",
  "curtains with a soft Roman shade and woven textured fabric",
  "curtains with a dramatic full-length velvet drape",
  "gallery wall of framed photography and art prints",
  "large architectural painting with a minimalist frame",
  "mixed wall art arrangement with vintage and contemporary pieces",
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
  "linear suspension lights",
  "industrial cage pendants",
  "lantern or orb pendants",
  "wall sconces with ambient glow",
  "LED strip accent lighting",
  "oversized drum shade pendants",
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
  "Monochrome Tonal",
  "Soft Pastel",
  "Vivid Eclectic",
  "Cool Modern",
  "Dark Earthy",
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

export const singleHeroColors = [
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
] as const;

export const heroColors = [
  "Auto",
  "Designer Mixed",
  "Earthy Mixed",
  "Jewel Tone Mixed",
  "Warm Mixed",
  "Cool Mixed",
  "Monochrome",
  "Pastel Mixed",
  "Vivid Mixed",
  "Slate & Steel",
  "Dark Earthy Mixed",
  "Pink Mixed",
  "Purple Mixed",
  ...singleHeroColors,
] as const;

export type HeroColor = (typeof heroColors)[number];
export type SingleHeroColor = (typeof singleHeroColors)[number];

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

export { conditions } from "./promptBuilder/condition";
export { cameras } from "./promptBuilder/camera";

export const homeQualities = [
  "builder's grade layout",
  "everyday",
  "upscale",
  "luxury",
  "ultra luxury",
] as const;