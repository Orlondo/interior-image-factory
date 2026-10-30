import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PromptScenario } from "./scenarioPlan";

/**
 * Each generation run is saved as one folder: output/batches/<id>/ with the images
 * (01.png, 02.png, ...) and a small batch.json describing them. Other tools, such as
 * the video studio, read this folder; nothing here depends on them.
 */

export const BATCH_MANIFEST_VERSION = 1;

export type BatchImageEntry = {
  /** Position in the original run (1-based), so gaps from failed images are visible. */
  variation: number;
  /** File name inside the batch folder, or null while pending or if it failed. */
  file: string | null;
  room: string;
  view: string;
  colorProfile: string;
  focalPoints: string[];
  windowStyle: string;
  wall: string;
  ceiling: string;
  ceilingLight: string;
  wallColorPalette: string;
  /** Set only for room angles: which room set (1-based), which angle of it (0 = the first), and its size. */
  set?: { number: number; angle: number; size: number };
};

export type BatchManifest = {
  version: number;
  id: string;
  createdAt: string;
  /** "pending" while an OpenAI batch is still running. */
  status: "pending" | "complete";
  mode: "direct" | "openai-batch";
  requestedImages: number;
  /** Images actually saved (0 while pending). */
  imageCount: number;
  settings: Record<string, string | number | boolean>;
  images: BatchImageEntry[];
};

export type SavedImage = {
  /** Index into the run's scenarios (0-based). */
  index: number;
  b64: string;
};

/** Keeps folder names safe: letters, digits, dash and underscore only. */
export function safeBatchId(id: string): string {
  const cleaned = id.replace(/[^A-Za-z0-9_-]/g, "");

  if (!cleaned) {
    throw new Error("Invalid batch id");
  }

  return cleaned;
}

export function imageFileName(position: number, total: number): string {
  const width = Math.max(2, String(total).length);
  return `${String(position).padStart(width, "0")}.png`;
}

export function buildPendingManifest(input: {
  id: string;
  createdAt?: Date;
  mode: BatchManifest["mode"];
  settings: BatchManifest["settings"];
  scenarios: PromptScenario[];
}): BatchManifest {
  return {
    version: BATCH_MANIFEST_VERSION,
    id: safeBatchId(input.id),
    createdAt: (input.createdAt ?? new Date()).toISOString(),
    status: "pending",
    mode: input.mode,
    requestedImages: input.scenarios.length,
    imageCount: 0,
    settings: input.settings,
    images: input.scenarios.map((scenario, index) => ({
      variation: index + 1,
      file: null,
      room: scenario.room,
      view: scenario.view,
      colorProfile: scenario.colorProfile,
      focalPoints: scenario.focalPoints,
      windowStyle: scenario.windowStyle,
      wall: scenario.wall,
      ceiling: scenario.ceiling,
      ceilingLight: scenario.ceilingLight,
      wallColorPalette: scenario.wallColorPalette,
      ...(scenario.set ? { set: scenario.set } : {}),
    })),
  };
}

/**
 * Marks the manifest complete. Only images that were really saved are kept, numbered
 * 01, 02, ... in run order. `savedIndexes` are scenario indexes in any order.
 */
export function completeManifest(
  pending: BatchManifest,
  savedIndexes: number[]
): BatchManifest {
  const sorted = [...new Set(savedIndexes)]
    .filter((index) => index >= 0 && index < pending.images.length)
    .sort((a, b) => a - b);

  return {
    ...pending,
    status: "complete",
    imageCount: sorted.length,
    images: sorted.map((scenarioIndex, position) => ({
      ...(pending.images[scenarioIndex] as BatchImageEntry),
      file: imageFileName(position + 1, sorted.length),
    })),
  };
}

export function batchFolder(outputDir: string, id: string): string {
  return path.join(outputDir, "batches", safeBatchId(id));
}

export async function writePendingManifest(outputDir: string, manifest: BatchManifest) {
  const folder = batchFolder(outputDir, manifest.id);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, "batch.json"), JSON.stringify(manifest, null, 2), "utf-8");
}

export async function readManifest(
  outputDir: string,
  id: string
): Promise<BatchManifest | null> {
  try {
    const text = await readFile(path.join(batchFolder(outputDir, id), "batch.json"), "utf-8");
    const parsed = JSON.parse(text) as BatchManifest;
    return parsed && Array.isArray(parsed.images) ? parsed : null;
  } catch {
    return null;
  }
}

/** Writes the images and the finished batch.json. Safe to run again for the same id. */
export async function writeCompletedBatch(
  outputDir: string,
  pending: BatchManifest,
  images: SavedImage[]
): Promise<BatchManifest> {
  const manifest = completeManifest(
    pending,
    images.map((image) => image.index)
  );
  const folder = batchFolder(outputDir, manifest.id);
  await mkdir(folder, { recursive: true });

  const byIndex = new Map(images.map((image) => [image.index, image.b64]));
  const savedIndexes = [...byIndex.keys()]
    .filter((index) => index >= 0 && index < pending.images.length)
    .sort((a, b) => a - b);

  await Promise.all(
    savedIndexes.map((scenarioIndex, position) =>
      writeFile(
        path.join(folder, imageFileName(position + 1, savedIndexes.length)),
        Buffer.from(byIndex.get(scenarioIndex) as string, "base64")
      )
    )
  );

  await writeFile(path.join(folder, "batch.json"), JSON.stringify(manifest, null, 2), "utf-8");

  return manifest;
}

/** For OpenAI batches submitted before manifests existed: images are saved without details. */
export function buildUnknownManifest(id: string, count: number): BatchManifest {
  const unknown = "unknown";

  return {
    version: BATCH_MANIFEST_VERSION,
    id: safeBatchId(id),
    createdAt: new Date().toISOString(),
    status: "pending",
    mode: "openai-batch",
    requestedImages: count,
    imageCount: 0,
    settings: {},
    images: Array.from({ length: count }, (_, index) => ({
      variation: index + 1,
      file: null,
      room: unknown,
      view: unknown,
      colorProfile: unknown,
      focalPoints: [],
      windowStyle: unknown,
      wall: unknown,
      ceiling: unknown,
      ceilingLight: unknown,
      wallColorPalette: unknown,
    })),
  };
}
