import type { RoomType } from "@/lib/combinations";

type ShotBase = { id: string; label: string; group: string };

export type WholeHouseShot = ShotBase &
  (
    | { kind: "interior"; room: RoomType }
    | { kind: "exterior"; cameraView: string }
    | { kind: "accessory"; item: string }
  );

export const wholeHouseShots: WholeHouseShot[] = [
  { id: "front-exterior", group: "Exterior & outdoor", kind: "exterior", label: "Front exterior", cameraView: "front corner angle showing two sides of the home" },
  { id: "front-porch", group: "Exterior & outdoor", kind: "exterior", label: "Front porch", cameraView: "close view of the covered front porch and entry with seating and a welcoming door" },
  { id: "backyard", group: "Exterior & outdoor", kind: "exterior", label: "Backyard", cameraView: "backyard view with patio" },
  { id: "covered-patio", group: "Exterior & outdoor", kind: "exterior", label: "Covered patio", cameraView: "covered patio outdoor living room with comfortable seating, an outdoor rug, and the back of the home visible" },
  { id: "outdoor-kitchen", group: "Exterior & outdoor", kind: "exterior", label: "Outdoor kitchen", cameraView: "outdoor kitchen and BBQ area with built-in grill, counter, and bar seating" },
  { id: "pool", group: "Exterior & outdoor", kind: "exterior", label: "Pool & deck", cameraView: "swimming pool and pool deck with lounge chairs, with the back of the home in view" },

  { id: "foyer", group: "Entry & living", kind: "interior", room: "foyer", label: "Foyer" },
  { id: "hallway", group: "Entry & living", kind: "interior", room: "hallway", label: "Hallway" },
  { id: "staircase", group: "Entry & living", kind: "interior", room: "staircase", label: "Staircase" },
  { id: "living-room", group: "Entry & living", kind: "interior", room: "living room", label: "Living room" },
  { id: "family-room", group: "Entry & living", kind: "interior", room: "family room", label: "Family room" },
  { id: "dining-room", group: "Entry & living", kind: "interior", room: "dining room", label: "Dining room" },
  { id: "powder-room", group: "Entry & living", kind: "interior", room: "powder room", label: "Powder room" },

  { id: "kitchen", group: "Service", kind: "interior", room: "kitchen", label: "Kitchen" },
  { id: "mud-room", group: "Service", kind: "interior", room: "mud room", label: "Mud room" },
  { id: "laundry-room", group: "Service", kind: "interior", room: "laundry room", label: "Laundry room" },
  { id: "garage", group: "Service", kind: "interior", room: "garage", label: "Garage" },

  { id: "home-office", group: "Work & recreation", kind: "interior", room: "home office", label: "Home office" },
  { id: "library", group: "Work & recreation", kind: "interior", room: "library", label: "Library" },
  { id: "home-gym", group: "Work & recreation", kind: "interior", room: "home gym", label: "Home gym" },
  { id: "movie-room", group: "Work & recreation", kind: "interior", room: "theater room", label: "Movie room" },
  { id: "game-room", group: "Work & recreation", kind: "interior", room: "game room", label: "Game room" },
  { id: "home-bar", group: "Work & recreation", kind: "interior", room: "home bar", label: "Home bar" },
  { id: "wine-cellar", group: "Work & recreation", kind: "interior", room: "wine cellar", label: "Wine cellar" },

  { id: "primary-bedroom", group: "Bedrooms & baths", kind: "interior", room: "bedroom", label: "Primary bedroom" },
  { id: "second-bedroom", group: "Bedrooms & baths", kind: "interior", room: "bedroom", label: "Second bedroom" },
  { id: "third-bedroom", group: "Bedrooms & baths", kind: "interior", room: "bedroom", label: "Third bedroom" },
  { id: "primary-bathroom", group: "Bedrooms & baths", kind: "interior", room: "bathroom", label: "Primary bathroom" },
  { id: "second-bathroom", group: "Bedrooms & baths", kind: "interior", room: "bathroom", label: "Second bathroom" },
  { id: "third-bathroom", group: "Bedrooms & baths", kind: "interior", room: "bathroom", label: "Third bathroom" },
  { id: "walk-in-closet", group: "Bedrooms & baths", kind: "interior", room: "walk-in closet", label: "Walk-in closet" },

  { id: "acc-vase", group: "Accessory close-ups", kind: "accessory", label: "Vase", item: "ceramic vase" },
  { id: "acc-light-fixture", group: "Accessory close-ups", kind: "accessory", label: "Light fixture", item: "pendant light fixture" },
  { id: "acc-table-lamp", group: "Accessory close-ups", kind: "accessory", label: "Table lamp", item: "table lamp" },
  { id: "acc-bowl", group: "Accessory close-ups", kind: "accessory", label: "Decorative bowl", item: "decorative bowl" },
  { id: "acc-candles", group: "Accessory close-ups", kind: "accessory", label: "Candle holders", item: "candle holders with candles" },
  { id: "acc-hardware", group: "Accessory close-ups", kind: "accessory", label: "Cabinet hardware", item: "cabinet hardware (pulls and knobs)" },
];

export const WHOLE_HOUSE_IMAGE_COUNT = wholeHouseShots.length;

export const wholeHouseShotGroups = [
  ...new Set(wholeHouseShots.map((shot) => shot.group)),
];

// Unknown ids are ignored; an empty or missing selection means every shot.
export function resolveWholeHouseShots(ids: unknown): WholeHouseShot[] {
  if (!Array.isArray(ids)) {
    return wholeHouseShots;
  }

  const requested = new Set(ids.filter((id): id is string => typeof id === "string"));
  const selected = wholeHouseShots.filter((shot) => requested.has(shot.id));

  return selected.length > 0 ? selected : wholeHouseShots;
}
