import assert from "node:assert/strict";
import test from "node:test";
import { ceilingLights, ceilings, walls } from "../lib/combinations";
import { BUILT_IN_LOOKS, DEFAULT_LOOK_ID, getLookDetails, getLookValues, sanitizeLookDetails } from "../lib/looks";
import { parseSavedLooks, writeList, type SavedLook } from "../lib/savedItems";
import { DEFAULT_SETUP } from "../lib/setup";

test("every built-in Look sets wall, ceiling and ceiling-light options that exist", () => {
  for (const look of BUILT_IN_LOOKS) {
    assert.ok(look.details, `${look.name} has details`);
    assert.ok(look.details.walls.length >= 1 && look.details.walls.every((w) => walls.includes(w)), `${look.name} walls`);
    assert.ok(look.details.ceilings.length >= 1 && look.details.ceilings.every((c) => ceilings.includes(c)), `${look.name} ceilings`);
    assert.ok(
      look.details.ceilingLights.length >= 1 && look.details.ceilingLights.every((l) => ceilingLights.includes(l)),
      `${look.name} lights`
    );
  }
});

test("the default Look's details equal today's defaults, so switching back restores them", () => {
  const base = BUILT_IN_LOOKS.find((look) => look.id === DEFAULT_LOOK_ID);
  assert.deepEqual(base?.details, getLookDetails(DEFAULT_SETUP));
});

test("Looks differ in their details, not only in color", () => {
  const keys = new Set(BUILT_IN_LOOKS.map((look) => JSON.stringify(look.details)));
  assert.ok(keys.size >= 12, `only ${keys.size} distinct detail sets`);
});

test("sanitizeLookDetails keeps valid options and rejects empty or unknown sets", () => {
  const good = { walls: ["stone walls"], ceilings: ["coffered ceiling"], ceilingLights: ["statement chandelier"] };

  assert.deepEqual(sanitizeLookDetails(good), good);
  assert.deepEqual(
    sanitizeLookDetails({ ...good, walls: ["stone walls", "lava walls"] })?.walls,
    ["stone walls"]
  );
  assert.equal(sanitizeLookDetails({ ...good, walls: ["lava walls"] }), null);
  assert.equal(sanitizeLookDetails({ ...good, ceilings: [] }), null);
  assert.equal(sanitizeLookDetails(null), null);
  assert.equal(sanitizeLookDetails("x"), null);
});

test("saved Looks keep their details; older saved Looks without details still load", () => {
  const withDetails: SavedLook = {
    id: "a",
    name: "With details",
    values: getLookValues(DEFAULT_SETUP),
    details: { walls: ["wood panel walls"], ceilings: ["wood beam ceiling"], ceilingLights: ["concealed cove lighting"] },
  };
  const legacy: SavedLook = { id: "b", name: "Old", values: getLookValues(DEFAULT_SETUP) };
  const storage = new Map<string, string>();
  const fake = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v) };

  assert.ok(writeList(fake, "k", [withDetails, legacy]).ok);
  const loaded = parseSavedLooks(fake.getItem("k"));
  assert.deepEqual(loaded, [withDetails, legacy]);
  assert.ok(!("details" in loaded[1]));

  const broken = JSON.stringify([{ ...withDetails, details: { walls: ["nope"] } }]);
  assert.deepEqual(parseSavedLooks(broken), [{ id: "a", name: "With details", values: withDetails.values }]);
});
