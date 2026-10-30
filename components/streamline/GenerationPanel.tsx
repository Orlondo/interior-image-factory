"use client";

import { useMemo, useState } from "react";
import { CollapsibleSection, SummaryCard } from "@/components/ui-modernization";
import { getIntensityStep } from "@/lib/looks";
import { buildPromptPreview, buildPromptPreviewColors } from "@/lib/promptPreview";
import { describeSplit, evenSplit } from "@/lib/roomMix";
import { describeSets, liveLimitMessage, planRoomSets } from "@/lib/roomSets";
import type { Setup } from "@/lib/setup";
import type { GenerationUiState } from "@/lib/useGeneration";
import { SectionCard } from "./SectionCard";

const GENERATION_STATE_LABELS: Record<GenerationUiState, string> = {
  idle: "Idle",
  preparing: "Preparing prompt",
  sending: "Sending request",
  generating: "Generating images",
  complete: "Complete",
  error: "Error",
  cancelled: "Cancelled",
};

type GenerationPanelProps = {
  setup: Setup;
  isGenerating: boolean;
  generationUiState: GenerationUiState;
  generationProgress: number | null;
  generationStatusMessage: string;
  canGenerate: boolean;
  onGenerate: () => void;
  onCancel: () => void;
};

export function GenerationPanel({
  setup,
  isGenerating,
  generationUiState,
  generationProgress,
  generationStatusMessage,
  canGenerate,
  onGenerate,
  onCancel,
}: GenerationPanelProps) {
  const [isPromptPreviewOpen, setIsPromptPreviewOpen] = useState(false);
  const promptPreview = useMemo(() => buildPromptPreview(setup), [setup]);
  const promptPreviewColorData = useMemo(() => buildPromptPreviewColors(setup), [setup]);
  const limitMessage = liveLimitMessage(setup.maxImages, setup.anglesPerRoom, setup.sameHouse);
  const setsLine = describeSets(
    planRoomSets(
      setup.rooms,
      setup.roomSplitMode === "custom" && setup.rooms.length >= 2
        ? setup.roomCounts
        : evenSplit(setup.rooms, setup.maxImages),
      setup.anglesPerRoom
    ),
    setup.anglesPerRoom,
    setup.sameHouse
  );
  const intensityStep = getIntensityStep(setup.colorIntensity);
  const summaryColorIntensity = `${intensityStep.label} (${setup.colorIntensity})`;

  const generationIndicatorVisible =
    generationUiState !== "idle" &&
    (isGenerating ||
      generationUiState === "complete" ||
      generationUiState === "error" ||
      generationUiState === "cancelled");

  const generationIndicatorTone =
    generationUiState === "error"
      ? "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#FCA5A5]"
      : generationUiState === "cancelled"
        ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D]"
        : generationUiState === "complete"
          ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#86EFAC]"
          : "border-[#262B36] bg-[#1D2230] text-[#F5F7FA]";

  return (
    <SectionCard id="generate" title="Generate" icon="generate">
      <SummaryCard
        title="Generation Summary"
        lines={[
          `${setup.designStyle} ${setup.homeQuality}${setup.condition === "pristine" ? "" : ` ${setup.condition}`} ${setup.rooms[0] ?? "living room"}${setup.camera === "standard" ? "" : `, ${setup.camera} angles`}`,
          `${setup.aspectRatio} ${setup.aspectRatio === "16:9" ? "landscape" : "format"}`,
          setup.rooms.length >= 2
            ? `${setup.maxImages} images: ${describeSplit(
                setup.rooms,
                setup.roomSplitMode === "custom"
                  ? setup.roomCounts
                  : evenSplit(setup.rooms, setup.maxImages)
              )}`
            : `${setup.maxImages} images`,
          ...(setsLine ? [setsLine] : []),
          `${setup.colorCoverage} coverage, intensity ${summaryColorIntensity}`,
        ]}
      />

      {generationIndicatorVisible ? (
        <div className={`mt-3 rounded-[16px] border p-4 ${generationIndicatorTone}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {GENERATION_STATE_LABELS[generationUiState]}
            </p>
            {isGenerating ? (
              <span className="text-xs font-medium text-[#98A2B3]">
                Cancel is available while generation is active
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm text-[#98A2B3]">{generationStatusMessage}</p>

          {isGenerating ? (
            generationProgress !== null ? (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-[#0F1115]">
                  <div
                    className="h-full rounded-full bg-[#4F8CFF] transition-[width] duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#98A2B3]">{generationProgress}% complete</p>
              </div>
            ) : (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0F1115]">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#4F8CFF]" />
              </div>
            )
          ) : null}
        </div>
      ) : null}

      <div className="mt-3">
        <CollapsibleSection
          title="Prompt Preview"
          collapsedSummary={`${setup.colorCoverage}, ${summaryColorIntensity}`}
          isOpen={isPromptPreviewOpen}
          onToggle={() => setIsPromptPreviewOpen((previous) => !previous)}
        >
          <div className="mb-3 rounded-[16px] border border-[#262B36] bg-[#0F1115] p-4 text-xs leading-5 text-[#D6DAE3]">
            <p className="text-sm font-semibold text-[#F5F7FA]">
              Variation {promptPreviewColorData.variationNumber}/{promptPreviewColorData.variationTotal}
            </p>
            <p className="mt-2">Selected Palette Family: {promptPreviewColorData.paletteFamily}</p>
            <p>Selected Palette: {promptPreviewColorData.selectedPalette}</p>
            <p>Strategy: {promptPreviewColorData.colorStrategy}</p>
            <p>Coverage: {promptPreviewColorData.colorCoverage}</p>
            <p>Intensity: {promptPreviewColorData.colorIntensity}</p>
            <p>Primary: {promptPreviewColorData.primary}</p>
            <p>Secondary: {promptPreviewColorData.secondary}</p>
            <p>Complementary Accent: {promptPreviewColorData.complementaryAccent}</p>
            <p>Neutral: {promptPreviewColorData.neutralGrounding}</p>
            <p>Wood Tone: {promptPreviewColorData.woodTone}</p>
            <p>Metal Finish: {promptPreviewColorData.metalFinish}</p>
          </div>
          <pre className="max-h-[340px] overflow-auto rounded-[16px] border border-[#262B36] bg-[#0F1115] p-4 text-xs leading-5 text-[#D6DAE3] whitespace-pre-wrap">
            {promptPreview}
          </pre>
        </CollapsibleSection>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className="h-[42px] w-full rounded-[10px] border border-[#4F8CFF] bg-[#4F8CFF] px-4 py-2 text-sm font-semibold text-[#F5F7FA] transition hover:bg-[#3E79EB] disabled:opacity-50 sm:w-auto"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        <button
          onClick={onCancel}
          disabled={!isGenerating}
          className="h-[42px] w-full rounded-[10px] border border-[#EF4444] bg-transparent px-4 py-2 text-sm font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/10 disabled:opacity-50 sm:w-auto"
        >
          Cancel
        </button>

        {!canGenerate ? (
          <p role="status" className="text-sm text-[#FCD34D]">
            {limitMessage ?? `Images per room must add up to ${setup.maxImages} before you can generate.`}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}
