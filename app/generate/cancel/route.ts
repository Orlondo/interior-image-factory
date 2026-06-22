import { NextResponse } from "next/server";
import { cancelBatchJob } from "@/lib/openaiBatch";

export async function POST(request: Request) {
 try {
    const body = (await request.json()) as { batchId?: unknown };
    const batchId = typeof body.batchId === "string" ? body.batchId.trim() : "";

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }
 
    const batch = await cancelBatchJob(batchId);

    return NextResponse.json({
      batchId: batch.id,
      status: batch.status,
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
        : "Failed to cancel batch";

    return NextResponse.json({ error: message }, { status });
  }
}
