import assert from "node:assert/strict";
import test from "node:test";

import { buildPrompt } from "../lib/promptBuilder";
import { singleHeroColors, wallColorPalettes } from "../lib/combinations";
import {
  AUTO_WALL_COLOR_PALETTE,
  getDefaultWallColorPalette,
  getWallColorRandomPool,
} from "../lib/wallColorPalette";
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

test("intensity 0 includes very muted color language", () => {
  const prompt = buildTestPrompt({ colorIntensity: 0 });
  assert.match(prompt, /very muted/i);
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

test("every single hero color selects its own palette family across a batch", () => {
  for (const color of singleHeroColors) {
    const names = Array.from({ length: 6 }, (_, imageIndex) => {
      const palette = selectPalette({
        colorMood: "Warm Neutral",
        colorStrategy: "Designer Layered",
        heroColor: color,
        imageIndex,
        autoPaletteVariation: true,
      });

      assert.equal(palette.family, color);
      return palette.name;
    });

    assert.equal(new Set(names).size, 3, `${color} should rotate through 3 palettes`);
  }
});

test("single hero color directive makes the color the lead", () => {
  const directive = buildColorPaletteDirective({
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    colorCoverage: "Architectural Surfaces",
    heroColor: "Teal",
    colorIntensity: 60,
    autoPaletteVariation: false,
    imageIndex: 0,
    maxImages: 12,
    style: "modern",
  });

  assert.match(directive, /Hero color Teal/);
  assert.match(directive, /clear lead color/i);
});

test("mixed palette families keep the multi-color directive", () => {
  const directive = buildColorPaletteDirective({
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    colorCoverage: "Architectural Surfaces",
    heroColor: "Designer Mixed",
    colorIntensity: 60,
    autoPaletteVariation: false,
    imageIndex: 0,
    maxImages: 12,
    style: "modern",
  });

  assert.match(directive, /without forcing a single-color room/i);
});

test("randomized wall colors draw from every palette for color-forward requests", () => {
  const pool = getWallColorRandomPool({
    colorProfileSelection: ["current balanced palette (default)"],
    colorStrategy: "Designer Layered",
    colorCoverage: "Architectural Surfaces",
  });

  assert.equal(pool.length, wallColorPalettes.length);
});

test("randomized wall colors stay neutral-leaning for Neutral Base or Decor Only", () => {
  for (const request of [
    { colorStrategy: "Neutral Base", colorCoverage: "Architectural Surfaces" },
    { colorStrategy: "Designer Layered", colorCoverage: "Decor Only" },
  ] as const) {
    const pool = getWallColorRandomPool({
      colorProfileSelection: ["current balanced palette (default)"],
      ...request,
    });

    assert.equal(pool.length, 4);
    assert.ok(!pool.some((palette) => palette.includes("wine accent")));
  }
});

test("earthy-only profile keeps the full wall palette pool", () => {
  const pool = getWallColorRandomPool({
    colorProfileSelection: ["earthy saturated palette"],
    colorStrategy: "Neutral Base",
    colorCoverage: "Decor Only",
  });

  assert.equal(pool.length, wallColorPalettes.length);
});

test("default wall palette follows the selected palette unless a profile chooses one", () => {
  assert.equal(
    getDefaultWallColorPalette(["current balanced palette (default)"]),
    AUTO_WALL_COLOR_PALETTE
  );
  assert.match(getDefaultWallColorPalette(["earthy saturated palette"]), /earthy warm mix/);
});

function buildWallTestPrompt(options: {
  wallColorPalette: string;
  colorMood?: ColorMood;
  colorStrategy?: ColorStrategy;
  colorCoverage?: ColorCoverage;
}): string {
  return buildPrompt(
    "living room",
    "standard room (180-280 sq ft)",
    "modern",
    options.colorMood ?? "Warm Neutral",
    60,
    options.colorStrategy ?? "Designer Layered",
    options.colorCoverage ?? "Architectural Surfaces",
    "Teal",
    true,
    0,
    12,
    "upscale",
    options.wallColorPalette,
    ["current balanced palette (default)"],
    "city skyline",
    ["balanced windows (standard residential)"],
    ["oversized abstract art or mural"],
    ["textured plaster walls"],
    ["smooth white ceiling"],
    ["recessed downlights"]
  );
}

test("auto wall palette follows the selected palette instead of white, gray, and navy", () => {
  const prompt = buildWallTestPrompt({ wallColorPalette: AUTO_WALL_COLOR_PALETTE });

  assert.match(prompt, /Wall color palette direction: follow the selected palette/);
  assert.doesNotMatch(prompt, /cool contemporary mix/);
});

test("auto wall palette stays neutral under Neutral Base", () => {
  const prompt = buildWallTestPrompt({
    wallColorPalette: AUTO_WALL_COLOR_PALETTE,
    colorStrategy: "Neutral Base",
  });

  assert.match(prompt, /Wall color palette direction: warm-neutral walls/);
});

test("an explicitly chosen wall palette is still honored", () => {
  const prompt = buildWallTestPrompt({ wallColorPalette: wallColorPalettes[3] ?? "" });

  assert.ok(prompt.includes(`Wall color palette direction: ${wallColorPalettes[3]}`));
});

test("moody luxury uses moody lighting while other moods keep bright lighting", () => {
  const moody = buildWallTestPrompt({
    wallColorPalette: AUTO_WALL_COLOR_PALETTE,
    colorMood: "Moody Luxury",
  });
  const warm = buildWallTestPrompt({ wallColorPalette: AUTO_WALL_COLOR_PALETTE });

  assert.doesNotMatch(moody, /high-key exposure/);
  assert.match(moody, /backlit shelving/);
  assert.match(warm, /high-key exposure/);
});

test("dark wall rule follows the palette unless neutral guardrails apply", () => {
  const colorForward = buildWallTestPrompt({ wallColorPalette: AUTO_WALL_COLOR_PALETTE });
  const neutral = buildWallTestPrompt({
    wallColorPalette: AUTO_WALL_COLOR_PALETTE,
    colorStrategy: "Neutral Base",
  });

  assert.doesNotMatch(colorForward, /warm charcoal or soft near-black/);
  assert.match(colorForward, /true to the selected palette/);
  assert.match(neutral, /warm charcoal or soft near-black/);
});

test("low intensity is muted and overrides coverage, with 5 distinct from 20", () => {
  const at5 = buildTestPrompt({ colorIntensity: 5 });
  const at20 = buildTestPrompt({ colorIntensity: 20 });
  const at50 = buildTestPrompt({ colorIntensity: 50 });

  assert.match(at5, /very muted/i);
  assert.match(at5, /Intensity overrides coverage/i);
  assert.match(at20, /pale, desaturated, tonal tint/i);
  assert.notEqual(at5, at20.replace("20/100", "5/100"));
  assert.doesNotMatch(at5, /allow a colored chair, sofa, bench, or rug/i);
  assert.doesNotMatch(at5, /still allow a colored wall or built-in/i);
  assert.doesNotMatch(at50, /Intensity overrides coverage/i);
  assert.match(at50, /Color Intensity \(strength of color\) > Color Coverage/);
});

test("intensity drives the whole prompt, not just the intensity lines", () => {
  const lines = (n: number) => buildTestPrompt({ colorIntensity: n }).split("\n");
  const low = lines(5);
  const high = new Set(lines(80));
  const changed = low.filter((line) => !high.has(line));

  assert.ok(changed.length >= 10, `expected at least 10 differing lines, got ${changed.length}`);

  const mutedPrompt = buildTestPrompt({ colorIntensity: 5 });
  assert.doesNotMatch(mutedPrompt, /color-led/i);
  assert.doesNotMatch(mutedPrompt, /do not reassert neutral defaults/i);
  assert.doesNotMatch(mutedPrompt, /visible color accents/i);
  assert.doesNotMatch(mutedPrompt, /muted gray-beige/i);
  assert.match(mutedPrompt, /Avoid saturated paint, vivid upholstery, and bold color blocking/i);

  const boldPrompt = buildTestPrompt({ colorIntensity: 80 });
  assert.match(boldPrompt, /visible color accents/i);
  assert.match(boldPrompt, /color-led/i);
  assert.doesNotMatch(boldPrompt, /Avoid saturated paint, vivid upholstery/i);
});
