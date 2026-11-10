import assert from "node:assert/strict";
import test from "node:test";

import { focalPoints } from "../lib/combinations";
import { buildFocalPointSubGroups } from "../lib/focalPointGroups";

test("every focal point appears exactly once, with its full text as the value", () => {
  const values = buildFocalPointSubGroups().flatMap((group) => group.options.map((option) => option.value));

  assert.equal(values.length, focalPoints.length);
  assert.deepEqual([...values].sort(), [...focalPoints].sort());
});

test("no focal point falls into Other, and every chip has a short label", () => {
  const groups = buildFocalPointSubGroups();

  assert.ok(!groups.some((group) => group.title === "Other"));

  for (const group of groups) {
    for (const option of group.options) {
      assert.ok(option.label.length <= 32, option.label);
      assert.notEqual(option.label, option.value);
    }
  }
});

test("a focal point added later is shown under Other instead of disappearing", () => {
  const groups = buildFocalPointSubGroups([...focalPoints, "brand new thing"]);

  assert.deepEqual(groups.at(-1), { title: "Other", options: [{ value: "brand new thing", label: "brand new thing" }] });
});
