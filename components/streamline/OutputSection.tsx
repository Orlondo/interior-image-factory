"use client";

import { describeBatch, countCombinations } from "@/lib/batch";
import { rescaleCounts } from "@/lib/roomMix";
import {
  MAX_IMAGE_CHOICES,
  type AspectRatioOption,
  type FileSizeOption,
  type Setup,
} from "@/lib/setup";
import { SelectField } from "./fields";
import { SectionCard } from "./SectionCard";

type OutputSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
  isOpen: boolean;
  onToggle: () => void;
};

export function OutputSection({ setup, update, isOpen, onToggle }: OutputSectionProps) {
  const batch = describeBatch(countCombinations(setup), setup.maxImages);

  return (
    <SectionCard
      id="output"
      title="Output"
      icon="output"
      isOpen={isOpen}
      onToggle={onToggle}
      summary={`${setup.aspectRatio} · ${setup.maxImages} images · ${setup.fileSize} files`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
        <SelectField
          label="Aspect ratio"
          value={setup.aspectRatio}
          onChange={(value) => update({ aspectRatio: value as AspectRatioOption })}
        >
          <option value="1:1">1:1 (Instagram Post)</option>
          <option value="4:5">4:5 (Instagram Portrait)</option>
          <option value="9:16">9:16 (Story / Reels)</option>
          <option value="16:9">16:9 (Landscape / YouTube)</option>
        </SelectField>

        <SelectField
          label="Max images"
          value={setup.maxImages}
          onChange={(value) => {
            const maxImages = Number(value);
            update(
              setup.roomSplitMode === "custom"
                ? { maxImages, roomCounts: rescaleCounts(setup.rooms, setup.roomCounts, maxImages) }
                : { maxImages }
            );
          }}
        >
          {MAX_IMAGE_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="File size"
          value={setup.fileSize}
          onChange={(value) => update({ fileSize: value as FileSizeOption })}
        >
          <option value="small">Small (lower resolution)</option>
          <option value="medium">Medium (balanced resolution)</option>
          <option value="large">Large (high resolution)</option>
        </SelectField>
      </div>

      <p role="status" className="mt-3 text-sm text-[#98A2B3]">
        {batch.message}
      </p>
    </SectionCard>
  );
}
