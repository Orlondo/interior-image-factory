import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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

    const parsedResults = lines
      .map((line) => JSON.parse(line) as BatchOutputLine)
      .map((entry) => ({
        index: getCustomIdIndex(entry.custom_id),
        result:
          entry.response?.status_code === 200 && Array.isArray(entry.response.body?.data)
            ? ({ data: entry.response.body?.data } as ImagesResponse)
            : ({ data: [] } as ImagesResponse),
      }))
      .sort((left, right) => left.index - right.index)
      .map((entry) => entry.result);

    await mkdir(OUTPUT_DIR, { recursive: true });

    const runId = Date.now();

    await Promise.all(
      parsedResults.flatMap((result, resultIndex) =>
        (result.data ?? []).flatMap((image, imageIndex) => {
          if (!image.b64_json) {
            return [];
          }

          const fileName = `generated-${runId}-${resultIndex}-${imageIndex}.png`;
          const filePath = path.join(OUTPUT_DIR, fileName);

          return [writeFile(filePath, Buffer.from(image.b64_json, "base64"))];
        })
      )
    );

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
