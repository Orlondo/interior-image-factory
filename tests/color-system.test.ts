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

test("material-led palettes allow broader accent variation without repeating the same family", () => {
  const directive = buildColorPaletteDirective({
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    colorCoverage: "Architectural Surfaces",
    heroColor: "Auto",
    colorIntensity: 60,
    autoPaletteVariation: true,
    imageIndex: 2,
    maxImages: 12,
    style: "modern",
  });

  assert.match(directive, /broader accent variation|varied accent|accent variation/i);
});

test("pink and purple palette families are selectable with matching palette colors", () => {
  const pinkPalette = selectPalette({
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    heroColor: "Pink Mixed",
    imageIndex: 0,
    autoPaletteVariation: false,
  });
  const purplePalette = selectPalette({
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    heroColor: "Purple Mixed",
    imageIndex: 0,
    autoPaletteVariation: false,
  });

  assert.equal(pinkPalette.family, "Pink Mixed");
  assert.match(`${pinkPalette.primary} ${pinkPalette.secondary}`, /pink|rose/i);
  assert.equal(purplePalette.family, "Purple Mixed");
  assert.match(`${purplePalette.primary} ${purplePalette.secondary}`, /purple|plum|lilac|amethyst/i);
});

test("kitchen prompts exclude curtain-based focal points", () => {
  const prompt = buildPrompt(
    "kitchen",
    "standard room (180-280 sq ft)",
    "modern",
    "Warm Neutral",
    60,
    "Designer Layered",
    "Architectural Surfaces",
    "Auto",
    true,
    0,
    12,
    "upscale",
    "balanced modern mix (white, warm gray, dusty blue, pure charcoal)",
    ["current balanced palette (default)"],
    "city skyline",
    ["balanced windows (standard residential)"],
    ["curtains with layered sheer panels and a tailored linen drape"],
    ["textured plaster walls"],
    ["smooth white ceiling"],
    ["recessed downlights"]
  );

  assert.doesNotMatch(prompt, /curtain/i);
});

test("non-dining rooms exclude food-focused focal points", () => {
  const prompt = buildPrompt(
    "living room",
    "standard room (180-280 sq ft)",
    "modern",
    "Warm Neutral",
    60,
    "Designer Layered",
    "Architectural Surfaces",
    "Auto",
    true,
    0,
    12,
    "upscale",
    "balanced modern mix (white, warm gray, dusty blue, pure charcoal)",
    ["current balanced palette (default)"],
    "city skyline",
    ["balanced windows (standard residential)"],
    ["dining table with a modern Thanksgiving-inspired table setting or an everyday dinner table setting, modest plated portions, and simple servingware (not a grand banquet)"],
    ["textured plaster walls"],
    ["smooth white ceiling"],
    ["recessed downlights"]
  );

  assert.doesNotMatch(prompt, /thanksgiving|family dinner|banquet|dinner prep|food/i);
});

test("dining room keeps food-focused focal points", () => {
  const prompt = buildPrompt(
    "dining room",
    "standard room (180-280 sq ft)",
    "modern",
    "Warm Neutral",
    60,
    "Designer Layered",
    "Architectural Surfaces",
    "Auto",
    true,
    0,
    12,
    "upscale",
    "balanced modern mix (white, warm gray, dusty blue, pure charcoal)",
    ["current balanced palette (default)"],
    "city skyline",
    ["balanced windows (standard residential)"],
    ["dining table with a modern Thanksgiving-inspired table setting or an everyday dinner table setting, modest plated portions, and simple servingware (not a grand banquet)"],
    ["textured plaster walls"],
    ["smooth white ceiling"],
    ["recessed downlights"]
  );

  assert.match(prompt, /thanksgiving-inspired table setting|everyday dinner table setting|modest plated portions/i);
});

test("prompt avoids provocative styling language", () => {
  const prompt = buildTestPrompt();

  assert.doesNotMatch(prompt, /provocative|push boundaries|challenge the eye/i);
});

test("prompt includes explicit interior-only safety cues", () => {
  const prompt = buildTestPrompt();

  assert.match(prompt, /no people, faces, hands, bodies, mannequins, or human silhouettes/i);
  assert.match(prompt, /interior architecture and decor only; no person-centric or character-focused imagery/i);
  assert.doesNotMatch(prompt, /nudity|lingerie|sexual content|suggestive poses/i);
});
