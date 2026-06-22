import assert from "node:assert/strict";
import test from "node:test";

import { buildPrompt } from "../lib/promptBuilder";
import {
  getColorPreviewData,
  selectPalette,
  buildColorPaletteDirective,
} from "../lib/promptBuilder/colorPalette";
import type { ColorCoverage, ColorMood, ColorStrategy, HeroColor } from "../lib/combinations";

type PromptOverrides = {
  colorMood?: ColorMood;
  colorIntensity?: number;
  colorStrategy?: ColorStrategy;
  colorCoverage?: ColorCoverage;
  heroColor?: HeroColor;
  imageIndex?: number;
  maxImages?: number;
  autoPaletteVariation?: boolean;
};

function buildTestPrompt(overrides: PromptOverrides = {}): string {
  return buildPrompt(
    "living room",
    "standard room (180-280 sq ft)",
    "modern",
    overrides.colorMood ?? "Warm Neutral",
    overrides.colorIntensity ?? 75,
    overrides.colorStrategy ?? "Designer Layered",
    overrides.colorCoverage ?? "Architectural Surfaces",
    overrides.heroColor ?? "Designer Mixed",
    overrides.autoPaletteVariation ?? true,
    overrides.imageIndex ?? 0,
    overrides.maxImages ?? 12,
    "upscale",
    "cool contemporary mix (white, gray, slate blue, charcoal accents)",
    ["current balanced palette (default)"],
    "city skyline",
    ["balanced windows (standard residential)"],
    ["oversized abstract art or mural"],
    ["textured plaster walls"],
    ["smooth white ceiling"],
    ["recessed downlights"]
  );
}

test("intensity 0 includes minimal color language", () => {
  const prompt = buildTestPrompt({ colorIntensity: 0 });
  assert.match(prompt, /minimal color/i);
});

test("intensity 100 includes strong designer palette language", () => {
  const prompt = buildTestPrompt({ colorIntensity: 100 });
  assert.match(prompt, /strong designer palette/i);
});

test("auto palette variation rotates palettes across a 12-image batch", () => {
  const paletteNames = Array.from({ length: 12 }, (_, imageIndex) =>
    selectPalette({
      colorMood: "Warm Neutral",
      colorStrategy: "Designer Layered",
      heroColor: "Designer Mixed",
      imageIndex,
      autoPaletteVariation: true,
    }).name
  );

  const uniquePaletteCount = new Set(paletteNames).size;
  assert.ok(uniquePaletteCount >= 4, `Expected >= 4 unique palettes, got ${uniquePaletteCount}`);
});

test("architectural surfaces requires major surface participation", () => {
  const directive = buildColorPaletteDirective({
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    colorCoverage: "Architectural Surfaces",
    heroColor: "Designer Mixed",
    colorIntensity: 75,
    autoPaletteVariation: true,
    imageIndex: 0,
    maxImages: 12,
    style: "modern",
  });

  assert.match(directive, /at least one major surface/i);
});

test("gallery inspired intensity over 75 requires two major surfaces", () => {
  const directive = buildColorPaletteDirective({
    colorMood: "Warm Neutral",
    colorStrategy: "Gallery Inspired",
    colorCoverage: "Architectural Surfaces",
    heroColor: "Designer Mixed",
    colorIntensity: 80,
    autoPaletteVariation: true,
    imageIndex: 3,
    maxImages: 12,
    style: "modern",
  });

  assert.match(directive, /at least two major architectural surfaces/i);
});

test("preview metadata reports active intensity and variation", () => {
  const preview = getColorPreviewData({
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    colorCoverage: "Architectural Surfaces",
    heroColor: "Designer Mixed",
    colorIntensity: 75,
    autoPaletteVariation: true,
    imageIndex: 3,
    maxImages: 12,
  });

  assert.equal(preview.colorIntensity, 75);
  assert.equal(preview.variationNumber, 4);
  assert.equal(preview.variationTotal, 12);
});
