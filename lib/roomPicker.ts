/**
 * Pure logic for the room picker: quick sets, which category groups start open, and the
 * search filter. Kept out of the component so it can be tested without a browser.
 */

export type RoomGroup<R extends string = string> = {
  title: string;
  rooms: R[];
};

export type QuickSet = {
  id: string;
  label: string;
  rooms: string[];
};

/**
 * One click selects a whole set of rooms. A quick set replaces the current selection, so what you
 * see is exactly what you get; tick or untick rooms afterwards to adjust it.
 */
export const QUICK_SETS: QuickSet[] = [
  {
    id: "main-living",
    label: "Main living areas",
    rooms: ["living room", "family room", "dining room", "kitchen"],
  },
  {
    id: "bedrooms-baths",
    label: "Bedrooms & baths",
    rooms: ["bedroom", "nursery", "bathroom", "walk-in closet"],
  },
  {
    id: "work-storage",
    label: "Work & storage",
    rooms: ["home office", "pantry", "laundry room", "mud room"],
  },
  {
    id: "entertaining",
    label: "Entertaining",
    rooms: ["dining room", "theater room", "game room", "wine cellar"],
  },
  {
    id: "transitional",
    label: "Transitional places",
    rooms: ["hallway", "stairwell", "lobby", "waiting room", "empty office", "indoor pool"],
  },
];

/** Keeps only rooms that exist, and drops a set that ends up with fewer than two rooms. */
export function resolveQuickSets(available: readonly string[], sets: QuickSet[] = QUICK_SETS): QuickSet[] {
  const known = new Set(available);

  return sets
    .map((set) => ({ ...set, rooms: set.rooms.filter((room) => known.has(room)) }))
    .filter((set) => set.rooms.length >= 2);
}

/** True when the selection is exactly this set (in any order). */
export function quickSetMatches(selected: readonly string[], set: QuickSet): boolean {
  return selected.length === set.rooms.length && set.rooms.every((room) => selected.includes(room));
}

export function countSelected(group: RoomGroup, selected: readonly string[]): number {
  return group.rooms.filter((room) => selected.includes(room)).length;
}

/**
 * Which groups start open: any group with a selected room. If nothing is selected, the first group
 * opens so the picker never looks empty.
 */
export function initialOpenGroups(
  groups: readonly RoomGroup[],
  selected: readonly string[]
): Record<string, boolean> {
  const open: Record<string, boolean> = {};

  for (const group of groups) {
    open[group.title] = countSelected(group, selected) > 0;
  }

  if (groups.length > 0 && !groups.some((group) => open[group.title])) {
    open[groups[0].title] = true;
  }

  return open;
}

/** Search matches a room name or a category name. An empty query returns everything. */
export function filterGroups<R extends string>(
  groups: readonly RoomGroup<R>[],
  query: string
): RoomGroup<R>[] {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return [...groups];
  }

  return groups
    .map((group) => ({
      ...group,
      rooms: group.rooms.filter(
        (room) => room.toLowerCase().includes(needle) || group.title.toLowerCase().includes(needle)
      ),
    }))
    .filter((group) => group.rooms.length > 0);
}

/** Selected rooms of a group, in the group's own order, for the one-line summary of a closed row. */
export function selectedInGroup(group: RoomGroup, selected: readonly string[]): string[] {
  return group.rooms.filter((room) => selected.includes(room));
}
