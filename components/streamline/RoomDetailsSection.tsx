"use client";

import { useState } from "react";
import { ChipGroup } from "@/components/ui-modernization";
import {
  DETAILS_PER_IMAGE_MAX,
  DETAIL_COLOR_CHOICES,
  DETAIL_GROUPS,
  describeDetails,
  detailsInGroup,
} from "@/lib/roomDetails";
import type { Setup } from "@/lib/setup";
import { SelectField } from "./fields";
import { SectionCard } from "./SectionCard";

type RoomDetailsSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

function toggle(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * Room details: optional extras (backsplash, bed style, vases, mirrors...) grouped like focal points.
 * Each applies only to rooms it fits, and several picks are spread evenly across the images.
 * Nothing picked changes nothing.
 */
export function RoomDetailsSection({ setup, update }: RoomDetailsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const summary = describeDetails(setup.details);

  return (
    <SectionCard
      id="room-details"
      title="Room details"
      icon="details"
      isOpen={isOpen}
      onToggle={() => setIsOpen((previous) => !previous)}
      summary={summary || "Optional: backsplash, bed style, vases, mirrors and more"}
    >
      <div className="space-y-4">
        <p className="text-xs text-[#98A2B3]">
          Pick any extras you want to see. Each one only appears in rooms it fits (a backsplash in kitchens, a bed
          style in bedrooms). With several picked, they are spread evenly across your images.
        </p>

        {DETAIL_GROUPS.map((group) => (
          <div key={group} className="space-y-2">
            <p className="text-sm font-medium text-[#98A2B3]">{group}</p>
            <ChipGroup
              options={detailsInGroup(group).map((detail) => ({ value: detail.id, label: detail.id }))}
              selectedValues={setup.details}
              onToggleValue={(id) => update({ details: toggle(setup.details, id) })}
              ariaLabel={group}
            />
          </div>
        ))}

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#98A2B3]">Colors for colored items (optional)</p>
          <ChipGroup
            options={DETAIL_COLOR_CHOICES.map((color) => ({ value: color, label: color }))}
            selectedValues={setup.detailColors}
            onToggleValue={(color) => update({ detailColors: toggle(setup.detailColors, color) })}
            ariaLabel="Detail colors"
          />
          <p className="text-xs text-[#98A2B3]">
            Used for colored countertops, faucets, vases and tables. Leave empty to vary the color by image.
          </p>
        </div>

        <SelectField
          label="Details per image"
          value={String(setup.detailsPerImage)}
          onChange={(value) => update({ detailsPerImage: Number(value) })}
        >
          {Array.from({ length: DETAILS_PER_IMAGE_MAX }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </SelectField>

        {setup.details.length > 0 ? (
          <button
            type="button"
            className="text-xs text-[#98A2B3] underline hover:text-[#F5F7FA]"
            onClick={() => update({ details: [], detailColors: [] })}
          >
            Clear room details
          </button>
        ) : null}
      </div>
    </SectionCard>
  );
}
