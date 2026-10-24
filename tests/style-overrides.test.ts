import assert from "node:assert/strict";
import test from "node:test";
import { styles } from "../lib/combinations";
import type { HomeQualityKey } from "../lib/promptBuilder/homeQuality";
import { STYLE_OVERRIDES } from "../lib/promptBuilder/styleOverrides";
import { buildPromptPreview } from "../lib/promptPreview";
import { DEFAULT_SETUP } from "../lib/setup";

const TIERS: HomeQualityKey[] = [
  "builder's grade layout",
  "everyday",
  "upscale",
  "luxury",
  "ultra luxury",
];

function prompt(patch: Partial<typeof DEFAULT_SETUP>): string {
  return buildPromptPreview({ ...DEFAULT_SETUP, ...patch });
}

const liminal = (patch: Partial<typeof DEFAULT_SETUP> = {}) => prompt({ designStyle: "liminal spaces", ...patch });

test("liminal spaces is the only style with an override, and it exists in the style list", () => {
  assert.deepEqual(Object.keys(STYLE_OVERRIDES), ["liminal spaces"]);
  assert.ok(styles.includes("liminal spaces"));
});

test("liminal prompts use the override lines for every Home quality tier", () => {
  for (const homeQuality of TIERS) {
    const text = liminal({ homeQuality });

    assert.match(text, /Flat, even artificial lighting/, homeQuality);
    assert.match(text, /Centered one-point perspective/, homeQuality);
    assert.match(text, /Empty or nearly empty/, homeQuality);
    assert.match(text, /No people or pets/, homeQuality);
  }
});

test("liminal prompts drop the bright, styled, editorial wording", () => {
  const banned = [
    /Bright natural daylight/i,
    /sunlit/i,
    /editorial/i,
    /high-key/i,
    /Prevent flat monotony/i,
    /layered rugs/i,
    /Perfect spatial balance/i,
    /concealed cove lighting/i,
    /tack-sharp/i,
    /designer-level composition/i,
  ];

  for (const homeQuality of TIERS) {
    const text = liminal({ homeQuality });

    for (const pattern of banned) {
      assert.ok(!pattern.test(text), `${homeQuality}: found ${pattern}`);
    }
  }
});

test("a ceiling lighting choice still appears in a liminal prompt", () => {
  const text = liminal({ ceilingLights: ["pendant lights"] } as Partial<typeof DEFAULT_SETUP>);

  assert.match(text, /Ceiling lighting direction: pendant lights/);
});

test("Moody Luxury color mood does not bring its lighting into a liminal prompt", () => {
  const text = liminal({ colorMood: "Moody Luxury" } as Partial<typeof DEFAULT_SETUP>);

  assert.match(text, /Flat, even artificial lighting/);
  assert.ok(!/glowing, intimate atmosphere/.test(text));
});

test("every other style keeps the bright shared lighting and staging", () => {
  for (const style of styles.filter((item) => item !== "liminal spaces")) {
    const text = prompt({ designStyle: style });

    assert.ok(text.includes(`Ultra realistic ${style} `), style);

    assert.match(text, /Bright natural daylight/, style);
    assert.match(text, /Prevent flat monotony/, style);
    assert.ok(!/Flat, even artificial lighting/.test(text), style);
  }
});
