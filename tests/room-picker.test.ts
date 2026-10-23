import assert from "node:assert/strict";
import test from "node:test";
import { rooms } from "../lib/combinations";
import {
  QUICK_SETS,
  countSelected,
  filterGroups,
  initialOpenGroups,
  quickSetMatches,
  resolveQuickSets,
  selectedInGroup,
} from "../lib/roomPicker";

const groups = [
  { title: "Living Spaces", rooms: ["living room", "family room", "dining room"] },
  { title: "Private Spaces", rooms: ["bedroom", "bathroom"] },
  { title: "Fitness Spaces", rooms: ["home gym"] },
];

test("every quick set uses real room types, with no repeats and at least two rooms", () => {
  assert.ok(QUICK_SETS.length >= 3);
  const ids = new Set<string>();

  for (const set of QUICK_SETS) {
    assert.ok(!ids.has(set.id), `duplicate id ${set.id}`);
    ids.add(set.id);
    assert.ok(set.rooms.length >= 2, `${set.id} has too few rooms`);
    assert.equal(new Set(set.rooms).size, set.rooms.length, `${set.id} repeats a room`);

    for (const room of set.rooms) {
      assert.ok(rooms.includes(room as (typeof rooms)[number]), `${room} is not a room type`);
    }
  }

  assert.deepEqual(resolveQuickSets(rooms).map((set) => set.id), QUICK_SETS.map((set) => set.id));
});

test("resolveQuickSets drops unknown rooms and sets that end up too small", () => {
  const sets = [
    { id: "a", label: "A", rooms: ["kitchen", "pantry", "ghost room"] },
    { id: "b", label: "B", rooms: ["kitchen", "ghost room"] },
  ];

  assert.deepEqual(resolveQuickSets(["kitchen", "pantry"], sets), [
    { id: "a", label: "A", rooms: ["kitchen", "pantry"] },
  ]);
});

test("quickSetMatches ignores order and needs the exact rooms", () => {
  const set = { id: "x", label: "X", rooms: ["kitchen", "pantry"] };

  assert.equal(quickSetMatches(["pantry", "kitchen"], set), true);
  assert.equal(quickSetMatches(["kitchen"], set), false);
  assert.equal(quickSetMatches(["kitchen", "pantry", "foyer"], set), false);
  assert.equal(quickSetMatches([], set), false);
});

test("groups with a selected room start open; the first opens when nothing is selected", () => {
  assert.deepEqual(initialOpenGroups(groups, ["bathroom"]), {
    "Living Spaces": false,
    "Private Spaces": true,
    "Fitness Spaces": false,
  });
  assert.deepEqual(initialOpenGroups(groups, ["living room", "home gym"]), {
    "Living Spaces": true,
    "Private Spaces": false,
    "Fitness Spaces": true,
  });
  assert.deepEqual(initialOpenGroups(groups, []), {
    "Living Spaces": true,
    "Private Spaces": false,
    "Fitness Spaces": false,
  });
  assert.deepEqual(initialOpenGroups([], []), {});
});

test("filterGroups matches room names and category names, and keeps everything for an empty query", () => {
  assert.deepEqual(filterGroups(groups, "  ").map((g) => g.title), groups.map((g) => g.title));
  assert.deepEqual(filterGroups(groups, "gym"), [{ title: "Fitness Spaces", rooms: ["home gym"] }]);
  assert.deepEqual(filterGroups(groups, "ROOM").map((g) => [g.title, g.rooms]), [
    ["Living Spaces", ["living room", "family room", "dining room"]],
    ["Private Spaces", ["bedroom", "bathroom"]],
  ]);
  assert.deepEqual(filterGroups(groups, "private").map((g) => g.rooms), [["bedroom", "bathroom"]]);
  assert.deepEqual(filterGroups(groups, "zzz"), []);
});

test("counts and one-line summaries follow the group's own order", () => {
  assert.equal(countSelected(groups[0], ["dining room", "living room", "bedroom"]), 2);
  assert.deepEqual(selectedInGroup(groups[0], ["dining room", "living room", "bedroom"]), [
    "living room",
    "dining room",
  ]);
  assert.deepEqual(selectedInGroup(groups[2], []), []);
});
