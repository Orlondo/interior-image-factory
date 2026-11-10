"use client";

import { ChipGroup } from "@/components/ui-modernization";
import { effectivePhotoTypes, photoTypeCounts, photoTypes, type PhotoType } from "@/lib/exteriorCombinations";
import { evenSplit } from "@/lib/roomMix";
import type { Setup } from "@/lib/setup";

type PhotoTypesProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

const LABELS: Record<PhotoType, string> = {
  interior: "Interior rooms",
  exterior: "Exterior of the home",
};

/** Chooses what a run makes. At least one stays on, and the run's images are split evenly between them. */
export function PhotoTypes({ setup, update }: PhotoTypesProps) {
  const selected = effectivePhotoTypes(setup.photoTypes);
  const counts = photoTypeCounts(setup.maxImages, selected);

  function toggle(value: string) {
    const type = value as PhotoType;
    const next = selected.includes(type) ? selected.filter((item) => item !== type) : [...selected, type];

    if (next.length === 0) {
      return;
    }

    const photoTypesNext = photoTypes.filter((item) => next.includes(item));
    const interior = photoTypeCounts(setup.maxImages, photoTypesNext).interior;

    // The room counts are for the interior share, so a different share starts them over from an even split.
    update({
      photoTypes: photoTypesNext,
      ...(setup.roomSplitMode === "custom" && setup.rooms.length >= 2
        ? { roomCounts: evenSplit(setup.rooms, interior) }
        : {}),
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#98A2B3]">Photo types</p>
      <ChipGroup
        options={photoTypes.map((type) => ({ value: type, label: LABELS[type] }))}
        selectedValues={selected}
        onToggleValue={toggle}
        ariaLabel="Photo types"
      />
      {selected.length > 1 ? (
        <p className="text-xs text-[#98A2B3]">
          The images are split evenly: {counts.interior} interior and {counts.exterior} exterior. Choose the exterior
          details in the Exterior section.
        </p>
      ) : null}
    </div>
  );
}
