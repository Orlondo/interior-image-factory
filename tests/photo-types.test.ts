import assert from "node:assert/strict";
import test from "node:test";

import { buildPendingManifest } from "../lib/batchManifest";
import {
  createEmptyExteriorOptions,
  effectivePhotoTypes,
  exteriorOptionGroups,
  photoTypeCounts,
  resolveExteriorOptions,
} from "../lib/exteriorCombinations";
import { buildExteriorPrompt, buildExteriorScenarios } from "../lib/exteriorPromptBuilder";
import {
  DEFAULT_SETUP,
  buildGeneratePayload,
  exteriorImageCount,
  interiorImageCount,
  sanitizeSetup,
} from "../lib/setup";

const counter = () => {
  let n = 0;
  return () => ((n += 0.137) % 1);
};

test("photo types default to interior, ignore unknown values, and keep a fixed order", () => {
  assert.deepEqual(effectivePhotoTypes(undefined), ["interior"]);
  assert.deepEqual(effectivePhotoTypes([]), ["interior"]);
  assert.deepEqual(effectivePhotoTypes(["nope"]), ["interior"]);
  assert.deepEqual(effectivePhotoTypes(["exterior", "interior"]), ["interior", "exterior"]);
  assert.deepEqual(effectivePhotoTypes(["exterior"]), ["exterior"]);
});

test("images are split evenly across photo types, the first type taking the extra image", () => {
  assert.deepEqual(photoTypeCounts(12, ["interior"]), { interior: 12, exterior: 0 });
  assert.deepEqual(photoTypeCounts(12, ["exterior"]), { interior: 0, exterior: 12 });
  assert.deepEqual(photoTypeCounts(12, ["interior", "exterior"]), { interior: 6, exterior: 6 });
  assert.deepEqual(photoTypeCounts(5, ["interior", "exterior"]), { interior: 3, exterior: 2 });
  assert.equal(interiorImageCount({ maxImages: 8, photoTypes: ["interior", "exterior"] }), 4);
  assert.equal(exteriorImageCount({ maxImages: 8, photoTypes: ["interior", "exterior"] }), 4);
});

test("the default payload is unchanged, and exterior adds photoTypes and exterior only when on", () => {
  const base = buildGeneratePayload(DEFAULT_SETUP) as Record<string, unknown>;

  assert.ok(!("photoTypes" in base) && !("exterior" in base));

  const withExterior = buildGeneratePayload({
    ...DEFAULT_SETUP,
    photoTypes: ["interior", "exterior"],
  }) as Record<string, unknown>;

  assert.deepEqual(withExterior.photoTypes, ["interior", "exterior"]);
  assert.ok("exterior" in withExterior);
});

test("old saved setups load as interior-only with every exterior option", () => {
  const setup = sanitizeSetup({ designStyle: "japandi" });

  assert.deepEqual(setup.photoTypes, ["interior"]);
  assert.deepEqual(setup.exterior, createEmptyExteriorOptions());
});

test("saved exterior choices keep only known options", () => {
  const setup = sanitizeSetup({
    photoTypes: ["exterior"],
    exterior: { homeStyles: ["craftsman", "not a style"], roofStyles: "bad" },
  });

  assert.deepEqual(setup.photoTypes, ["exterior"]);
  assert.deepEqual(setup.exterior.homeStyles, ["craftsman"]);
  assert.deepEqual(setup.exterior.roofStyles, []);
});

test("a group with nothing picked uses every option, and picked options are kept", () => {
  const resolved = resolveExteriorOptions({ homeStyles: ["craftsman"] });

  assert.deepEqual(resolved.homeStyles, ["craftsman"]);

  for (const { key, options } of exteriorOptionGroups) {
    if (key !== "homeStyles") {
      assert.deepEqual(resolved[key], options, key);
    }
  }
  assert.deepEqual(resolveExteriorOptions(undefined).garages, exteriorOptionGroups.at(-1)?.options);
});

test("exterior scenarios cycle through every option of a group before repeating", () => {
  const options = resolveExteriorOptions({});
  const count = options.roofStyles.length;
  const scenarios = buildExteriorScenarios(count, options, counter());

  assert.equal(scenarios.length, count);
  assert.equal(new Set(scenarios.map((s) => s.roofStyle)).size, count);
  assert.deepEqual(buildExteriorScenarios(0, options, counter()), []);
});

test("exterior scenarios use only the picked options", () => {
  const options = resolveExteriorOptions({ homeStyles: ["craftsman", "Tudor"] });
  const scenarios = buildExteriorScenarios(6, options, counter());

  assert.ok(scenarios.every((s) => s.homeStyle === "craftsman" || s.homeStyle === "Tudor"));
  assert.equal(new Set(scenarios.map((s) => s.homeStyle)).size, 2);
});

test("the exterior prompt carries every choice, and builder's grade is a modest home", () => {
  const [scenario] = buildExteriorScenarios(1, resolveExteriorOptions({}), counter());
  const prompt = buildExteriorPrompt(scenario!, "upscale", 0, 4);

  for (const value of Object.values(scenario!)) {
    assert.ok(prompt.includes(value), value);
  }
  assert.match(prompt, /Variation 1 of 4/);
  assert.match(buildExteriorPrompt(scenario!, "builder's grade layout", 0, 4), /Modest entry-level tract home/);
});

test("the saved batch details list exterior photos after the interior images", () => {
  const [scenario] = buildExteriorScenarios(1, resolveExteriorOptions({}), counter());
  const manifest = buildPendingManifest({
    id: "run-x",
    mode: "direct",
    settings: {},
    scenarios: [],
    exteriors: [scenario!],
  });

  assert.equal(manifest.requestedImages, 1);
  assert.equal(manifest.images[0]?.room, "exterior");
  assert.deepEqual(manifest.images[0]?.exterior, scenario);

  const interiorOnly = buildPendingManifest({ id: "run-y", mode: "direct", settings: {}, scenarios: [] });

  assert.equal(interiorOnly.requestedImages, 0);
});
