import assert from "node:assert/strict";
import test from "node:test";

import {
  ceilingLights,
  colorProfiles,
  focalPoints,
  heroColors,
  rooms,
  styles,
  type RoomType,
} from "../lib/combinations";
import { buildPrompt } from "../lib/promptBuilder";
import { selectPalette } from "../lib/promptBuilder/colorPalette";
import { DEFAULT_SETUP } from "../lib/setup";

const NEW_ROOMS = ["sunroom", "garage", "staircase", "powder room", "home bar"];

function promptFor(
  room: RoomType,
  options: { style?: string; focal?: string[]; profiles?: string[]; lights?: string[]; hero?: (typeof heroColors)[number] } = {}
) {
  const s = DEFAULT_SETUP;
  return buildPrompt(
    room, s.roomSize, options.style ?? s.designStyle, s.colorMood, s.colorIntensity, s.colorStrategy,
    s.colorCoverage, options.hero ?? s.heroColor, false, 0, 12, s.homeQuality, "",
    options.profiles ?? [s.colorProfiles[0]], s.views[0], s.windowStyles.slice(0, 1),
    options.focal ?? [], [], [], options.lights ?? []
  );
}

test("the new rooms exist, are unique, and the first room and default color profile are unchanged", () => {
  for (const room of NEW_ROOMS) {
    assert.ok(rooms.includes(room as RoomType), room);
  }
  assert.equal(new Set(rooms).size, rooms.length);
  assert.equal(rooms[0], "living room");
  assert.equal(colorProfiles[0], "current balanced palette (default)");
  assert.ok(colorProfiles.includes("no fixed color palette (material-led)"));
});

test("every new room, style, color profile and lighting option builds a prompt", () => {
  for (const room of NEW_ROOMS) {
    assert.match(promptFor(room as RoomType), new RegExp(room));
  }
  assert.ok(styles.includes("wabi-sabi"));
  assert.match(promptFor("living room", { style: "wabi-sabi" }), /lime-wash or clay plaster/);
  assert.match(
    promptFor("living room", { profiles: ["no fixed color palette (material-led)"] }),
    /material-led and mood-driven/
  );
  for (const light of ceilingLights) {
    assert.ok(promptFor("living room", { lights: [light] }).includes(light), light);
  }
});

test("about 35 new focal points were added and none repeats", () => {
  assert.equal(new Set(focalPoints).size, focalPoints.length);
  assert.ok(focalPoints.length >= 45);
});

test("food and dinner focal points appear only in a dining room", () => {
  const food = focalPoints.filter((f) => /thanksgiving|dinner|food/i.test(f));
  assert.ok(food.length >= 2);

  for (const room of rooms) {
    const prompt = promptFor(room, { focal: food });
    for (const f of food) {
      assert.equal(prompt.includes(f), room === "dining room", `${room}: ${f}`);
    }
  }
});

test("curtain focal points never appear in a kitchen, but still do elsewhere", () => {
  const curtains = focalPoints.filter((f) => /curtain/i.test(f));
  assert.ok(curtains.length >= 3);

  for (const f of curtains) {
    assert.ok(!promptFor("kitchen", { focal: [f] }).includes(f), f);
    assert.ok(promptFor("bedroom", { focal: [f] }).includes(f), f);
  }
});

test("a focal point list that is filtered down to nothing falls back to the balanced composition", () => {
  const food = focalPoints.filter((f) => /dinner/i.test(f));
  assert.match(promptFor("bedroom", { focal: food }), /balanced composition with subtle design elements/);
});

test("Pink Mixed and Purple Mixed are hero colors that rotate through their own palettes", () => {
  for (const color of ["Pink Mixed", "Purple Mixed"] as const) {
    assert.ok(heroColors.includes(color));
    const names = new Set<string>();
    for (let imageIndex = 0; imageIndex < 8; imageIndex++) {
      const palette = selectPalette({
        colorMood: "Warm Neutral",
        colorStrategy: "Designer Layered",
        heroColor: color,
        imageIndex,
        autoPaletteVariation: true,
      });
      assert.equal(palette.family, color);
      names.add(palette.name);
    }
    assert.ok(names.size >= 3, color);
    assert.match(promptFor("living room", { hero: color }), new RegExp(color));
  }
});
