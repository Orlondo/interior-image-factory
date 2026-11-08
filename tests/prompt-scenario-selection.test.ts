import assert from "node:assert/strict";
import test from "node:test";

import { styles } from "../lib/combinations";
import { buildPrompt } from "../lib/promptBuilder";
import {
  createPromptScenarioSamples,
  selectPromptScenarios,
} from "../lib/promptScenarioSelection";
import { shouldUseBatchModeForImageGeneration } from "../app/generate/route";

test("createPromptScenarioSamples creates only the requested scenario count", () => {
  let callCount = 0;
  const scenarios = createPromptScenarioSamples(
    ["kitchen", "living room", "bedroom"],
    12,
    (room, index) => {
      callCount += 1;
      return { room, index };
    },
    () => 0.5
  );

  assert.equal(scenarios.length, 12);
  assert.equal(callCount, 12);
  assert.equal(scenarios.filter((scenario) => scenario.room === "kitchen").length, 3);
});

test("selectPromptScenarios ignores undefined values and still reserves kitchens", () => {
  const selected = selectPromptScenarios(
    [undefined, { room: "kitchen" }, { room: "living room" } as any],
    4,
    () => 0.5
  );

  assert.equal(selected.length, 4);
  assert.equal(selected[0]?.room, "kitchen");
  assert.equal(selected.filter((scenario) => scenario.room === "kitchen").length, 1);
  assert.ok(selected.every((scenario) => scenario !== undefined));
});

test("selectPromptScenarios rejects malformed scenarios with no room", () => {
  const selected = selectPromptScenarios(
    [
      { room: "kitchen" },
      {} as any,
      { room: "living room" } as any,
      { room: undefined } as any,
    ],
    4,
    () => 0.2
  );

  assert.equal(selected.length, 4);
  assert.ok(selected.every((scenario) => typeof scenario.room === "string"));
  assert.equal(selected.filter((scenario) => scenario.room === "kitchen").length, 1);
});

test("selectPromptScenarios normalizes room values to defined strings", () => {
  const selected = selectPromptScenarios(
    [
      { room: "" } as any,
      { room: "kitchen" } as any,
      { room: undefined } as any,
      { room: "living room" } as any,
    ],
    4,
    () => 0.5
  );

  assert.equal(selected.length, 4);
  assert.ok(selected.every((scenario) => typeof scenario.room === "string" && scenario.room.length > 0));
  assert.ok(selected.every((scenario) => scenario.room !== undefined));
});

test("every style produces its own distinct style direction in the prompt", () => {
  const fallback = "Strongly adhere to the selected style with distinct forms";
  const directions = styles.map((style) => {
    const prompt = buildPrompt(
      "living room",
      "standard room (180-280 sq ft)",
      style,
      "Warm Neutral",
      50,
      "Designer Layered",
      "Architectural Surfaces",
      "Designer Mixed",
      false,
      0,
      1,
      "upscale",
      "cool contemporary mix (white, gray, slate blue, charcoal accents)",
      ["current balanced palette (default)"],
      "city skyline",
      ["balanced windows (standard residential)"],
      [],
      ["textured plaster walls"],
      ["smooth white ceiling"],
      ["recessed downlights"]
    );
    const line = prompt.split("\n").find((entry) => entry.includes("Style fidelity"));

    assert.ok(line, `${style} is missing a style direction`);
    assert.ok(!line.includes(fallback), `${style} fell back to the generic direction`);
    return line;
  });

  assert.equal(new Set(directions).size, styles.length);
});

test("builder's grade forces a small compact layout even when a large room is selected", () => {
  const build = (quality: "builder's grade layout" | "upscale") =>
    buildPrompt(
      "living room",
      "large room (280-420 sq ft)",
      "modern",
      "Warm Neutral",
      50,
      "Designer Layered",
      "Architectural Surfaces",
      "Designer Mixed",
      false,
      0,
      1,
      quality,
      "cool contemporary mix (white, gray, slate blue, charcoal accents)",
      ["current balanced palette (default)"],
      "city skyline",
      ["balanced windows (standard residential)"],
      [],
      ["textured plaster walls"],
      ["smooth white ceiling"],
      ["recessed downlights"]
    );

  const builder = build("builder's grade layout");

  assert.match(builder, /compact room \(120-180 sq ft\)/);
  assert.doesNotMatch(builder, /large room \(280-420 sq ft\)/);
  assert.match(builder, /Builder-grade layout rule/);
  assert.match(builder, /selected windows, walls, ceiling, lighting, and focal points are visible upgrades/);
  assert.match(build("upscale"), /large room \(280-420 sq ft\)/);
});

test("styles list includes Wabi-Sabi and excludes only the experimental legacy options", () => {
  assert.ok(styles.includes("wabi-sabi"));
  assert.ok(!styles.includes("art deco"));
  assert.ok(!styles.includes("organic modern"));
  assert.ok(!styles.includes("quiet luxury"));
  assert.ok(!styles.includes("liminal spaces"));
});

test("image generation uses OpenAI batch jobs only above the large-run threshold", () => {
  assert.equal(shouldUseBatchModeForImageGeneration(30, "gpt-image-2"), true);
  assert.equal(shouldUseBatchModeForImageGeneration(24, "gpt-image-2"), false);
  assert.equal(shouldUseBatchModeForImageGeneration(12, "gpt-image-2"), false);
  assert.equal(shouldUseBatchModeForImageGeneration(30, "gpt-image-1"), false);
});

test("focal points include divider, doorway, and seasonal lifestyle feature options", async () => {
  const { focalPoints } = await import("../lib/combinations");

  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("metal divider"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("clear glass divider"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("warm wood frame"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("bookcase room divider"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("wood-framed rectangular doorway"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("travertine-framed rectangular doorway"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("marble-framed curved doorway"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("tv wall"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("wine wall"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("planterium"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("flowering plants"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("thanksgiving-inspired table setting"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("everyday dinner styling"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("pet dog"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("pet cat"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("fall floral arrangement"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("autumn foliage"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("fall photography"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("regular floor lamp"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("hanging floor lamp"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("floor-to-ceiling marble wall"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("indoor open-to-outdoor"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("kitchen fireplace as a backsplash"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("fireplace framed on the countertop"))
  );
  assert.ok(
    focalPoints.some((option) => option.toLowerCase().includes("fireplace integrated into the island"))
  );
});
