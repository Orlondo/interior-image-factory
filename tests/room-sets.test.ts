import assert from "node:assert/strict";
import test from "node:test";
import { buildPendingManifest, completeManifest } from "../lib/batchManifest";
import {
  LIVE_IMAGE_LIMIT,
  MAX_ANGLES,
  describeSets,
  liveLimitMessage,
  planRoomSets,
  planRuns,
  runReferenceItems,
  usesRoomSets,
} from "../lib/roomSets";
import type { PromptScenario } from "../lib/scenarioPlan";
import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup } from "../lib/setup";
import { SET_ANGLES, sameHousePrompt, sameRoomPrompt, setAngleDirection } from "../lib/setPrompts";

test("sets split each room's images into groups of the chosen angles and always add up", () => {
  const sets = planRoomSets(["kitchen", "living room"], { kitchen: 7, "living room": 5 }, 3);
  assert.deepEqual(
    sets.map((set) => [set.room, set.number, set.size]),
    [
      ["kitchen", 1, 3],
      ["kitchen", 2, 3],
      ["kitchen", 3, 1],
      ["living room", 4, 3],
      ["living room", 5, 2],
    ]
  );
  assert.equal(sets.reduce((sum, set) => sum + set.size, 0), 12);
});

test("one angle gives one set per image, a room with no images gives none, and angles are clamped", () => {
  assert.equal(planRoomSets(["a"], { a: 4 }, 1).length, 4);
  assert.deepEqual(planRoomSets(["a", "b"], { a: 0, b: 2 }, 2).map((set) => set.room), ["b"]);
  assert.equal(planRoomSets(["a"], { a: 12 }, 99)[0]?.size, MAX_ANGLES);
  assert.equal(planRoomSets(["a"], { a: 3 }, 0)[0]?.size, 1);
});

test("the page text says what will happen", () => {
  const sets = planRoomSets(["kitchen", "living room"], { kitchen: 6, "living room": 6 }, 3);
  assert.equal(describeSets(sets, 3, false), "2 kitchens, 2 living rooms, each shown from up to 3 angles");
  assert.equal(describeSets(sets, 1, true), "2 kitchens, 2 living rooms, all in one house");
  assert.equal(describeSets(sets, 1, false), "");
  assert.equal(usesRoomSets(1, false), false);
  assert.equal(usesRoomSets(2, false), true);
  assert.equal(usesRoomSets(1, true), true);
});

test("sets are limited to the images that can be made live", () => {
  assert.equal(liveLimitMessage(24, 3, false), null);
  assert.equal(liveLimitMessage(100, 1, false), null);
  assert.match(liveLimitMessage(32, 3, false) ?? "", new RegExp(`${LIVE_IMAGE_LIMIT} images`));
  assert.match(liveLimitMessage(32, 1, true) ?? "", /Same house/);
});

test("angles of a room are built from the room's first image", () => {
  const items = planRuns(planRoomSets(["a", "b"], { a: 3, b: 2 }, 3), false);
  assert.deepEqual(
    items.map((item) => [item.kind, item.set, item.angle, item.ref, item.depth]),
    [
      ["anchor", 1, 0, null, 0],
      ["angle", 1, 1, 0, 1],
      ["angle", 1, 2, 0, 1],
      ["anchor", 2, 0, null, 0],
      ["angle", 2, 1, 3, 1],
    ]
  );
});

test("in a house every later room starts from the house's first image", () => {
  const items = planRuns(planRoomSets(["a", "b", "c"], { a: 2, b: 2, c: 2 }, 2), true);
  assert.deepEqual(
    items.map((item) => [item.kind, item.ref, item.depth]),
    [
      ["anchor", null, 0],
      ["angle", 0, 1],
      ["house", 0, 1],
      ["angle", 2, 2],
      ["house", 0, 1],
      ["angle", 4, 2],
    ]
  );
});

