import { singleHeroColors } from "./combinations";
import { houseMetals } from "./houseProfile";

/**
 * Room details: small extras that sit alongside a room's focal point, such as a backsplash style, a bed style,
 * wildflowers in a glass vase or a floor mirror. Each detail knows which rooms it makes sense in, so a kitchen
 * backsplash is never asked of a bedroom. Everything is optional: with nothing picked, prompts, seeds and
 * saved batch details stay exactly as they were.
 *
 * Details are plain words, not tied to any channel or brand. To add one later, add a line to ROOM_DETAILS.
 */

export type RoomDetail = {
  /** The saved value and the chip label. Unique. */
  id: string;
  group: string;
  /** What the prompt says. {color} and {metal} are filled in per image. */
  text: string;
  /** Rooms it fits. Leave out for any room. */
  rooms?: readonly string[];
};

export const DETAIL_GROUPS = ["Kitchen", "Bedroom", "Decor", "Furniture & accents"] as const;
export type DetailGroup = (typeof DETAIL_GROUPS)[number];

const LIVING = ["living room", "family room", "sunken living room", "library", "sunroom"] as const;
const SLEEP = ["bedroom", "nursery"] as const;
const ENTRY = ["foyer", "hallway", "stairwell", "staircase", "lobby"] as const;

export const ROOM_DETAILS: readonly RoomDetail[] = [
  // Kitchen
  { id: "Subway tile backsplash", group: "Kitchen", rooms: ["kitchen"], text: "a classic subway tile backsplash with clean grout lines" },
  { id: "Zellige tile backsplash", group: "Kitchen", rooms: ["kitchen"], text: "a handmade zellige tile backsplash with soft, uneven glazed surfaces" },
  { id: "Marble slab backsplash", group: "Kitchen", rooms: ["kitchen"], text: "a full-height marble slab backsplash with natural veining" },
  { id: "Herringbone tile backsplash", group: "Kitchen", rooms: ["kitchen"], text: "a herringbone-pattern tile backsplash" },
  { id: "Patterned tile backsplash", group: "Kitchen", rooms: ["kitchen"], text: "a patterned cement tile backsplash as a graphic feature" },
  { id: "Colored countertops", group: "Kitchen", rooms: ["kitchen"], text: "{color}-toned stone countertops, with the color clearly visible and the surface realistic" },
  { id: "Colored faucet", group: "Kitchen", rooms: ["kitchen", "bathroom", "powder room", "laundry room"], text: "a {color} faucet as a bold color accent" },
  { id: "Metal faucet", group: "Kitchen", rooms: ["kitchen", "bathroom", "powder room", "laundry room"], text: "a statement faucet in {metal}" },
  { id: "Kitchen accessories", group: "Kitchen", rooms: ["kitchen"], text: "kitchen accessories on the counter: a utensil crock, a wooden cutting board, small herb pots and olive oil bottles" },
  { id: "Food staging", group: "Kitchen", rooms: ["kitchen", "dining room"], text: "food staged on the counter or table in a realistic way: a fruit bowl, fresh bread and a small cheese board, never a feast" },

  // Bedroom
  { id: "Platform bed", group: "Bedroom", rooms: SLEEP, text: "a low platform bed with a simple frame" },
  { id: "Canopy bed", group: "Bedroom", rooms: SLEEP, text: "a canopy bed with a light fabric or slim frame canopy" },
  { id: "Day bed", group: "Bedroom", rooms: [...SLEEP, "home office", "sunroom", "library"], text: "a day bed with a bolster and cushions along the back" },
  { id: "Four-poster bed", group: "Bedroom", rooms: SLEEP, text: "a four-poster bed with slim carved posts" },
  { id: "Upholstered bed", group: "Bedroom", rooms: SLEEP, text: "a tall upholstered bed with a tufted or channeled headboard" },
  { id: "Low Japanese-style bed", group: "Bedroom", rooms: SLEEP, text: "a low Japanese-style bed with a minimal wood frame" },
  { id: "Bed tray", group: "Bedroom", rooms: SLEEP, text: "a breakfast tray resting on the bed with a cup, a small plate and a flower" },
  { id: "Bedside pendants", group: "Bedroom", rooms: SLEEP, text: "a pendant light hanging on each side of the bed in place of bedside lamps" },
  { id: "Side lamps", group: "Bedroom", rooms: SLEEP, text: "a matching table lamp on each bedside table" },
  { id: "Cabinet over the bed", group: "Bedroom", rooms: SLEEP, text: "a built-in cabinet with doors above the headboard" },

  // Decor (any room)
  { id: "Wildflowers in glass vases", group: "Decor", text: "wildflowers loosely arranged in clear glass vases of different heights" },
  { id: "Colored vases", group: "Decor", text: "{color} ceramic vases grouped on a surface, with the color clearly visible" },
  { id: "Fiddle leaf fig", group: "Decor", text: "a tall fiddle leaf fig in a simple planter" },
  { id: "Monstera", group: "Decor", text: "a large monstera in a ceramic planter" },
  { id: "Olive tree", group: "Decor", text: "a small olive tree in a stone or terracotta planter" },
  { id: "Snake plants", group: "Decor", text: "snake plants in a row of matching planters" },
  { id: "Trailing pothos", group: "Decor", text: "a trailing pothos on a shelf or high cabinet" },
  { id: "Palms", group: "Decor", text: "a leafy indoor palm in a woven basket planter" },
  { id: "Bonsai", group: "Decor", text: "a bonsai tree on a console or table" },
  { id: "Dried pampas grass", group: "Decor", text: "tall dried pampas grass in a floor vase" },
  { id: "Colored table", group: "Decor", rooms: [...LIVING, "dining room", "bedroom", "home office", "breakfast nook"], text: "a {color} side or coffee table as a color accent" },

  // Furniture & accents
  { id: "Chinese screen", group: "Furniture & accents", rooms: [...LIVING, ...SLEEP, "dining room", "foyer", "home office"], text: "a folding Chinese screen with a painted or carved panel standing against a wall" },
  { id: "Floor mirror", group: "Furniture & accents", rooms: [...LIVING, ...SLEEP, "walk-in closet", "foyer", "hallway", "bathroom", "dining room"], text: "a freestanding full-length floor mirror leaning against or standing in front of a wall" },
  { id: "Picture lights", group: "Furniture & accents", text: "slim picture lights above framed artwork, switched on with a soft warm glow" },
  { id: "Hallway runner", group: "Furniture & accents", rooms: [...ENTRY, "kitchen"], text: "a long runner rug running the length of the space" },
  { id: "Curved sofa", group: "Furniture & accents", rooms: LIVING, text: "a curved, rounded sofa as the main seating" },
  { id: "Sculptural lounge chair", group: "Furniture & accents", rooms: [...LIVING, ...SLEEP, "library", "home office"], text: "a sculptural lounge chair with a distinctive silhouette" },
  { id: "Fluted sideboard", group: "Furniture & accents", rooms: ["dining room", "living room", "foyer", "family room"], text: "a long sideboard with fluted wood doors" },
  { id: "Round pedestal table", group: "Furniture & accents", rooms: ["dining room", "breakfast nook", "kitchen"], text: "a round pedestal table" },
];

