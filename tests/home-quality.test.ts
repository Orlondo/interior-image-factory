import assert from "node:assert/strict";
import test from "node:test";
import { HOME_QUALITY_PROFILES, type HomeQualityKey } from "../lib/promptBuilder/homeQuality";
import { buildPromptPreview } from "../lib/promptPreview";
import { DEFAULT_SETUP } from "../lib/setup";

const TIERS: HomeQualityKey[] = [
  "builder's grade layout",
  "everyday",
  "upscale",
  "luxury",
  "ultra luxury",
];

function prompt(tier: HomeQualityKey, patch: Partial<typeof DEFAULT_SETUP> = {}): string {
  return buildPromptPreview({ ...DEFAULT_SETUP, homeQuality: tier, ...patch });
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Share of the prompt's words that sit on lines that differ between two tiers. */
function changedShare(a: string, b: string): number {
  const left = a.split("\n");
  const right = b.split("\n");

  assert.equal(left.length, right.length, "tiers must keep the same prompt structure");

  const changed = left.reduce((sum, line, index) => (line === right[index] ? sum : sum + words(line)), 0);

  return changed / words(a);
}

test("every tier produces a different prompt", () => {
  const prompts = TIERS.map((tier) => prompt(tier));

  assert.equal(new Set(prompts).size, TIERS.length);
});

test("the extremes differ by at least 20% of the words and neighbors by at least 8%", () => {
  const prompts = TIERS.map((tier) => prompt(tier));

  assert.ok(
    changedShare(prompts[0], prompts[4]) >= 0.2,
    `builder's grade vs ultra luxury changed ${(changedShare(prompts[0], prompts[4]) * 100).toFixed(1)}%`
  );

  for (let i = 0; i < prompts.length - 1; i += 1) {
    const share = changedShare(prompts[i], prompts[i + 1]);

    assert.ok(
      share >= 0.08,
      `${TIERS[i]} vs ${TIERS[i + 1]} changed only ${(share * 100).toFixed(1)}%`
    );
  }
});

test("builder's grade and everyday prompts carry no high-end wording", () => {
  const banned = [
    /bespoke/i,
    /designer (furniture|fixtures)/i,
    /collectible/i,
    /couture/i,
    /museum/i,
    /premium (real-estate )?editorial/i,
    /avant-garde/i,
    /sculptural/i,
    /luxury residential/i,
    /elegant luminous/i,
    /seamless built-ins/i,
  ];

  for (const tier of ["builder's grade layout", "everyday"] as HomeQualityKey[]) {
    // Lines that name what to avoid, and the color system's own strategy names, are not high-end cues.
    const text = prompt(tier)
      .split("\n")
      .filter((line) => !/^- (Avoid|Atmosphere direction)/.test(line) && !/^- Enhanced color system directive/.test(line))
      .join("\n");

    for (const pattern of banned) {
      assert.doesNotMatch(text, pattern, `${tier} prompt contains ${pattern}`);
    }
  }
});

test("luxury and ultra luxury prompts carry no budget wording", () => {
  const banned = [/builder-grade/i, /stock cabinetry/i, /hollow-core/i, /tract-home/i, /mass-market/i, /listing photography/i];

  for (const tier of ["luxury", "ultra luxury"] as HomeQualityKey[]) {
    for (const pattern of banned) {
      assert.doesNotMatch(prompt(tier), pattern, `${tier} prompt contains ${pattern}`);
    }
  }
});

test("lower tiers allow a lived-in room and higher tiers keep the room uncluttered", () => {
  assert.match(prompt("builder's grade layout"), /lived-in/);
  assert.doesNotMatch(prompt("builder's grade layout"), /no clutter,|Perfect spatial balance/);
  assert.match(prompt("everyday"), /lived-in/);
  assert.match(prompt("upscale"), /Perfect spatial balance, clean lines, no clutter/);
  assert.match(prompt("luxury"), /uncluttered/);
  assert.match(prompt("ultra luxury"), /nothing out of place/);
});

test("the avant-garde lines appear only when focal points are selected", () => {
  for (const tier of TIERS) {
    const without = prompt(tier);

    assert.doesNotMatch(without, /avant-garde|Sculptural and experimental|conceptual sculptures/i);
  }

  const withFocal = prompt("upscale", { focalPoints: ["sculptural fireplace"] });

  assert.match(withFocal, /avant-garde expression/);
  assert.match(withFocal, /Sculptural and experimental designer furniture/);
});

test("selected ceiling and lighting options appear verbatim on every tier", () => {
  for (const tier of TIERS) {
    const text = prompt(tier, { ceilings: ["coffered ceiling"], ceilingLights: ["statement chandelier"] });

    assert.match(text, /Ceiling treatment direction: coffered ceiling, /);
    assert.match(text, /Ceiling lighting direction: statement chandelier, /);
  }
});

test("with no ceiling light selected, plainer tiers fall back to plainer fixtures", () => {
  const builder = prompt("builder's grade layout", { ceilingLights: [] });
  const luxury = prompt("luxury", { ceilingLights: [] });

  assert.match(builder, /Ceiling lighting direction: plain flush-mount fixtures/);
  assert.match(luxury, /Ceiling lighting direction: concealed cove lighting/);
});

test("upscale keeps today's staging, photography and lighting lines", () => {
  const text = prompt("upscale");

  assert.match(text, /- Perfect spatial balance, clean lines, no clutter\n/);
  assert.match(text, /premium real-estate editorial photography with bright editorial lighting balance/);
  assert.match(text, /Warm indirect cove lighting and layered practical fixtures to create an elegant luminous glow/);
  assert.match(text, /no distortion, no clutter\n/);
});

test("Home Quality ranks just after Color Coverage in the priority line", () => {
  assert.match(prompt("upscale"), /Color Coverage \(where color appears\) > Home Quality > Palette Family/);
});

test("every profile fills every field", () => {
  for (const tier of TIERS) {
    for (const [field, value] of Object.entries(HOME_QUALITY_PROFILES[tier])) {
      assert.ok(typeof value === "string", `${tier}.${field} is not a string`);
      assert.ok(field === "lightingBalanceStyle" || value.trim().length > 0, `${tier}.${field} is empty`);
    }
  }
});
