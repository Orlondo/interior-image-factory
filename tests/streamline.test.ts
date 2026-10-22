import assert from "node:assert/strict";
import test from "node:test";

import {
  ceilingLights,
  ceilings,
  colorCoverages,
  colorMoods,
  colorProfiles,
  colorStrategies,
  focalPoints,
  heroColors,
  views,
  walls,
  windowStyles,
} from "../lib/combinations";
import { countCombinations, describeBatch, pickRandomSubset } from "../lib/batch";
import {
  BUILT_IN_LOOKS,
  DEFAULT_LOOK_ID,
  INTENSITY_STEPS,
  findMatchingLook,
  getIntensityStep,
  getIntensityStepIndex,
  getLookValues,
} from "../lib/looks";
import {
  cleanName,
  parseSavedLooks,
  parseSavedSetups,
  validateName,
  writeList,
  type SavedLook,
  type SavedSetup,
} from "../lib/savedItems";
import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup, type Setup } from "../lib/setup";
import { buildPrompt } from "../lib/promptBuilder";

test("default payload is identical to what the page sent before the redesign", () => {
  assert.deepEqual(buildGeneratePayload(DEFAULT_SETUP), {
    rooms: ["living room"],
    outsideViews: [views[0]],
    colorProfiles: [colorProfiles[0]],
    focalPoints: [],
    windowStyles: [windowStyles[1]],
    walls: [walls[2]],
    ceilings: [ceilings[0]],
    ceilingLights: [ceilingLights[0]],
    roomSize: "standard room (180-280 sq ft)",
    designStyle: "modern",
    colorMood: "Warm Neutral",
    colorStrategy: "Designer Layered",
    colorCoverage: "Architectural Surfaces",
    heroColor: "Auto",
    colorIntensity: 25,
    colorPresence: 25,
    autoPaletteVariation: true,
    homeQuality: "upscale",
    randomizeWallColor: false,
    fileSize: "small",
    aspectRatio: "16:9",
    maxImages: 12,
  });
});

test("payload keys are unchanged and in the original order", () => {
  assert.deepEqual(Object.keys(buildGeneratePayload(DEFAULT_SETUP)), [
    "rooms", "outsideViews", "colorProfiles", "focalPoints", "windowStyles", "walls",
    "ceilings", "ceilingLights", "roomSize", "designStyle", "colorMood", "colorStrategy",
    "colorCoverage", "heroColor", "colorIntensity", "colorPresence", "autoPaletteVariation",
    "homeQuality", "randomizeWallColor", "fileSize", "aspectRatio", "maxImages",
  ]);
});

test("the default Look equals today's color defaults", () => {
  const defaultLook = BUILT_IN_LOOKS.find((look) => look.id === DEFAULT_LOOK_ID);
  assert.ok(defaultLook);
  assert.deepEqual(defaultLook.values, getLookValues(DEFAULT_SETUP));
  assert.equal(findMatchingLook(DEFAULT_SETUP, BUILT_IN_LOOKS)?.id, DEFAULT_LOOK_ID);
});

test("every built-in Look uses valid options and has a unique id and name", () => {
  const ids = new Set<string>();
  const names = new Set<string>();

  for (const look of BUILT_IN_LOOKS) {
    assert.ok(colorMoods.includes(look.values.colorMood), look.name);
    assert.ok(colorStrategies.includes(look.values.colorStrategy), look.name);
    assert.ok(colorCoverages.includes(look.values.colorCoverage), look.name);
    assert.ok((heroColors as readonly string[]).includes(look.values.heroColor), look.name);
    assert.equal(look.values.autoPaletteVariation, true);
    assert.ok(INTENSITY_STEPS.some((step) => step.value === look.values.colorIntensity), look.name);
    ids.add(look.id);
    names.add(look.name);
  }

  assert.equal(ids.size, BUILT_IN_LOOKS.length);
  assert.equal(names.size, BUILT_IN_LOOKS.length);
});

test("applying each Look yields a prompt that builds, and each Look matches only itself", () => {
  for (const look of BUILT_IN_LOOKS) {
    const setup: Setup = { ...DEFAULT_SETUP, ...look.values };
    assert.equal(findMatchingLook(setup, BUILT_IN_LOOKS)?.id, look.id, look.name);

    const prompt = buildPrompt(
      "living room", setup.roomSize, setup.designStyle, setup.colorMood, setup.colorIntensity,
      setup.colorStrategy, setup.colorCoverage, setup.heroColor, setup.autoPaletteVariation,
      0, 12, setup.homeQuality, "auto", setup.colorProfiles, views[0], setup.windowStyles,
      [], setup.walls, setup.ceilings, setup.ceilingLights
    );
    assert.ok(prompt.length > 500, look.name);
  }
});

test("changing any Look field gives Custom", () => {
  const changed: Setup = { ...DEFAULT_SETUP, colorStrategy: "Accent Color" };
  assert.equal(findMatchingLook(changed, BUILT_IN_LOOKS), null);
  const intensityStep: Setup = { ...DEFAULT_SETUP, colorIntensity: 50 };
  assert.equal(findMatchingLook(intensityStep, BUILT_IN_LOOKS), null);
});

