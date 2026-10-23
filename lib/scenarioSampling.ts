/** Above this many combinations the server samples instead of listing them all. */
export const FULL_ENUMERATION_LIMIT = 5000;

/** Total number of combinations for groups of the given sizes (empty groups count as 1). */
export function totalCombinations(sizes: readonly number[]): number {
  return sizes.reduce((total, size) => total * Math.max(1, size), 1);
}

/**
 * `count` distinct integers in [0, total), chosen uniformly (Floyd's algorithm).
 * If `count` is not smaller than `total`, every index is returned.
 */
export function sampleDistinctIndices(
  total: number,
  count: number,
  random: () => number
): number[] {
  if (count >= total) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const chosen = new Set<number>();

  for (let upper = total - count; upper < total; upper += 1) {
    const candidate = Math.floor(random() * (upper + 1));
    chosen.add(chosen.has(candidate) ? upper : candidate);
  }

  return [...chosen];
}

/** Splits one combination index into a position inside each group (mixed radix). */
export function decodeIndex(index: number, sizes: readonly number[]): number[] {
  const positions: number[] = [];
  let remainder = index;

  for (let group = sizes.length - 1; group >= 0; group -= 1) {
    const size = Math.max(1, sizes[group] ?? 1);
    positions[group] = remainder % size;
    remainder = Math.floor(remainder / size);
  }

  return positions;
}
