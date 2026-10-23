import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildPendingManifest,
  buildUnknownManifest,
  completeManifest,
  imageFileName,
  readManifest,
  safeBatchId,
  writeCompletedBatch,
  writePendingManifest,
} from "../lib/batchManifest";
import type { PromptScenario } from "../lib/scenarioPlan";

function scenario(room: string, n: number): PromptScenario {
  return {
    room: room as never,
    view: `view${n}`,
    colorProfile: `profile${n}`,
    focalPoints: [`focal${n}`],
    windowStyle: `window${n}`,
    wall: `wall${n}`,
    ceiling: `ceiling${n}`,
    ceilingLight: `light${n}`,
    wallColorPalette: `palette${n}`,
  };
}

const scenarios = [scenario("kitchen", 0), scenario("living room", 1), scenario("kitchen", 2), scenario("bedroom", 3)];
const png = Buffer.from("fake-png").toString("base64");

test("file names are zero padded and safe ids are cleaned", () => {
  assert.equal(imageFileName(1, 9), "01.png");
  assert.equal(imageFileName(7, 120), "007.png");
  assert.equal(safeBatchId("batch_abc-123"), "batch_abc-123");
  assert.equal(safeBatchId("../../etc/passwd"), "etcpasswd");
  assert.throws(() => safeBatchId("../.."));
});

test("pending manifest has one entry per scenario and no files yet", () => {
  const m = buildPendingManifest({ id: "run-1", mode: "direct", settings: { designStyle: "modern" }, scenarios });
  assert.equal(m.status, "pending");
  assert.equal(m.requestedImages, 4);
  assert.equal(m.imageCount, 0);
  assert.deepEqual(m.images.map((i) => i.file), [null, null, null, null]);
  assert.deepEqual(m.images.map((i) => i.room), ["kitchen", "living room", "kitchen", "bedroom"]);
});

test("completing keeps only saved images, numbered in run order", () => {
  const pending = buildPendingManifest({ id: "run-1", mode: "direct", settings: {}, scenarios });
  const done = completeManifest(pending, [3, 0, 2]);
  assert.equal(done.status, "complete");
  assert.equal(done.imageCount, 3);
  assert.deepEqual(done.images.map((i) => i.file), ["01.png", "02.png", "03.png"]);
  assert.deepEqual(done.images.map((i) => i.variation), [1, 3, 4]);
  assert.deepEqual(done.images.map((i) => i.room), ["kitchen", "kitchen", "bedroom"]);
  assert.deepEqual(completeManifest(pending, [9, -1]).images, []);
});

test("writing a batch creates the folder, numbered images and batch.json", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "iif-batch-"));
  const pending = buildPendingManifest({ id: "run-2", mode: "direct", settings: { designStyle: "modern" }, scenarios });
  await writeCompletedBatch(dir, pending, [
    { index: 2, b64: png },
    { index: 0, b64: png },
  ]);
  const files = (await readdir(path.join(dir, "batches", "run-2"))).sort();
  assert.deepEqual(files, ["01.png", "02.png", "batch.json"]);
  assert.equal((await readFile(path.join(dir, "batches", "run-2", "01.png"))).toString(), "fake-png");
  const saved = JSON.parse(await readFile(path.join(dir, "batches", "run-2", "batch.json"), "utf-8"));
  assert.equal(saved.imageCount, 2);
  assert.equal(saved.settings.designStyle, "modern");
  assert.equal(saved.images[1].room, "kitchen");
});

test("pending manifest round-trips from disk, and a missing one reads as null", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "iif-batch-"));
  const pending = buildPendingManifest({ id: "batch_xyz", mode: "openai-batch", settings: {}, scenarios });
  await writePendingManifest(dir, pending);
  const read = await readManifest(dir, "batch_xyz");
  assert.equal(read?.status, "pending");
  assert.equal(read?.images.length, 4);
  assert.equal(await readManifest(dir, "nope"), null);
});

test("older batches with no saved details still save their images", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "iif-batch-"));
  const unknown = buildUnknownManifest("batch_old", 3);
  const done = await writeCompletedBatch(dir, unknown, [{ index: 0, b64: png }, { index: 2, b64: png }]);
  assert.equal(done.imageCount, 2);
  assert.equal(done.images[0]?.room, "unknown");
});
