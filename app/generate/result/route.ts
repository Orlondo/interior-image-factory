import { NextResponse } from "next/server";
import path from "node:path";
import {
  buildUnknownManifest,
  readManifest,
  safeBatchId,
  writeCompletedBatch,
} from "@/lib/batchManifest";
import { fetchBatchStatus, fetchFileContent } from "@/lib/openaiBatch";

type ImageData = {
  b64_json?: string | null;
};

type ImagesResponse = {
  data?: ImageData[];
};

type BatchOutputLine = {
  custom_id?: string;
  response?: {
    status_code?: number;
    body?: {
      data?: ImageData[];
    };
  };
};

const OUTPUT_DIR = path.join(process.cwd(), "output");

function getCustomIdIndex(customId: string | undefined): number {
  if (!customId) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = customId.match(/^img-(\d+)$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Number(match[1]);

  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const batch = await fetchBatchStatus(batchId);

    if (batch.status !== "completed") {
      return NextResponse.json(
        {
          error: `Batch is not complete yet (status: ${batch.status})`,
          status: batch.status,
        },
        { status: 409 }
      );
    }

    if (!batch.output_file_id) {
      return NextResponse.json(
        { error: "Batch completed but output file is missing" },
        { status: 500 }
      );
    }

    const content = await fetchFileContent(batch.output_file_id);
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const entries = lines
      .map((line) => JSON.parse(line) as BatchOutputLine)
      .map((entry) => ({
        index: getCustomIdIndex(entry.custom_id),
        result:
          entry.response?.status_code === 200 && Array.isArray(entry.response.body?.data)
            ? ({ data: entry.response.body?.data } as ImagesResponse)
            : ({ data: [] } as ImagesResponse),
      }))
      .sort((left, right) => left.index - right.index);

    const parsedResults = entries.map((entry) => entry.result);

    // Use the details saved when the batch was submitted. Older batches have none.
    const batchFolderId = safeBatchId(batch.id);
    const savedManifest = await readManifest(OUTPUT_DIR, batchFolderId);
    const highestIndex = entries.reduce(
      (highest, entry) =>
        entry.index === Number.MAX_SAFE_INTEGER ? highest : Math.max(highest, entry.index),
      -1
    );
    const pending =
      savedManifest ?? buildUnknownManifest(batchFolderId, Math.max(highestIndex + 1, 0));

    // Fetching the same batch twice must not rewrite a finished folder.
    if (savedManifest?.status !== "complete") {
      await writeCompletedBatch(
        OUTPUT_DIR,
        pending,
        entries.flatMap((entry) => {
          const b64 = entry.result.data?.find((image) => image.b64_json)?.b64_json;
          return b64 && entry.index < pending.images.length ? [{ index: entry.index, b64 }] : [];
        })
      );
    }

    return NextResponse.json({
      batchId: batch.id,
      status: batch.status,
      results: parsedResults,
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;

    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Failed to fetch batch results";

    return NextResponse.json({ error: message }, { status });
  }
}
