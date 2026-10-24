import assert from "node:assert/strict";
import test from "node:test";
import { colorMoods, heroColors, type ColorMood } from "../lib/combinations";
import { BUILT_IN_LOOKS, LOOK_GROUPS } from "../lib/looks";
import { buildPromptPreview } from "../lib/promptPreview";
import { getColorPreviewData } from "../lib/promptBuilder/colorPalette";
import { DEFAULT_SETUP, sanitizeSetup } from "../lib/setup";

type Patch = Partial<typeof DEFAULT_SETUP>;
const prompt = (patch: Patch) => buildPromptPreview({ ...DEFAULT_SETUP, ...patch });

const NEW_MOODS = ["Monochrome Tonal", "Soft Pastel", "Vivid Eclectic", "Cool Modern", "Dark Earthy"] as const;
const NEW_FAMILIES = ["Monochrome", "Pastel Mixed", "Vivid Mixed", "Slate & Steel", "Dark Earthy Mixed"] as const;
const EXPECTED_FAMILY: Record<(typeof NEW_MOODS)[number], string> = {
  "Monochrome Tonal": "Monochrome",
  "Soft Pastel": "Pastel Mixed",
  "Vivid Eclectic": "Vivid Mixed",
  "Cool Modern": "Slate & Steel",
  "Dark Earthy": "Dark Earthy Mixed",
};

test("there are ten color moods and the original five keep their order", () => {
  assert.equal(colorMoods.length, 10);
  assert.deepEqual(colorMoods.slice(0, 5), ["Warm Neutral", "Organic Earthy", "Light & Airy", "Moody Luxury", "Coastal Neutral"]);
  for (const mood of NEW_MOODS) assert.ok(colorMoods.includes(mood), mood);
  for (const family of NEW_FAMILIES) assert.ok((heroColors as readonly string[]).includes(family), family);
});

test("each new mood defaults to its own palette family when palette family is Auto", () => {
  for (const mood of NEW_MOODS) {
    const preview = getColorPreviewData({
      colorMood: mood, colorStrategy: "Designer Layered", colorCoverage: "Softly Distributed",
      heroColor: "Auto", colorIntensity: 25, autoPaletteVariation: true, imageIndex: 0, maxImages: 4,
    });
    assert.equal(preview.paletteFamily, EXPECTED_FAMILY[mood], mood);
  }
});

test("each new family rotates through four palettes with explicit accents", () => {
  for (const mood of NEW_MOODS) {
    const names = new Set<string>();
    const accents = new Set<string>();

    for (let index = 0; index < 4; index += 1) {
      const preview = getColorPreviewData({
        colorMood: mood, colorStrategy: "Designer Layered", colorCoverage: "Softly Distributed",
        heroColor: "Auto", colorIntensity: 25, autoPaletteVariation: true, imageIndex: index, maxImages: 4,
      });
      names.add(preview.selectedPalette);
      accents.add(preview.complementaryAccent);
      assert.ok(preview.primary && preview.secondary && preview.woodTone && preview.metalFinish, mood);
    }

    assert.equal(names.size, 4, `${mood} palettes`);
    assert.ok(accents.size >= 3, `${mood} accents`);
  }
});

test("the ten moods produce ten different prompts and each states its own direction", () => {
  const texts = new Set<string>();

  for (const mood of colorMoods) {
    const text = prompt({ colorMood: mood as ColorMood });
    assert.ok(text.includes(`Color mood direction: ${mood};`), mood);
    texts.add(text);
  }

  assert.equal(texts.size, 10);
  assert.match(prompt({ colorMood: "Soft Pastel" }), /pastel/i);
  assert.match(prompt({ colorMood: "Monochrome Tonal" }), /single hue family/i);
  assert.match(prompt({ colorMood: "Vivid Eclectic" }), /saturated/i);
  assert.match(prompt({ colorMood: "Cool Modern" }), /slate/i);
});

test("Dark Earthy uses the low warm lighting; the pastel and cool moods keep bright daylight", () => {
  const moody = prompt({ colorMood: "Moody Luxury" });
  const dark = prompt({ colorMood: "Dark Earthy" });
  const bright = prompt({ colorMood: "Soft Pastel" });
  const lightingLine = /Soft overcast or late-afternoon daylight/;

  assert.match(moody, lightingLine);
  assert.match(dark, lightingLine);
  assert.ok(!lightingLine.test(bright));
  assert.match(bright, /Bright natural daylight/);
  assert.match(prompt({ colorMood: "Cool Modern" }), /Bright natural daylight/);
});

test("Monochrome palette family asks for one hue family, not a multi-color room", () => {
  const text = prompt({ heroColor: "Monochrome" });
  assert.match(text, /one hue family/i);
  assert.ok(!/without forcing a single-color room/.test(text));
});

test("built-in Looks are grouped, each exactly once, and the new Looks use the new moods", () => {
  const grouped = LOOK_GROUPS.flatMap((group) => group.ids);

  assert.equal(new Set(grouped).size, grouped.length, "no Look listed twice");
  assert.deepEqual([...grouped].sort(), BUILT_IN_LOOKS.map((look) => look.id).sort());
  assert.equal(BUILT_IN_LOOKS.length, 24);

  const usedMoods = new Set(BUILT_IN_LOOKS.map((look) => look.values.colorMood));
  for (const mood of NEW_MOODS) assert.ok(usedMoods.has(mood), `${mood} has a Look`);
});

test("saved setups with a new mood or family survive sanitizing; unknown ones fall back", () => {
  const kept = sanitizeSetup({ colorMood: "Dark Earthy", heroColor: "Slate & Steel" });
  assert.equal(kept.colorMood, "Dark Earthy");
  assert.equal(kept.heroColor, "Slate & Steel");

  const fallback = sanitizeSetup({ colorMood: "Retired Mood" });
  assert.equal(fallback.colorMood, DEFAULT_SETUP.colorMood);
});
