import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETUP, buildGeneratePayload, sanitizeSetup } from "../lib/setup";
import {
  ROOM_DETAILS,
  detailsForImage,
  roomDetailLines,
  sanitizeDetails,
  sanitizeDetailsPerImage,
} from "../lib/roomDetails";

test("nothing picked adds nothing", () => {
  assert.deepEqual(detailsForImage([], "kitchen", 0), []);
  assert.equal(roomDetailLines([]), "");
  assert.equal("details" in buildGeneratePayload(DEFAULT_SETUP), false);
});

test("details only apply to rooms they fit", () => {
  assert.deepEqual(detailsForImage(["Platform bed"], "kitchen", 0), []);
  assert.equal(detailsForImage(["Platform bed"], "bedroom", 0).length, 1);
  assert.equal(detailsForImage(["Wildflowers in glass vases"], "garage", 0).length, 1);
});

test("picked details cycle evenly across a room's images", () => {
  const picked = ["Subway tile backsplash", "Kitchen accessories", "Food staging"];
  const seen = new Set<string>();
  for (let slot = 0; slot < 3; slot += 1) detailsForImage(picked, "kitchen", slot, 1).forEach((t) => seen.add(t));
  assert.equal(seen.size, 3);
});

test("colors fill in and use the picked colors", () => {
  const [text] = detailsForImage(["Colored vases"], "living room", 0, 1, ["Teal"]);
  assert.ok(text?.includes("teal"));
  assert.ok(!text?.includes("{color}"));
  const [metal] = detailsForImage(["Metal faucet"], "kitchen", 0, 1);
  assert.ok(!metal?.includes("{metal}"));
});

test("sanitize drops unknown values", () => {
  assert.deepEqual(sanitizeDetails(["nope", "Floor mirror", "Floor mirror"]), ["Floor mirror"]);
  assert.equal(sanitizeDetailsPerImage(9), 2);
  assert.equal(new Set(ROOM_DETAILS.map((d) => d.id)).size, ROOM_DETAILS.length);
});

test("setup round trip and payload", () => {
  const setup = sanitizeSetup({ ...DEFAULT_SETUP, details: ["Chinese screen"], detailColors: [], detailsPerImage: 3 });
  assert.deepEqual(setup.details, ["Chinese screen"]);
  const payload = buildGeneratePayload(setup) as Record<string, unknown>;
  assert.deepEqual(payload.details, ["Chinese screen"]);
  assert.equal(payload.detailsPerImage, 3);
});
