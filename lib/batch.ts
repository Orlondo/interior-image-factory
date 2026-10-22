import type { Setup } from "./setup";

/**
 * Number of distinct scenarios the server builds from the selections.
 * Mirrors app/generate/route.ts: an empty group falls back to one default
 * value, and focal points only multiply when at least one is selected.
 */
export function countCombinations(setup: Setup): number {
  const groups = [
    setup.rooms,
    setup.views,
    setup.colorProfiles,
    setup.focalPoints,
    setup.windowStyles,
    setup.walls,
    setup.ceilings,
    setup.ceilingLights,
  ];

  return groups.reduce((total, group) => total * Math.max(1, group.length), 1);
}

export type BatchDescription = {
  combinations: number;
  images: number;
  /** "sample" when combinations exceed the image count, "repeat" when they fall short, else "exact". */
  mode: "exact" | "sample" | "repeat";
  message: string;
};

/**
 * The server always generates exactly `maxImages`. With more combinations it
 * takes a random sample; with fewer it cycles through them again.
 */
export function describeBatch(combinations: number, maxImages: number): BatchDescription {
  const noun = combinations === 1 ? "combination" : "combinations";

  if (combinations > maxImages) {
    return {
      combinations,
      images: maxImages,
      mode: "sample",
      message: `${combinations.toLocaleString("en-US")} ${noun} selected. Generating ${maxImages}, a random sample.`,
    };
  }

  if (combinations < maxImages) {
    return {
      combinations,
      images: maxImages,
      mode: "repeat",
      message: `${combinations} ${noun} selected. Generating ${maxImages}, so some repeat with different color variations.`,
    };
  }

  return {
    combinations,
    images: maxImages,
    mode: "exact",
    message: `${combinations} ${noun} selected. Generating ${maxImages}, one of each.`,
  };
}

/** A random non-empty subset (1 to `maxPicks` items) of `options`. */
export function pickRandomSubset<T>(
  options: readonly T[],
  random: () => number = Math.random,
  maxPicks = 3
): T[] {
  if (options.length === 0) {
    return [];
  }

  const count = 1 + Math.floor(random() * Math.min(maxPicks, options.length));
  const pool = [...options];
  const picked: T[] = [];

  while (picked.length < count && pool.length > 0) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    const [item] = pool.splice(index, 1);

    if (item !== undefined) {
      picked.push(item);
    }
  }

  return picked;
}