test("intensity steps match the prompt builder bands", () => {
  assert.equal(INTENSITY_STEPS.length, 6);
  assert.deepEqual(
    [0, 5, 10, 11, 20, 21, 25, 40, 41, 60, 61, 80, 81, 100].map(getIntensityStepIndex),
    [0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5]
  );
  INTENSITY_STEPS.forEach((step, index) => {
    assert.equal(getIntensityStepIndex(step.value), index, step.label);
  });
  assert.equal(getIntensityStep(25).label, "Soft");
  assert.equal(INTENSITY_STEPS.find((step) => step.label === "Soft")?.value, 25);
});

test("combination count mirrors the server rules", () => {
  assert.equal(countCombinations(DEFAULT_SETUP), 1);
  assert.equal(
    countCombinations({ ...DEFAULT_SETUP, walls: ["a", "b"], windowStyles: ["x", "y", "z"] }),
    6
  );
  assert.equal(countCombinations({ ...DEFAULT_SETUP, walls: [], rooms: [] }), 1);
  assert.equal(countCombinations({ ...DEFAULT_SETUP, focalPoints: ["f1", "f2"] }), 2);
  assert.equal(
    countCombinations({
      ...DEFAULT_SETUP,
      rooms: ["living room", "kitchen"],
      views: [...views],
      colorProfiles: [...colorProfiles],
      focalPoints: [...focalPoints],
      windowStyles: [...windowStyles],
      walls: [...walls],
      ceilings: [...ceilings],
      ceilingLights: [...ceilingLights],
    }),
    2 * views.length * colorProfiles.length * focalPoints.length * windowStyles.length *
      walls.length * ceilings.length * ceilingLights.length
  );
});

test("batch description states sample, repeat, or exact", () => {
  assert.equal(describeBatch(100, 12).mode, "sample");
  assert.match(describeBatch(100, 12).message, /random sample/);
  assert.equal(describeBatch(3, 12).mode, "repeat");
  assert.match(describeBatch(3, 12).message, /repeat/);
  assert.equal(describeBatch(12, 12).mode, "exact");
  assert.match(describeBatch(1, 1).message, /1 combination selected/);
  assert.equal(describeBatch(5000, 12).images, 12);
});

test("Surprise me picks a valid, non-empty, unique subset", () => {
  const options = ["a", "b", "c", "d", "e"];
  for (let run = 0; run < 200; run += 1) {
    const subset = pickRandomSubset(options);
    assert.ok(subset.length >= 1 && subset.length <= 3);
    assert.equal(new Set(subset).size, subset.length);
    assert.ok(subset.every((item) => options.includes(item)));
  }
  assert.deepEqual(pickRandomSubset([]), []);
  assert.deepEqual(pickRandomSubset(["only"], () => 0.99), ["only"]);
  assert.equal(pickRandomSubset(options, () => 0.999).length, 3);
});

test("sanitizeSetup falls back to defaults for unknown or malformed values", () => {
  assert.deepEqual(sanitizeSetup(null), DEFAULT_SETUP);
  assert.deepEqual(sanitizeSetup("nope"), DEFAULT_SETUP);

  const cleaned = sanitizeSetup({
    colorMood: "Retired Mood",
    walls: [walls[0], "removed wall"],
    colorIntensity: 250,
    maxImages: 13,
    aspectRatio: "3:2",
    rooms: "living room",
  });

  assert.equal(cleaned.colorMood, DEFAULT_SETUP.colorMood);
  assert.deepEqual(cleaned.walls, [walls[0]]);
  assert.equal(cleaned.colorIntensity, 100);
  assert.equal(cleaned.maxImages, DEFAULT_SETUP.maxImages);
  assert.equal(cleaned.aspectRatio, DEFAULT_SETUP.aspectRatio);
  assert.deepEqual(cleaned.rooms, DEFAULT_SETUP.rooms);
});

test("a setup survives save and reload unchanged", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  };
  const setup: Setup = {
    ...DEFAULT_SETUP,
    walls: [walls[0], walls[1]],
    colorStrategy: "Color Drenched",
    colorIntensity: 90,
    maxImages: 24,
  };
  const entry: SavedSetup = { id: "1", name: "Drenched walls", setup };

  const result = writeList(storage, "k", [entry]);
  assert.ok(result.ok);
  assert.deepEqual(parseSavedSetups(storage.getItem("k")), [entry]);
});

test("saved Looks round-trip and malformed entries are dropped", () => {
  const good: SavedLook = {
    id: "a",
    name: "Mine",
    values: { ...getLookValues(DEFAULT_SETUP), colorStrategy: "Accent Color" },
  };
  const serialized = JSON.stringify([
    good,
    { id: "b", name: "Bad", values: { colorMood: "Nope" } },
    { name: "No id" },
    42,
  ]);

  assert.deepEqual(parseSavedLooks(serialized), [good]);
  assert.deepEqual(parseSavedLooks("not json"), []);
  assert.deepEqual(parseSavedLooks(null), []);
});

test("saving reports a clear failure when storage is full or blocked", () => {
  const full = {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  const result = writeList(full, "k", [1]);
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.message, /unavailable or full/);
});

test("names are cleaned and validated", () => {
  assert.equal(cleanName("  My   Look  "), "My Look");
  assert.equal(cleanName("x".repeat(100)).length, 40);
  assert.equal(validateName("   ", []), "Enter a name.");
  assert.equal(validateName("coastal", ["Coastal"]), "That name is already used.");
  assert.equal(validateName("Fresh", ["Coastal"]), null);
});
