import { colorProfiles, rooms, views } from "./combinations";
import { buildPrompt } from "./promptBuilder";
import { getColorPreviewData } from "./promptBuilder/colorPalette";
import { getDefaultWallColorPalette } from "./wallColorPalette";
import type { Setup } from "./setup";

/** The prompt for the first scenario, as shown in the Prompt Preview panel. */
export function buildPromptPreview(setup: Setup): string {
  return buildPrompt(
    setup.rooms[0] ?? rooms[0] ?? "living room",
    setup.roomSize,
    setup.designStyle,
    setup.colorMood,
    setup.colorIntensity,
    setup.colorStrategy,
    setup.colorCoverage,
    setup.heroColor,
    setup.autoPaletteVariation,
    0,
    setup.maxImages,
    setup.homeQuality,
    getDefaultWallColorPalette(setup.colorProfiles),
    [setup.colorProfiles[0] ?? colorProfiles[0] ?? "current balanced palette (default)"],
    setup.views[0] ?? views[0] ?? "regular inner-city neighborhood",
    setup.windowStyles.slice(0, 1),
    setup.focalPoints.slice(0, 1),
    setup.walls.slice(0, 1),
    setup.ceilings.slice(0, 1),
    setup.ceilingLights.slice(0, 1)
  );
}

export function buildPromptPreviewColors(setup: Setup) {
  return getColorPreviewData({
    colorMood: setup.colorMood,
    colorStrategy: setup.colorStrategy,
    colorCoverage: setup.colorCoverage,
    heroColor: setup.heroColor,
    colorIntensity: setup.colorIntensity,
    autoPaletteVariation: setup.autoPaletteVariation,
    imageIndex: 0,
    maxImages: setup.maxImages,
  });
}
