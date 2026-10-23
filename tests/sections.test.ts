import assert from "node:assert/strict";
import test from "node:test";

import {
  SECTION_DEFAULTS,
  parseSectionState,
  setAllSections,
} from "../lib/sections";

test("sections start with Room, Look and Output open and Details closed", () => {
  assert.deepEqual(SECTION_DEFAULTS, { room: true, look: true, details: false, output: true });
  assert.deepEqual(parseSectionState(null), SECTION_DEFAULTS);
});

test("saved open/closed state is restored", () => {
  const saved = JSON.stringify({ room: false, look: true, details: true, output: false });
  assert.deepEqual(parseSectionState(saved), {
    room: false,
    look: true,
    details: true,
    output: false,
  });
});

test("malformed or partial saved state falls back to defaults per section", () => {
  assert.deepEqual(parseSectionState("not json"), SECTION_DEFAULTS);
  assert.deepEqual(parseSectionState("[1,2]"), SECTION_DEFAULTS);
  assert.deepEqual(parseSectionState(JSON.stringify({ room: "yes", details: true })), {
    ...SECTION_DEFAULTS,
    details: true,
  });
});

test("expand all and collapse all set every section", () => {
  assert.deepEqual(setAllSections(true), { room: true, look: true, details: true, output: true });
  assert.deepEqual(setAllSections(false), { room: false, look: false, details: false, output: false });
});
