import assert from "node:assert/strict";
import test from "node:test";

import { buildPendingManifest } from "../lib/batchManifest";
import { rooms, views } from "../lib/combinations";
import { buildExteriorScenarios } from "../lib/exteriorPromptBuilder";
import { createEmptyExteriorOptions, resolveExteriorOptions } from "../lib/exteriorCombinations";
import {
  EMPTY_HOUSE,
  HOUSE_PALETTE_MAX,
  TOUR_CLOSING_LIGHT,
  TOUR_OPENING_LIGHT,
  TOUR_ROOMS,
  applyOrder,
  describeHouse,
  houseExteriorLines,
  houseFloors,
  houseMetals,
  housePaletteChoices,
  houseProfileLines,
  isHouseSet,
  sanitizeHouse,
  tourCounts,
  tourExteriors,
  tourOrder,
} from "../lib/houseProfile";
import { QUICK_SETS, resolveQuickSets } from "../lib/roomPicker";
import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup } from "../lib/setup";

test("an empty profile adds nothing: no prompt lines, nothing in the payload, same as before", () => {
  assert.equal(isHouseSet(EMPTY_HOUSE), false);
  assert.equal(houseProfileLines(EMPTY_HOUSE), "");
  assert.equal(houseExteriorLines(EMPTY_HOUSE), "");
  assert.equal(describeHouse(EMPTY_HOUSE), "");
  const payload = buildGeneratePayload(DEFAULT_SETUP);
  assert.ok(!("house" in payload) && !("houseTour" in payload));
  assert.ok(!("sameHouse" in payload));
});

test("a profile writes every chosen item into the prompt lines and only those", () => {
  const lines = houseProfileLines({
    floor: houseFloors[0],
    wallColor: "",
    woodTone: "",
    metal: houseMetals[0],
    view: views[1] as string,
    palette: ["Olive", "Rust", "Gold", "Sage"],
  });

  assert.match(lines, /one single house/);
  assert.match(lines, /Flooring: light oak hardwood/);
  assert.match(lines, /Metal finishes: brushed brass/);
  assert.match(lines, /Window view: inner-city apartments/);
  assert.match(lines, /House palette: Olive, Rust, Gold, Sage/);
  assert.ok(!/Wall color|Wood tone/.test(lines));
  assert.match(houseExteriorLines({ ...EMPTY_HOUSE, palette: ["Olive", "Rust"] }), /Olive, Rust/);
  assert.equal(houseExteriorLines({ ...EMPTY_HOUSE, floor: houseFloors[0] }), "");
});

test("sanitizing keeps only known options, no repeats, and at most six palette colors", () => {
  const house = sanitizeHouse({
    floor: "lava",
    wallColor: "warm white",
    metal: houseMetals[2],
    view: "not a view",
    palette: [...housePaletteChoices, "Olive", "Neon"],
  });

  assert.equal(house.floor, "");
  assert.equal(house.wallColor, "warm white");
  assert.equal(house.metal, houseMetals[2]);
  assert.equal(house.view, "");
  assert.equal(house.palette.length, HOUSE_PALETTE_MAX);
  assert.equal(new Set(house.palette).size, house.palette.length);
  assert.deepEqual(sanitizeHouse(null), EMPTY_HOUSE);
  assert.deepEqual(sanitizeHouse("junk"), EMPTY_HOUSE);
});

