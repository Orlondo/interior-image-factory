"use client";

import { useRef, useState } from "react";
import { buildGeneratePayload, type Setup } from "./setup";

export type GeneratedImage = {
  b64_json?: string | null;
};

export type GenerationUiState =
  | "idle"
  | "preparing"
  | "sending"
  | "generating"
  | "complete"
  | "error"
  | "cancelled";

type GenerateResponse = Array<{
  data?: GeneratedImage[];
}>;

type BatchSubmitResponse = {
  mode: "batch";
  batchId: string;
  status: string;
};

type BatchStatusResponse = {
  batchId: string;
  status: string;
  requestCounts?: {
    total?: number;
    completed?: number;
    failed?: number;
  } | null;
};

type BatchResultResponse = {
  batchId: string;
  status: string;
  results: GenerateResponse;
};

type ErrorResponse = {
  error?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useGeneration() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationUiState, setGenerationUiState] = useState<GenerationUiState>("idle");
  const [generationProgress, setGenerationProgress] = useState<number | null>(null);
  const [generationStatusMessage, setGenerationStatusMessage] = useState("");
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const cancelRequestedRef = useRef(false);
  const activeBatchIdRef = useRef<string | null>(null);

  async function generate(setup: Setup) {
    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    cancelRequestedRef.current = false;
    activeBatchIdRef.current = null;
    setIsGenerating(true);
    setGenerationUiState("preparing");
    setGenerationProgress(null);
    setGenerationStatusMessage("Preparing prompt...");

    try {
      setGenerationUiState("sending");
      setGenerationStatusMessage("Sending request...");

      const response = await fetch("/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildGeneratePayload(setup)),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") ?? "";
      const rawBody = await response.text();

      let payload: unknown = null;

      if (contentType.includes("application/json")) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = null;
        }
      }

      if (!contentType.includes("application/json")) {
        console.error("/generate returned non-JSON response", {
          status: response.status,
          contentType,
          bodyPreview: rawBody.slice(0, 300),
        });
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage("Image generation failed.");
        setImages([]);
        return;
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Image generation failed";

        console.error(message);
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage(message);
        setImages([]);
        return;
      }

      if (Array.isArray(payload)) {
        const data: GenerateResponse = payload;
        setGenerationUiState("generating");
        setGenerationProgress(null);
        setGenerationStatusMessage("Generating images...");
        setImages(data.flatMap((item) => item.data ?? []));
        setGenerationUiState("complete");
        setGenerationStatusMessage(`Generated ${data.length} image responses.`);
        return;
      }

      const batchSubmit =
        typeof payload === "object" &&
        payload !== null &&
        "mode" in payload &&
        (payload as { mode?: unknown }).mode === "batch" &&
        "batchId" in payload &&
        typeof (payload as { batchId?: unknown }).batchId === "string"
          ? (payload as BatchSubmitResponse)
          : null;

      if (!batchSubmit) {
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage("Unexpected response from /generate.");
        setImages([]);
        return;
      }

      activeBatchIdRef.current = batchSubmit.batchId;

      setGenerationUiState("generating");
      setGenerationProgress(null);
      setGenerationStatusMessage(`Generating images. Batch ${batchSubmit.batchId} submitted.`);

      while (true) {
        if (cancelRequestedRef.current) {
          throw new Error("Generation cancelled by user");
        }

        await sleep(5000);

        if (cancelRequestedRef.current) {
          throw new Error("Generation cancelled by user");
        }

        const statusResponse = await fetch(
          `/generate/status?batchId=${encodeURIComponent(batchSubmit.batchId)}`,
          { signal: controller.signal }
        );

        const statusPayload = (await statusResponse.json()) as
          | BatchStatusResponse
          | ErrorResponse;

        if (!statusResponse.ok) {
          const errorMessage =
            typeof statusPayload === "object" &&
            statusPayload !== null &&
            "error" in statusPayload &&
            typeof (statusPayload as { error?: unknown }).error === "string"
              ? (statusPayload as { error: string }).error
              : "Failed to check batch status";

          throw new Error(errorMessage);
        }

        if (!("batchId" in statusPayload) || !("status" in statusPayload)) {
          throw new Error("Invalid batch status response");
        }

        const requestCounts = statusPayload.requestCounts ?? null;

        if (requestCounts?.total) {
          const completed = requestCounts.completed ?? 0;
          const failed = requestCounts.failed ?? 0;
          const processed = completed + failed;

          setGenerationProgress(
            Math.max(0, Math.min(100, Math.round((processed / requestCounts.total) * 100)))
          );

          setGenerationStatusMessage(
            `Generating images... ${processed} of ${requestCounts.total} batch requests finished.`
          );
        } else {
          setGenerationProgress(null);
          setGenerationStatusMessage("Generating images...");
        }

        if (statusPayload.status === "completed") {
          break;
        }

        if (
          statusPayload.status === "failed" ||
          statusPayload.status === "expired" ||
          statusPayload.status === "cancelled"
        ) {
          throw new Error(`Batch ended with status: ${statusPayload.status}`);
        }
      }

      const resultResponse = await fetch(
        `/generate/result?batchId=${encodeURIComponent(batchSubmit.batchId)}`,
        { signal: controller.signal }
      );

      const resultPayload = (await resultResponse.json()) as
        | BatchResultResponse
        | ErrorResponse;

      if (!resultResponse.ok) {
        const errorMessage =
          typeof resultPayload === "object" &&
          resultPayload !== null &&
          "error" in resultPayload &&
          typeof (resultPayload as { error?: unknown }).error === "string"
            ? (resultPayload as { error: string }).error
            : "Failed to fetch batch results";

        throw new Error(errorMessage);
      }

      if (!("results" in resultPayload) || !Array.isArray(resultPayload.results)) {
        throw new Error("Invalid batch result response");
      }

      const flattened = resultPayload.results.flatMap((item: { data?: GeneratedImage[] }) => item.data ?? []);
      setImages(flattened);
      setGenerationUiState("complete");
      setGenerationProgress(100);
      setGenerationStatusMessage(`Batch complete: ${flattened.length} images loaded.`);
    } catch (error) {
      const wasAborted =
        (error instanceof DOMException && error.name === "AbortError") ||
        cancelRequestedRef.current;

      if (wasAborted) {
        setGenerationUiState("cancelled");
        setGenerationProgress(null);
        setGenerationStatusMessage("Generation cancelled.");
      } else {
        console.error("Request failed:", error);
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage(
          error instanceof Error ? error.message : "Request failed"
        );
        setImages([]);
      }
    } finally {
      setIsGenerating(false);
      activeRequestControllerRef.current = null;
      activeBatchIdRef.current = null;
      cancelRequestedRef.current = false;
    }
  }

  async function cancelGeneration() {
    if (!isGenerating) {
      return;
    }

    cancelRequestedRef.current = true;
    setGenerationStatusMessage("Cancelling generation...");

    activeRequestControllerRef.current?.abort();

    const batchId = activeBatchIdRef.current;

    if (!batchId) {
      return;
    }

    try {
      await fetch("/generate/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchId }),
      });
    } catch (error) {
      console.error("Failed to cancel batch job:", error);
    }
  }

  return {
    images,
    isGenerating,
    generationUiState,
    generationProgress,
    generationStatusMessage,
    generate,
    cancelGeneration,
  };
}
