import assert from "node:assert/strict";
import test from "node:test";

import {
  SECTION_DEFAULTS,
  parseSectionState,
  setAllSections,
} from "../lib/sections";

test("sections start with Room, Look, Output and Results open and Details closed", () => {
  assert.deepEqual(SECTION_DEFAULTS, {
    room: true,
    look: true,
    details: false,
    output: true,
    results: true,
  });
  assert.deepEqual(parseSectionState(null), SECTION_DEFAULTS);
});

test("saved open/closed state is restored", () => {
  const saved = JSON.stringify({ room: false, look: true, details: true, output: false, results: false });
  assert.deepEqual(parseSectionState(saved), {
    room: false,
    look: true,
    details: true,
    output: false,
    results: false,
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

test("state saved while Saved setups was a section keeps the other sections and ignores setups", () => {
  const older = JSON.stringify({ setups: true, room: false, look: false, details: true, output: true });
  assert.deepEqual(parseSectionState(older), {
    room: false,
    look: false,
    details: true,
    output: true,
    results: true,
  });
});

test("expand all and collapse all set every section", () => {
  assert.deepEqual(setAllSections(true), {
    room: true,
    look: true,
    details: true,
    output: true,
    results: true,
  });
  assert.deepEqual(setAllSections(false), {
    room: false,
    look: false,
    details: false,
    output: false,
    results: false,
  });
});
