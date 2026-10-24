import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { colorCoverages, colorStrategies, rooms, styles } from "../lib/combinations";
import { conditions, CONDITION_PROFILES, type ConditionKey } from "../lib/promptBuilder/condition";
import { buildPromptPreview } from "../lib/promptPreview";
import { buildGeneratePayload, DEFAULT_SETUP, sanitizeSetup } from "../lib/setup";

type Patch = Partial<typeof DEFAULT_SETUP>;

const prompt = (patch: Patch) => buildPromptPreview({ ...DEFAULT_SETUP, ...patch });
const hash = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

const TIERS = ["builder's grade layout", "everyday", "upscale", "luxury", "ultra luxury"] as const;
const SNAPSHOT: Record<string, string> = JSON.parse(
  fs.readFileSync(new URL("./fixtures/prompt-hashes.json", import.meta.url), "utf8")
);

test("pristine prompts are identical to the saved snapshot taken before Condition existed", () => {
  let checked = 0;

  for (const style of styles) {
    for (const tier of TIERS) {
      for (const mood of ["Warm Neutral", "Moody Luxury"] as const) {
        const key = `style=${style}|tier=${tier}|mood=${mood}`;

        assert.equal(hash(prompt({ designStyle: style, homeQuality: tier, colorMood: mood })), SNAPSHOT[key], key);
        checked += 1;
      }
    }
  }

  for (const strategy of colorStrategies) {
    for (const coverage of colorCoverages) {
      for (const intensity of [10, 25, 55, 90]) {
        const key = `strategy=${strategy}|coverage=${coverage}|intensity=${intensity}`;

        assert.equal(
          hash(prompt({ colorStrategy: strategy, colorCoverage: coverage, colorIntensity: intensity })),
          SNAPSHOT[key],
          key
        );
        checked += 1;
      }
    }
  }

  assert.equal(checked, Object.keys(SNAPSHOT).length);
});

test("every condition step produces a different prompt", () => {
  const prompts = conditions.map((condition) => prompt({ condition }));

  assert.equal(new Set(prompts).size, conditions.length);
});

function changedShare(a: string, b: string): number {
  const left = a.split("\n");
  const right = b.split("\n");
  const set = new Set(right);
  const changed = left.reduce((sum, line) => (set.has(line) ? sum : sum + words(line)), 0);

  return changed / words(a);
}

test("neighboring condition steps differ by at least 6% of the words, and the extremes by at least 20%", () => {
  const prompts = conditions.map((condition) => prompt({ condition }));

  for (let i = 0; i < prompts.length - 1; i += 1) {
    const share = Math.max(changedShare(prompts[i], prompts[i + 1]), changedShare(prompts[i + 1], prompts[i]));

    assert.ok(share >= 0.06, `${conditions[i]} vs ${conditions[i + 1]} changed only ${(share * 100).toFixed(1)}%`);
  }

  assert.ok(changedShare(prompts[5], prompts[0]) >= 0.2, "pristine vs derelict");
});

const NEGLECT_UP: ConditionKey[] = ["neglected", "abandoned", "derelict"];
const MILD: ConditionKey[] = ["dated", "worn"];

test("every non-pristine step drops the tidy, staged wording", () => {
  const banned = [/no clutter/i, /tidy/i, /Perfect spatial balance/i, /layered rugs(?!\.)/i];

  for (const condition of conditions.filter((item) => item !== "pristine")) {
    for (const tier of TIERS) {
      const lines = prompt({ condition, homeQuality: tier }).split("\n");

      for (const pattern of banned) {
        const hits = lines.filter((line) => pattern.test(line) && !/\bno layered rugs\b|no clutter, no styled/.test(line));

        assert.equal(hits.length, 0, `${condition}/${tier}: ${pattern} in "${hits[0]}"`);
      }
    }
  }
});

test("neglected and below drop the bright, polished, color-forward wording", () => {
  const banned = [
    /Bright natural daylight/i,
    /Prevent flat monotony/i,
    /Accent colors should be present and visible/i,
    /premium real-estate editorial/i,
    /Calm, refined, high-end/i,
    /design magazine framing/i,
    /Avoid cheap\/basic finishes/i,
  ];

  for (const condition of NEGLECT_UP) {
    const text = prompt({ condition });

    for (const pattern of banned) {
      assert.ok(!pattern.test(text), `${condition}: found ${pattern}`);
    }
  }
});

