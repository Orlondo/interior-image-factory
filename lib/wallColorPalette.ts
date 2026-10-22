import {
  wallColorPalettes,
  type ColorCoverage,
  type ColorStrategy,
} from "./combinations";

// Sentinel meaning "no wall palette was chosen: follow the selected color palette".
export const AUTO_WALL_COLOR_PALETTE = "auto";

const NEUTRAL_LEANING_WALL_PALETTES = [
  "balanced modern mix",
  "fresh light mix",
  "cool contemporary mix",
  "coastal blue mix",
] as const;

function findWallPalette(keyword: string, fallback: string): string {
  return wallColorPalettes.find((palette) => palette.includes(keyword)) ?? fallback;
}

export function getDefaultWallColorPalette(colorProfileSelection: string[]): string {
  const selectedProfiles = new Set(colorProfileSelection);
  const earthyOnlySelection =
    colorProfileSelection.length === 1 && selectedProfiles.has("earthy saturated palette");

  if (earthyOnlySelection) {
    return findWallPalette("earthy warm mix", "earthy warm mix (sand, clay, terracotta, olive)");
  }

  if (selectedProfiles.has("high-contrast palette")) {
    return findWallPalette(
      "high-contrast mix",
      "high-contrast mix (white, black, and one strong accent color)"
    );
  }

  if (selectedProfiles.has("rich color-forward palette")) {
    return findWallPalette(
      "coastal blue mix",
      "coastal blue mix (powder blue, dusty navy, soft teal, white trim)"
    );
  }

  if (selectedProfiles.has("soft pastel palette")) {
    return findWallPalette(
      "blush and rose mix",
      "blush and rose mix (blush pink, rose beige, warm ivory, soft taupe)"
    );
  }

  return AUTO_WALL_COLOR_PALETTE;
}

export function getWallColorRandomPool(input: {
  colorProfileSelection: string[];
  colorStrategy: ColorStrategy;
  colorCoverage: ColorCoverage;
}): string[] {
  const earthyOnlySelection =
    input.colorProfileSelection.length === 1 &&
    input.colorProfileSelection.includes("earthy saturated palette");
  const neutralLeaning =
    input.colorStrategy === "Neutral Base" || input.colorCoverage === "Decor Only";

  if (earthyOnlySelection || !neutralLeaning) {
    return [...wallColorPalettes];
  }

  const neutralPool = wallColorPalettes.filter((palette) =>
    NEUTRAL_LEANING_WALL_PALETTES.some((keyword) => palette.includes(keyword))
  );

  return neutralPool.length > 0 ? neutralPool : [...wallColorPalettes];
}
