/**
 * Products: real items (a lamp, a rug, a faucet) the person found in shops. The app reads each product from
 * its link, guesses the rooms it fits from its name, and asks for a look-alike in some of the images. The
 * image generator gets words, and (when "Match the product photo" is on and the shop's picture can be
 * downloaded) the picture itself, so it can draw the item closely. Without the picture it is a look-alike.
 * Each image that includes one records it, so the video app can list it with a timestamp.
 *
 * Nothing set means nothing changes: prompts, seeds and saved batch details stay as they were.
 */

export const MAX_PRODUCTS = 12;
export const PRODUCT_EVERY_DEFAULT = 2;
export const PRODUCT_EVERY_MAX = 6;

export type Product = {
  id: string;
  name: string;
  /** What it looks like, in words the image generator can use. Defaults to the name. */
  look: string;
  link: string;
  price: string;
  /** The product picture's address, kept for the video app's Shop the Look card. */
  image: string;
  /** Rooms it may appear in. Empty = any room. */
  rooms: string[];
  /** True when the rooms are the app's guess from the name (shown so the person can check them). */
  guessed: boolean;
};

/** What an image records about the product it includes. */
export type ProductRef = { name: string; link: string; price: string; image: string };

const LIVING = ["living room", "family room", "sunken living room", "library", "sunroom"];
const SLEEP = ["bedroom", "nursery"];
const WET = ["bathroom", "powder room", "laundry room"];

/** Words in a product's name -> rooms it fits. The first matching rule wins. */
const ROOM_RULES: { words: RegExp; rooms: string[] }[] = [
  { words: /\b(faucet|tap|sink|backsplash|range hood|cabinet pull|bar stool|counter ?stool|cutting board)\b/i, rooms: ["kitchen"] },
  { words: /\b(shower|bath ?mat|towel|vanity|toilet|bathtub|soap)\b/i, rooms: WET },
  { words: /\b(bed|duvet|comforter|bedding|pillow ?case|nightstand|bedside|headboard|canopy)\b/i, rooms: SLEEP },
  { words: /\b(dining|chandelier|sideboard|buffet|tableware|dinnerware)\b/i, rooms: ["dining room", "breakfast nook", "kitchen"] },
  { words: /\b(sofa|couch|sectional|loveseat|coffee table|ottoman|armchair|accent chair|lounge chair|tv stand|bookcase)\b/i, rooms: LIVING },
  { words: /\b(desk|office chair|monitor)\b/i, rooms: ["home office"] },
  { words: /\b(runner|hallway|console table|entryway|shoe)\b/i, rooms: ["foyer", "hallway", "stairwell"] },
  { words: /\b(lamp|rug|throw|blanket|vase|plant|planter|mirror|art|print|curtain|candle|basket|tray|pendant|lantern|screen|clock)\b/i, rooms: [...LIVING, ...SLEEP, "dining room", "foyer", "home office"] },
];

/** The rooms a product probably fits, from its name. Empty when it cannot tell (any room). */
export function guessRooms(name: string): string[] {
  const hit = ROOM_RULES.find((rule) => rule.words.test(name));

  return hit ? [...hit.rooms] : [];
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Reads saved or posted products, keeping only well-formed ones. */
export function sanitizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Product[] = [];

  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const source = item as Record<string, unknown>;
    const name = text(source.name, 120);
    const id = text(source.id, 40) || `p${out.length + 1}`;

    if (!name || seen.has(id)) continue;
    seen.add(id);
    const link = text(source.link, 500);
    const rooms = Array.isArray(source.rooms)
      ? [...new Set(source.rooms.filter((room): room is string => typeof room === "string").map((room) => room.trim()).filter(Boolean))].slice(0, 30)
      : guessRooms(name);

    out.push({
      id,
      name,
      look: text(source.look, 300) || name,
      link: /^https?:\/\//i.test(link) ? link : "",
      price: text(source.price, 20),
      image: /^https?:\/\//i.test(text(source.image, 500)) ? text(source.image, 500) : "",
      rooms,
      guessed: source.guessed === true,
    });
    if (out.length >= MAX_PRODUCTS) break;
  }

  return out;
}

export function sanitizeProductEvery(raw: unknown): number {
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= PRODUCT_EVERY_MAX ? raw : PRODUCT_EVERY_DEFAULT;
}

export function productFitsRoom(product: Product, room: string): boolean {
  return product.rooms.length === 0 || product.rooms.includes(room);
}

/**
 * The product (if any) for one image. `slot` counts the earlier images of the same room. Every
 * `every`-th image of a room gets one, cycling through the products that fit that room, so each shows
 * before any repeats and the other images stay as they are.
 */
export function productForImage(products: readonly Product[], room: string, slot: number, every: number): Product | null {
  const eligible = products.filter((product) => productFitsRoom(product, room));

  if (eligible.length === 0 || slot % Math.max(1, every) !== 0) return null;

  return eligible[Math.floor(slot / Math.max(1, every)) % eligible.length] as Product;
}

export function productRef(product: Product): ProductRef {
  return { name: product.name, link: product.link, price: product.price, image: product.image };
}

/**
 * The prompt line for an image with a product, or "" for none. Without the product's picture it says
 * plainly it is a look-alike; with it (`matched`) the image generator is told to copy the pictured item.
 */
export function productLines(product: Product | null | undefined, matched = false): string {
  if (!product) return "";

  return [
    matched
      ? "Product (include it clearly, naturally placed; it must look exactly like the item in the attached product photo):"
      : "Product (include it clearly, naturally placed, as a similar-looking item, not a copy of any brand):",
    `- ${product.look}`,
    "- Show no logos, brand names or readable labels on it.",
  ].join("\n");
}

/**
 * Tells the image generator what each attached picture is. With a room reference the room comes first and
 * the product photo second; without one the product photo is the only picture.
 */
export function productPhotoNote(withRoomReference: boolean): string {
  return withRoomReference
    ? "\n\nImage 1 is the room to keep. Image 2 is a photo of the product: the product in the finished picture must match image 2 exactly in shape, color, material and proportions. Do not copy image 2's background."
    : "\n\nImage 1 is a photo of the product: the product in the finished picture must match it exactly in shape, color, material and proportions. Do not copy its background.";
}

export function describeProducts(products: readonly Product[]): string {
  return products.length === 0 ? "" : `${products.length} product${products.length === 1 ? "" : "s"}`;
}
