import assert from "node:assert/strict";
import test from "node:test";

import { styles } from "../lib/combinations";
import { buildPromptPreview } from "../lib/promptPreview";
import { assignStyles, type PromptScenario } from "../lib/scenarioPlan";
import {
  DEFAULT_SETUP,
  buildGeneratePayload,
  describeStyles,
  effectiveStyles,
  sanitizeSetup,
} from "../lib/setup";

function scenario(n: number, set?: PromptScenario["set"]): PromptScenario {
  return {
    room: "living room", view: "v", colorProfile: "c", focalPoints: [], windowStyle: "w",
    wall: "wall", ceiling: "ceil", ceilingLight: "light", wallColorPalette: "p", ...(set ? { set } : {}),
  } as PromptScenario & { n?: number };
}

const count = (items: PromptScenario[]) => {
  const tally: Record<string, number> = {};
  for (const item of items) tally[item.style ?? "none"] = (tally[item.style ?? "none"] ?? 0) + 1;
  return tally;
};

test("a saved setup with one designStyle loads as a list of one", () => {
  assert.deepEqual(sanitizeSetup({ designStyle: "japandi" }).designStyles, ["japandi"]);
  assert.deepEqual(sanitizeSetup({ designStyle: "not a style" }).designStyles, [DEFAULT_SETUP.designStyles[0]]);
  assert.deepEqual(sanitizeSetup({}).designStyles, [DEFAULT_SETUP.designStyles[0]]);
});

test("several saved styles are kept in order, and unknown ones are dropped", () => {
  assert.deepEqual(
    sanitizeSetup({ designStyles: ["industrial", "nope", "wabi-sabi"] }).designStyles,
    ["industrial", "wabi-sabi"]
  );
});

test("an empty style list falls back to the default style", () => {
  const setup = { ...DEFAULT_SETUP, designStyles: [] };

  assert.deepEqual(effectiveStyles(setup), [styles[0]]);
  assert.equal(buildGeneratePayload(setup).designStyle, styles[0]);
});

test("one style sends exactly the old payload; several add designStyles", () => {
  const one = buildGeneratePayload({ ...DEFAULT_SETUP, designStyles: ["japandi"] });

  assert.equal(one.designStyle, "japandi");
  assert.ok(!("designStyles" in one));

  const many = buildGeneratePayload({ ...DEFAULT_SETUP, designStyles: ["japandi", "coastal"] }) as Record<string, unknown>;

  assert.equal(many.designStyle, "japandi");
  assert.deepEqual(many.designStyles, ["japandi", "coastal"]);
});

test("styles are spread evenly, and the first styles get the extra images", () => {
  const twelve = assignStyles(Array.from({ length: 12 }, (_, i) => scenario(i)), ["a", "b", "c"]);

  assert.deepEqual(count(twelve), { a: 4, b: 4, c: 4 });

  const ten = assignStyles(Array.from({ length: 10 }, (_, i) => scenario(i)), ["a", "b", "c"]);

  assert.deepEqual(count(ten), { a: 4, b: 3, c: 3 });
});

test("one style leaves scenarios untouched", () => {
  const items = Array.from({ length: 3 }, (_, i) => scenario(i));

  assert.deepEqual(assignStyles(items, ["a"]), items);
  assert.deepEqual(assignStyles(items, []), items);
});

test("every image of a room set shares a style, and sets are spread evenly", () => {
  const items = [0, 1, 2, 3].flatMap((setNumber) =>
    [0, 1, 2].map((angle) => scenario(0, { number: setNumber + 1, angle, size: 3 }))
  );
  const assigned = assignStyles(items, ["a", "b"]);

  for (let set = 0; set < 4; set += 1) {
    const group = assigned.slice(set * 3, set * 3 + 3).map((item) => item.style);
    assert.equal(new Set(group).size, 1);
  }
  assert.deepEqual(count(assigned), { a: 6, b: 6 });
});

test("a same-house run shares the first style", () => {
  const items = [1, 2, 3].map((n) => scenario(0, { number: n, angle: 0, size: 1 }));

  assert.deepEqual(assignStyles(items, ["a", "b", "c"], true).map((i) => i.style), ["a", "a", "a"]);
});

test("the preview shows the first picked style, and summaries stay short", () => {
  const text = buildPromptPreview({ ...DEFAULT_SETUP, designStyles: ["japandi", "coastal"] });

  assert.match(text, /Ultra realistic japandi/);
  assert.equal(describeStyles(["a"]), "a");
  assert.equal(describeStyles(["a", "b"]), "a and b");
  assert.equal(describeStyles(["a", "b", "c"]), "3 styles");
});
