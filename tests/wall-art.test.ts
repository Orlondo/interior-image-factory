import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup } from "../lib/setup";
import { EMPTY_WALL_ART, MIX_IT_UP, sanitizeWallArt, wallArtLines, wallArtSubjects } from "../lib/wallArt";

test("nothing set adds nothing", () => {
  assert.equal(wallArtLines(EMPTY_WALL_ART, 0), "");
  assert.equal("wallArt" in buildGeneratePayload(DEFAULT_SETUP), false);
});

test("several subjects spread across images", () => {
  const art = sanitizeWallArt({ subjects: ["botanicals", "seascapes"], pieces: null });
  assert.ok(wallArtLines(art, 0).includes("botanical"));
  assert.ok(wallArtLines(art, 1).includes("seascapes"));
  assert.ok(wallArtLines(art, 2).includes("botanical"));
});

test("mix it up cycles every subject", () => {
  const art = sanitizeWallArt({ subjects: [MIX_IT_UP, "abstract"] });
  assert.deepEqual(art.subjects, [MIX_IT_UP]);
  const seen = new Set(wallArtSubjects.map((_, slot) => wallArtLines(art, slot)));
  assert.equal(seen.size, wallArtSubjects.length);
});

test("pieces: fixed number and mix", () => {
  assert.ok(wallArtLines({ subjects: [], pieces: 3 }, 0).includes("exactly 3 pieces"));
  assert.ok(wallArtLines({ subjects: [], pieces: 1 }, 0).includes("exactly one piece"));
  const mixed = new Set([0, 1, 2, 3].map((slot) => wallArtLines({ subjects: [], pieces: "mix" }, slot)));
  assert.ok(mixed.size > 1);
  assert.equal(sanitizeWallArt({ pieces: 99 }).pieces, null);
});

test("setup round trip", () => {
  const setup = sanitizeSetup({ ...DEFAULT_SETUP, wallArt: { subjects: ["abstract", "nope"], pieces: 4 } });
  assert.deepEqual(setup.wallArt, { subjects: ["abstract"], pieces: 4 });
  assert.deepEqual((buildGeneratePayload(setup) as Record<string, unknown>).wallArt, setup.wallArt);
});
