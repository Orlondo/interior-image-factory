import { countsInOrder, type RoomCounts } from "./roomMix";

/**
 * Room sets: one room shown from several angles ("Angles per room"), and a run of rooms that look like
 * one house ("Same house"). Both are made live, one image after another, because each later image
 * is built from an earlier one as a reference. The OpenAI batch route cannot do that, so these runs are
 * limited to LIVE_IMAGE_LIMIT images (the same limit at which the app switches to batches).
 */

export const MAX_ANGLES = 6;
export const LIVE_IMAGE_LIMIT = 24;

/** One room, made once and then shown from `size` angles (the first image sets the room). */
export type RoomSet = {
  room: string;
  /** Position among all sets, starting at 1. */
  number: number;
  /** Images in this set (the angles, including the first). */
  size: number;
};

/**
 * Splits each room's image count into sets of `angles` images. A count that does not divide evenly ends
 * with a smaller set (7 images at 3 angles: 3, 3, 1), so the total is always exactly the images asked for.
 */
export function planRoomSets(
  rooms: readonly string[],
  counts: RoomCounts,
  angles: number
): RoomSet[] {
  const per = Math.max(1, Math.min(MAX_ANGLES, Math.floor(angles) || 1));
  const sets: RoomSet[] = [];

  rooms.forEach((room, index) => {
    let remaining = countsInOrder(rooms, counts)[index] ?? 0;

    while (remaining > 0) {
      const size = Math.min(per, remaining);
      sets.push({ room, number: sets.length + 1, size });
      remaining -= size;
    }
  });

  return sets;
}

export function usesRoomSets(angles: number, sameHouse: boolean): boolean {
  return angles > 1 || sameHouse;
}

/** "3 living rooms × 4 angles" style text for the page. */
export function describeSets(sets: readonly RoomSet[], angles: number, sameHouse: boolean): string {
  if (!usesRoomSets(angles, sameHouse) || sets.length === 0) {
    return "";
  }

  const byRoom = new Map<string, number>();
  sets.forEach((set) => byRoom.set(set.room, (byRoom.get(set.room) ?? 0) + 1));
  const rooms = [...byRoom.entries()].map(([room, count]) => `${count} ${room}${count === 1 ? "" : "s"}`);
  const parts = [
    angles > 1 ? `${rooms.join(", ")}, each shown from up to ${angles} angles` : rooms.join(", "),
  ];

  if (sameHouse) {
    parts.push(sets.length > 1 ? "all in one house" : "one house");
  }

  return parts.join(", ");
}

/** A message when the run is too big to do live, or null when it is fine. */
export function liveLimitMessage(maxImages: number, angles: number, sameHouse: boolean): string | null {
  if (usesRoomSets(angles, sameHouse) && maxImages > LIVE_IMAGE_LIMIT) {
    return `Room angles and Same house are made one image after another, so they are limited to ${LIVE_IMAGE_LIMIT} images. Lower Max images, or turn them off for a larger batch.`;
  }

  return null;
}

// ---------------------------------------------------------------------------------------------
// the order images are made in
// ---------------------------------------------------------------------------------------------

export type RunKind =
  /** Made from the prompt alone. */
  | "anchor"
  /** The first image of a later room in a same-house run: made from the house's first image as a style reference. */
  | "house"
  /** Another angle of the set's first image. */
  | "angle";

export type RunItem = {
  /** Position in the run (0-based): also the image's place in the results. */
  index: number;
  kind: RunKind;
  set: number;
  /** 0 for the set's first image, then 1, 2, ... */
  angle: number;
  /** The image this one is built from, or null. */
  ref: number | null;
  /** How many images must be finished before this one can start (0 = it can start at once). */
  depth: number;
};

export function planRuns(sets: readonly RoomSet[], sameHouse: boolean): RunItem[] {
  const items: RunItem[] = [];
  const houseAnchor = 0;

  for (const set of sets) {
    const anchorIndex = items.length;
    const fromHouse = sameHouse && set.number > 1;
    const anchorRef = fromHouse ? houseAnchor : null;

    items.push({
      index: anchorIndex,
      kind: fromHouse ? "house" : "anchor",
      set: set.number,
      angle: 0,
      ref: anchorRef,
      depth: anchorRef === null ? 0 : 1,
    });

    for (let angle = 1; angle < set.size; angle += 1) {
      items.push({
        index: items.length,
        kind: "angle",
        set: set.number,
        angle,
        ref: anchorIndex,
        depth: (items[anchorIndex] as RunItem).depth + 1,
      });
    }
  }

  return items;
}

/**
 * Runs the items in order of depth: everything that needs nothing first, then what needs one finished
 * image, and so on, `concurrency` at a time. `make` gets the finished reference image (base64) when the
 * item has one and it was made, and returns the new image, or null if the service sent none. An
 * item whose reference did not come back gets null and is expected to make a plain image instead.
 * An error from `make` stops the run, as a failed image always has.
 */
export async function runReferenceItems(
  items: readonly RunItem[],
  make: (item: RunItem, reference: string | null) => Promise<string | null>,
  concurrency: number
): Promise<(string | null)[]> {
  const results: (string | null)[] = items.map(() => null);
  const deepest = items.reduce((most, item) => Math.max(most, item.depth), 0);

  for (let depth = 0; depth <= deepest; depth += 1) {
    const wave = items.filter((item) => item.depth === depth);

    for (let at = 0; at < wave.length; at += Math.max(1, concurrency)) {
      const chunk = wave.slice(at, at + Math.max(1, concurrency));
      const made = await Promise.all(
        chunk.map((item) => make(item, item.ref === null ? null : (results[item.ref] ?? null)))
      );
      chunk.forEach((item, position) => {
        results[item.index] = made[position] ?? null;
      });
    }
  }

  return results;
}