test("images run in order of what they need, and each gets its reference", async () => {
  const items = planRuns(planRoomSets(["a", "b"], { a: 2, b: 2 }, 2), true);
  const started: number[] = [];
  const seen: Array<string | null> = [];
  const results = await runReferenceItems(
    items,
    async (item, reference) => {
      started.push(item.index);
      seen[item.index] = reference;
      return `img${item.index}`;
    },
    4
  );
  assert.deepEqual(results, ["img0", "img1", "img2", "img3"]);
  assert.equal(started[0], 0); // the house's first image before anything built from it
  assert.deepEqual(seen, [null, "img0", "img0", "img2"]);
});

test("independent images run together up to the limit", async () => {
  const items = planRuns(planRoomSets(["a"], { a: 6 }, 1), false);
  let running = 0;
  let most = 0;
  await runReferenceItems(
    items,
    async (item) => {
      running += 1;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return `img${item.index}`;
    },
    4
  );
  assert.equal(most, 4);
});

test("an image whose reference did not come back is made without one, and an error stops the run", async () => {
  const items = planRuns(planRoomSets(["a"], { a: 3 }, 3), false);
  const seen: Array<string | null> = [];
  const results = await runReferenceItems(
    items,
    async (item, reference) => {
      seen[item.index] = reference;
      return item.index === 0 ? null : `img${item.index}`;
    },
    4
  );
  assert.deepEqual(seen, [null, null, null]);
  assert.deepEqual(results, [null, "img1", "img2"]);
  await assert.rejects(
    runReferenceItems(items, async () => Promise.reject(new Error("boom")), 4),
    /boom/
  );
});

test("prompts keep the room and say what may change", () => {
  const same = sameRoomPrompt("kitchen", setAngleDirection(1));
  assert.match(same, /exact same kitchen/);
  assert.match(same, /Do not add, remove or move any furniture/);
  assert.ok(same.includes(SET_ANGLES[0] as string));
  assert.equal(setAngleDirection(SET_ANGLES.length + 1), SET_ANGLES[0]); // angles repeat if there are ever more

  const house = sameHousePrompt("bedroom", "ROOM PROMPT TEXT");
  assert.match(house, /bedroom of this same house/);
  assert.match(house, /do not copy the reference room's layout/);
  assert.ok(house.endsWith("ROOM PROMPT TEXT"));
});

test("the request is unchanged unless a set option is used", () => {
  const plain = buildGeneratePayload(DEFAULT_SETUP);
  assert.ok(!("anglesPerRoom" in plain));
  assert.ok(!("sameHouse" in plain));
  const both = buildGeneratePayload({ ...DEFAULT_SETUP, anglesPerRoom: 4, sameHouse: true });
  assert.equal(both.anglesPerRoom, 4);
  assert.equal(both.sameHouse, true);
});

test("saved setups from before sets exist load with the options off, and bad values are dropped", () => {
  const old = sanitizeSetup({ rooms: ["kitchen"], maxImages: 12 });
  assert.equal(old.anglesPerRoom, 1);
  assert.equal(old.sameHouse, false);
  const bad = sanitizeSetup({ anglesPerRoom: 9, sameHouse: "yes" });
  assert.equal(bad.anglesPerRoom, 1);
  assert.equal(bad.sameHouse, false);
  const good = sanitizeSetup({ anglesPerRoom: 3, sameHouse: true });
  assert.equal(good.anglesPerRoom, 3);
  assert.equal(good.sameHouse, true);
});

test("the saved details name the set only for room angles", () => {
  const scenario: PromptScenario = {
    room: "kitchen",
    view: "v",
    colorProfile: "c",
    focalPoints: [],
    windowStyle: "w",
    wall: "wl",
    ceiling: "ce",
    ceilingLight: "cl",
    wallColorPalette: "p",
  };
  const manifest = buildPendingManifest({
    id: "run-1",
    mode: "direct",
    settings: {},
    scenarios: [scenario, { ...scenario, set: { number: 1, angle: 1, size: 2 } }],
  });
  assert.ok(!("set" in (manifest.images[0] as object)));
  assert.deepEqual(manifest.images[1]?.set, { number: 1, angle: 1, size: 2 });
  assert.deepEqual(completeManifest(manifest, [1]).images[0]?.set, { number: 1, angle: 1, size: 2 });
});
