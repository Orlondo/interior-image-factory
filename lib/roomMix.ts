export type RoomCounts = Record<string, number>;

/**
 * Splits `total` images across `rooms` as evenly as possible. Rooms earlier in the
 * list get the extra image when the split is uneven (20 images, 3 rooms: 7, 7, 6).
 * Used by both the page and the server so what you see is what you get.
 */
export function evenSplit(rooms: readonly string[], total: number): RoomCounts {
  const counts: RoomCounts = {};

  if (rooms.length === 0) {
    return counts;
  }

  const base = Math.floor(total / rooms.length);
  const extra = total % rooms.length;

  rooms.forEach((room, index) => {
    counts[room] = base + (index < extra ? 1 : 0);
  });

  return counts;
}

/** The counts as a list in the same order as `rooms` (missing rooms count as 0). */
export function countsInOrder(rooms: readonly string[], counts: RoomCounts): number[] {
  return rooms.map((room) => counts[room] ?? 0);
}

export function sumCounts(rooms: readonly string[], counts: RoomCounts): number {
  return countsInOrder(rooms, counts).reduce((total, count) => total + count, 0);
}

/**
 * Checks custom counts against the selected rooms and the image total.
 * Returns an error message, or null when the counts are valid.
 */
export function validateRoomCounts(
  counts: unknown,
  rooms: readonly string[],
  total: number
): string | null {
  if (typeof counts !== "object" || counts === null || Array.isArray(counts)) {
    return "roomCounts must be an object of room names to counts.";
  }

  const entries = Object.entries(counts as Record<string, unknown>);

  for (const [room, count] of entries) {
    if (!rooms.includes(room)) {
      return `roomCounts includes "${room}", which is not a selected room.`;
    }

    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      return `roomCounts for "${room}" must be a whole number of 0 or more.`;
    }
  }

  const assigned = rooms.reduce((sum, room) => {
    const count = (counts as Record<string, unknown>)[room];
    return sum + (typeof count === "number" ? count : 0);
  }, 0);

  return assigned === total
    ? null
    : `roomCounts add up to ${assigned}, but maxImages is ${total}.`;
}

/**
 * Scales counts to a new total while keeping their ratios (largest remainder method),
 * so the result always adds up to `newTotal`.
 */
export function rescaleCounts(
  rooms: readonly string[],
  counts: RoomCounts,
  newTotal: number
): RoomCounts {
  const current = countsInOrder(rooms, counts);
  const currentTotal = current.reduce((sum, count) => sum + count, 0);

  if (rooms.length === 0) {
    return {};
  }

  if (currentTotal === 0) {
    return evenSplit(rooms, newTotal);
  }

  const exact = current.map((count) => (count / currentTotal) * newTotal);
  const floors = exact.map((value) => Math.floor(value));
  let remaining = newTotal - floors.reduce((sum, value) => sum + value, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const { index } of byRemainder) {
    if (remaining <= 0) {
      break;
    }

    floors[index] = (floors[index] ?? 0) + 1;
    remaining -= 1;
  }

  const result: RoomCounts = {};
  rooms.forEach((room, index) => {
    result[room] = floors[index] ?? 0;
  });

  return result;
}

/** "kitchen 10, living room 10", skipping rooms with no images. */
export function describeSplit(rooms: readonly string[], counts: RoomCounts): string {
  return rooms
    .filter((room) => (counts[room] ?? 0) > 0)
    .map((room) => `${room} ${counts[room]}`)
    .join(", ");
}