test("the profile and tour are saved with a setup, default to off for older setups, and reach the payload only when set", () => {
  assert.deepEqual(DEFAULT_SETUP.house, EMPTY_HOUSE);
  assert.equal(DEFAULT_SETUP.houseTour, false);

  const { house: _h, houseTour: _t, ...older } = DEFAULT_SETUP;
  assert.deepEqual(sanitizeSetup(older).house, EMPTY_HOUSE);
  assert.equal(sanitizeSetup(older).houseTour, false);

  const setup = { ...DEFAULT_SETUP, house: { ...EMPTY_HOUSE, floor: houseFloors[1] as string }, houseTour: true };
  const roundTrip = sanitizeSetup(JSON.parse(JSON.stringify(setup)));
  assert.equal(roundTrip.house.floor, houseFloors[1]);
  assert.equal(roundTrip.houseTour, true);

  const payload = buildGeneratePayload(setup) as Record<string, unknown>;
  assert.equal((payload.house as { floor: string }).floor, houseFloors[1]);
  assert.equal(payload.houseTour, true);
  assert.equal(payload.sameHouse, true, "a tour is one house");
});

test("a house tour is two exteriors and the rest rooms, with the first exterior first and the second last", () => {
  assert.deepEqual(tourCounts(12), { interior: 10, exterior: 2 });
  assert.deepEqual(tourOrder(3), [3, 0, 1, 2, 4]);

  const run = ["room1", "room2", "room3", "extA", "extB"];
  assert.deepEqual(applyOrder(run, tourOrder(3)), ["extA", "room1", "room2", "room3", "extB"]);
});

test("tour exteriors are one house: the same facade, daytime first and dusk last", () => {
  const base = buildExteriorScenarios(2, resolveExteriorOptions(createEmptyExteriorOptions()), (() => {
    let n = 0;
    return () => ((n += 0.137) % 1);
  })());
  const [opening, closing] = tourExteriors(base);

  assert.equal(opening?.timeOfDay, TOUR_OPENING_LIGHT);
  assert.equal(closing?.timeOfDay, TOUR_CLOSING_LIGHT);
  assert.match(TOUR_CLOSING_LIGHT, /twilight/);
  assert.equal(opening?.facadeMaterial, closing?.facadeMaterial);
  assert.equal(opening?.homeStyle, closing?.homeStyle);
  assert.equal(opening?.landscaping, closing?.landscaping);
});

test("the manifest follows the tour order: the first exterior is image 1 and the dusk exterior is last", () => {
  const scenario = (room: string) => ({
    room,
    view: "v",
    colorProfile: "c",
    focalPoints: [],
    windowStyle: "w",
    wall: "wall",
    ceiling: "ceil",
    ceilingLight: "light",
    wallColorPalette: "p",
  });
  const exteriors = tourExteriors(buildExteriorScenarios(2, resolveExteriorOptions(createEmptyExteriorOptions()), () => 0.3));
  const manifest = buildPendingManifest({
    id: "tour",
    mode: "direct",
    settings: {},
    scenarios: [scenario("foyer"), scenario("living room"), scenario("kitchen")] as never,
    exteriors,
    order: tourOrder(3),
  });

  assert.deepEqual(manifest.images.map((image) => image.room), ["exterior", "foyer", "living room", "kitchen", "exterior"]);
  assert.deepEqual(manifest.images.map((image) => image.variation), [1, 2, 3, 4, 5]);
  assert.match(manifest.images[0]?.exterior?.timeOfDay ?? "", /midday/);
  assert.match(manifest.images[4]?.exterior?.timeOfDay ?? "", /twilight/);
  assert.equal(manifest.requestedImages, 5);

  const plain = buildPendingManifest({ id: "plain", mode: "direct", settings: {}, scenarios: [scenario("foyer")] as never });
  assert.deepEqual(plain.images.map((image) => image.variation), [1]);
});

test("the House tour quick set uses real rooms in tour order", () => {
  const set = QUICK_SETS.find((item) => item.id === "house-tour");

  assert.ok(set);
  assert.deepEqual(set?.rooms, TOUR_ROOMS);
  assert.ok(TOUR_ROOMS.every((room) => rooms.includes(room as (typeof rooms)[number])));
  assert.ok(resolveQuickSets(rooms).some((item) => item.id === "house-tour"));
  assert.equal(QUICK_SETS[0]?.id, "main-living", "the original quick sets keep their order");
});