test("dated and worn keep the shared lighting and color rules", () => {
  for (const condition of MILD) {
    const text = prompt({ condition });

    assert.match(text, /Bright natural daylight/, condition);
    assert.ok(!/Decay and color/.test(text), condition);
  }
});

test("the priority line changes only at neglected and above", () => {
  const priority = (text: string) => text.split("\n").find((line) => line.includes("Color rule priority"));
  const base = priority(prompt({ condition: "pristine" }));

  for (const condition of MILD) {
    assert.equal(priority(prompt({ condition })), base, condition);
  }

  for (const condition of NEGLECT_UP) {
    assert.match(priority(prompt({ condition })) ?? "", /Room Type > Condition > Color Strategy/, condition);
  }
});

test("the palette's color names stay in the prompt at every step", () => {
  const baseline = prompt({ condition: "pristine" });
  const palette = baseline.match(/Selected palette ([^.]+)\./)?.[1];

  assert.ok(palette, "baseline prompt names a palette");

  for (const condition of conditions) {
    const text = prompt({ condition });

    assert.ok(text.includes(`Selected palette ${palette}`), `${condition}: palette name missing`);
  }

  for (const condition of NEGLECT_UP) {
    assert.match(prompt({ condition }), /never which colors it uses/, condition);
    assert.match(prompt({ condition }), /never the hue|keep every palette hue identifiable/, condition);
  }
});

test("Condition plus Liminal keeps the Liminal lighting and adds the decay lines", () => {
  for (const condition of NEGLECT_UP) {
    const text = prompt({ condition, designStyle: "liminal spaces" });

    assert.match(text, /Flat, even artificial lighting/, condition);
    assert.match(text, /Condition direction \(critical\)/, condition);
    assert.ok(!/Dim, dusty light/.test(text), condition);
  }
});

test("Home quality still shapes materials under decay", () => {
  const plain = prompt({ condition: "abandoned", homeQuality: "builder's grade layout" });
  const grand = prompt({ condition: "abandoned", homeQuality: "ultra luxury" });

  assert.notEqual(plain, grand);
  assert.match(grand, /Material direction: .*(marble|stone)/i);
  assert.ok(!/Material direction: .*marble/i.test(plain));
});

test("Condition outranks Moody Luxury lighting from neglected up, not below", () => {
  assert.match(prompt({ condition: "abandoned", colorMood: "Moody Luxury" }), /Dim, dusty light/);
  assert.ok(!/Dim, dusty light/.test(prompt({ condition: "worn", colorMood: "Moody Luxury" })));
});

test("a ceiling lighting choice is still honored under decay", () => {
  const text = prompt({ condition: "derelict", ceilingLights: ["pendant lights"] });

  assert.match(text, /Ceiling lighting direction: pendant lights/);
});

test("condition is saved with a setup, defaults to pristine for older setups, and reaches the generate payload", () => {
  assert.equal(DEFAULT_SETUP.condition, "pristine");
  assert.equal(sanitizeSetup({ ...DEFAULT_SETUP, condition: "abandoned" }).condition, "abandoned");

  const { condition: _removed, ...older } = DEFAULT_SETUP;

  assert.equal(sanitizeSetup(older).condition, "pristine");
  assert.equal(sanitizeSetup({ ...DEFAULT_SETUP, condition: "ruined-ish" }).condition, "pristine");
  assert.equal(buildGeneratePayload({ ...DEFAULT_SETUP, condition: "worn" }).condition, "worn");
  assert.ok(!("condition" in buildGeneratePayload(DEFAULT_SETUP)), "pristine payload is unchanged");
});

test("the six transitional rooms exist, and the pristine prompt for each names the room", () => {
  for (const room of ["hallway", "stairwell", "lobby", "waiting room", "empty office", "indoor pool"] as const) {
    assert.ok(rooms.includes(room), room);
    assert.match(prompt({ rooms: [room] }), new RegExp(`Ultra realistic modern ${room} `), room);
  }
});

test("every condition has a profile, and pristine adds nothing", () => {
  for (const condition of conditions) {
    assert.ok(CONDITION_PROFILES[condition], condition);
  }

  assert.equal(CONDITION_PROFILES.pristine.direction, "");
});
