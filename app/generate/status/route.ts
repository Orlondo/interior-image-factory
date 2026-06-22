import { NextResponse } from "next/server";
import { fetchBatchStatus } from "@/lib/openaiBatch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const batch = await fetchBatchStatus(batchId);

    return NextResponse.json({
      batchId: batch.id,
      status: batch.status,
      requestCounts: batch.request_counts ?? null,
      outputFileId: batch.output_file_id ?? null,
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
        : "Failed to fetch batch status";

    return NextResponse.json({ error: message }, { status });
  }
}
