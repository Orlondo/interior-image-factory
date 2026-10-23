import assert from "node:assert/strict";
import test from "node:test";

import {
  FULL_ENUMERATION_LIMIT,
  decodeIndex,
  sampleDistinctIndices,
  totalCombinations,
} from "../lib/scenarioSampling";
import { countCombinations } from "../lib/batch";
import { DEFAULT_SETUP } from "../lib/setup";

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test("totalCombinations treats empty groups as one and matches the UI count", () => {
  assert.equal(totalCombinations([2, 0, 3, 0]), 6);
  assert.equal(totalCombinations([]), 1);
  const setup = { ...DEFAULT_SETUP, walls: ["a", "b", "c"], windowStyles: ["x", "y"] };
  assert.equal(
    totalCombinations([
      setup.rooms.length, setup.views.length, setup.colorProfiles.length, setup.focalPoints.length,
      setup.windowStyles.length, setup.walls.length, setup.ceilings.length, setup.ceilingLights.length,
    ]),
    countCombinations(setup)
  );
});

test("decodeIndex visits every combination exactly once", () => {
  const sizes = [2, 3, 1, 4];
  const total = totalCombinations(sizes);
  const seen = new Set<string>();

  for (let index = 0; index < total; index += 1) {
    const positions = decodeIndex(index, sizes);
    positions.forEach((position, group) => {
      assert.ok(position >= 0 && position < sizes[group]);
    });
    seen.add(positions.join(","));
  }

  assert.equal(seen.size, total);
});

test("sampleDistinctIndices returns distinct in-range indices", () => {
  for (let seed = 1; seed <= 50; seed += 1) {
    const picked = sampleDistinctIndices(1000, 200, seeded(seed));
    assert.equal(picked.length, 200);
    assert.equal(new Set(picked).size, 200);
    assert.ok(picked.every((value) => Number.isInteger(value) && value >= 0 && value < 1000));
  }
});

test("sampleDistinctIndices returns everything when count covers the total", () => {
  assert.deepEqual(sampleDistinctIndices(3, 12, Math.random), [0, 1, 2]);
  assert.deepEqual(sampleDistinctIndices(5, 5, Math.random), [0, 1, 2, 3, 4]);
});

test("sampling is deterministic for a seed and covers the range", () => {
  assert.deepEqual(
    sampleDistinctIndices(1e9, 20, seeded(7)),
    sampleDistinctIndices(1e9, 20, seeded(7))
  );
  const spread = sampleDistinctIndices(1e9, 200, seeded(3));
  assert.ok(Math.max(...spread) > 5e8 && Math.min(...spread) < 5e8);
});

test("a huge selection samples instantly without building every combination", () => {
  const sizes = [28, 12, 5, 8, 6, 12, 8, 6];
  const total = totalCombinations(sizes);
  assert.ok(total > FULL_ENUMERATION_LIMIT);

  const started = Date.now();
  const picked = sampleDistinctIndices(total, 200, seeded(11));
  const decoded = picked.map((index) => decodeIndex(index, sizes));

  assert.equal(decoded.length, 200);
  assert.ok(Date.now() - started < 200);
  assert.equal(new Set(decoded.map((positions) => positions.join(","))).size, 200);
});
