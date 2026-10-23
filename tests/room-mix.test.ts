import assert from "node:assert/strict";
import test from "node:test";
import {
  describeSplit,
  evenSplit,
  rescaleCounts,
  validateRoomCounts,
} from "../lib/roomMix";
import { buildScenarioPlan } from "../lib/scenarioPlan";

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("evenSplit gives earlier rooms the extra image", () => {
  assert.deepEqual(evenSplit(["a", "b"], 20), { a: 10, b: 10 });
  assert.deepEqual(evenSplit(["a", "b", "c"], 20), { a: 7, b: 7, c: 6 });
  assert.deepEqual(evenSplit(["a", "b", "c"], 2), { a: 1, b: 1, c: 0 });
  assert.deepEqual(evenSplit([], 5), {});
});

test("validateRoomCounts accepts matching counts and rejects bad ones", () => {
  const rooms = ["kitchen", "living room"];
  assert.equal(validateRoomCounts({ kitchen: 5, "living room": 15 }, rooms, 20), null);
  assert.match(validateRoomCounts({ kitchen: 5, "living room": 14 }, rooms, 20) ?? "", /add up to 19/);
  assert.match(validateRoomCounts({ kitchen: 20, bath: 0 }, rooms, 20) ?? "", /not a selected room/);
  assert.match(validateRoomCounts({ kitchen: 2.5, "living room": 17.5 }, rooms, 20) ?? "", /whole number/);
  assert.match(validateRoomCounts({ kitchen: -1, "living room": 21 }, rooms, 20) ?? "", /whole number/);
  assert.match(validateRoomCounts([1, 2], rooms, 20) ?? "", /object/);
  assert.match(validateRoomCounts(null, rooms, 20) ?? "", /object/);
});

test("rescaleCounts keeps ratios and always adds up", () => {
  const rooms = ["a", "b", "c"];
  for (const total of [4, 8, 12, 20, 33, 100]) {
    const result = rescaleCounts(rooms, { a: 5, b: 15, c: 0 }, total);
    assert.equal(result.a + result.b + result.c, total);
    assert.equal(result.c, 0);
  }
  assert.deepEqual(rescaleCounts(rooms, { a: 5, b: 15, c: 0 }, 40), { a: 10, b: 30, c: 0 });
  assert.deepEqual(rescaleCounts(rooms, { a: 0, b: 0, c: 0 }, 6), { a: 2, b: 2, c: 2 });
});

test("describeSplit lists rooms with images", () => {
  assert.equal(describeSplit(["kitchen", "living room", "bath"], { kitchen: 10, "living room": 10, bath: 0 }), "kitchen 10, living room 10");
});

function plan(counts: number[], big = false) {
  const many = (n: number) => Array.from({ length: n }, (_, i) => `v${i}`);
  return buildScenarioPlan({
    rooms: ["kitchen", "living room"],
    counts,
    views: many(big ? 12 : 2),
    colorProfiles: many(big ? 12 : 2),
    focalPoints: many(big ? 12 : 0),
    windowStyles: many(big ? 12 : 1),
    walls: many(big ? 12 : 1),
    ceilings: many(big ? 12 : 1),
    ceilingLights: many(big ? 12 : 1),
    random: createSeededRandom(42),
    pickWallColorPalette: () => "p",
  });
}

test("plan produces exactly the requested count per room", () => {
  const result = plan([5, 15]);
  assert.equal(result.length, 20);
  assert.equal(result.filter((s) => s.room === "kitchen").length, 5);
  assert.equal(result.filter((s) => s.room === "living room").length, 15);
});

test("plan samples without repeats when the pool is huge", () => {
  const result = plan([7, 3], true);
  assert.equal(result.filter((s) => s.room === "kitchen").length, 7);
  const keys = result.filter((s) => s.room === "kitchen").map((s) => JSON.stringify(s));
  assert.equal(new Set(keys).size, 7);
});

test("plan skips rooms with zero images and cycles small pools", () => {
  const result = plan([0, 9]);
  assert.equal(result.length, 9);
  assert.ok(result.every((s) => s.room === "living room"));
});

import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup } from "../lib/setup";

test("payload adds roomCounts only for custom splits with 2+ rooms", () => {
  const base = { ...DEFAULT_SETUP, rooms: ["kitchen", "living room"] as never, maxImages: 20 };
  assert.equal("roomCounts" in buildGeneratePayload(base), false);
  const custom = { ...base, roomSplitMode: "custom" as const, roomCounts: { kitchen: 5, "living room": 15 } };
  assert.deepEqual((buildGeneratePayload(custom) as { roomCounts?: unknown }).roomCounts, { kitchen: 5, "living room": 15 });
  const single = { ...custom, rooms: ["kitchen"] as never };
  assert.equal("roomCounts" in buildGeneratePayload(single), false);
});

test("old saved setups load as an even split, bad custom counts fall back", () => {
  assert.equal(sanitizeSetup({ rooms: ["kitchen", "living room"], maxImages: 20 }).roomSplitMode, "even");
  const ok = sanitizeSetup({ rooms: ["kitchen", "living room"], maxImages: 20, roomSplitMode: "custom", roomCounts: { kitchen: 5, "living room": 15 } });
  assert.equal(ok.roomSplitMode, "custom");
  const bad = sanitizeSetup({ rooms: ["kitchen", "living room"], maxImages: 20, roomSplitMode: "custom", roomCounts: { kitchen: 5, "living room": 9 } });
  assert.equal(bad.roomSplitMode, "even");
  assert.deepEqual(bad.roomCounts, {});
});