export const ROOM_DETAIL_IDS: readonly string[] = ROOM_DETAILS.map((detail) => detail.id);
export const DETAIL_COLOR_CHOICES: readonly string[] = singleHeroColors;
export const DETAILS_PER_IMAGE_DEFAULT = 2;
export const DETAILS_PER_IMAGE_MAX = 3;

export function detailsInGroup(group: string): RoomDetail[] {
  return ROOM_DETAILS.filter((detail) => detail.group === group);
}

/** True when a detail fits the room (details with no room list fit any room). */
export function detailFitsRoom(detail: RoomDetail, room: string): boolean {
  return !detail.rooms || detail.rooms.includes(room);
}

/** Keeps only known details, in catalogue order, without repeats. */
export function sanitizeDetails(raw: unknown): string[] {
  const picked = new Set(Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : []);

  return ROOM_DETAIL_IDS.filter((id) => picked.has(id));
}

export function sanitizeDetailColors(raw: unknown): string[] {
  const picked = new Set(Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : []);

  return DETAIL_COLOR_CHOICES.filter((color) => picked.has(color));
}

export function sanitizeDetailsPerImage(raw: unknown): number {
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= DETAILS_PER_IMAGE_MAX
    ? raw
    : DETAILS_PER_IMAGE_DEFAULT;
}

/**
 * The details for one image. Of the picked details that fit this room, `perImage` are chosen by cycling
 * through them as the room's images go by (`slot` is how many images of this room came before), so every
 * picked detail shows before any repeats. Colors for {color} items cycle through the picked colors, or
 * through all colors when none are picked.
 */
export function detailsForImage(
  picked: readonly string[],
  room: string,
  slot: number,
  perImage: number = DETAILS_PER_IMAGE_DEFAULT,
  colors: readonly string[] = []
): string[] {
  const eligible = ROOM_DETAILS.filter((detail) => picked.includes(detail.id) && detailFitsRoom(detail, room));

  if (eligible.length === 0) {
    return [];
  }

  const palette = colors.length > 0 ? colors : DETAIL_COLOR_CHOICES;
  const count = Math.min(perImage, eligible.length);
  const chosen: RoomDetail[] = [];

  for (let step = 0; step < count; step += 1) {
    chosen.push(eligible[(slot * count + step) % eligible.length] as RoomDetail);
  }

  return chosen.map((detail, step) =>
    detail.text
      .replace("{color}", (palette[(slot + step) % palette.length] as string).toLowerCase())
      .replace("{metal}", houseMetals[(slot + step) % houseMetals.length] as string)
  );
}

/** The lines added to an image's prompt, or "" when it has no details. */
export function roomDetailLines(details: readonly string[]): string {
  if (details.length === 0) {
    return "";
  }

  return [
    "Room details (include each of these clearly, realistic and naturally placed, without crowding the room):",
    ...details.map((text) => `- ${text}`),
  ].join("\n");
}

/** "3 details" style text for the page and the saved batch details. */
export function describeDetails(picked: readonly string[]): string {
  return picked.length === 0 ? "" : picked.length <= 3 ? picked.join(", ") : `${picked.length} details`;
}
