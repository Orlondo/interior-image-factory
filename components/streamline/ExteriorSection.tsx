"use client";

import { useState } from "react";
import { exteriorOptionGroups, effectivePhotoTypes } from "@/lib/exteriorCombinations";
import type { Setup } from "@/lib/setup";
import { OptionGroup } from "./OptionGroup";
import { SectionCard } from "./SectionCard";

type ExteriorSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

/** The exterior choices. Shown only when exterior photos are on; a group with nothing picked uses every option. */
export function ExteriorSection({ setup, update }: ExteriorSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!effectivePhotoTypes(setup.photoTypes).includes("exterior")) {
    return null;
  }

  const picked = exteriorOptionGroups.reduce((total, group) => total + setup.exterior[group.key].length, 0);

  return (
    <SectionCard
      id="exterior"
      title="Exterior"
      icon="details"
      isOpen={isOpen}
      onToggle={() => setIsOpen((previous) => !previous)}
      summary={picked === 0 ? "Every option, mixed across the photos" : `${picked} selections`}
    >
      <div className="space-y-2">
        <p className="text-xs text-[#98A2B3]">Nothing picked in a group means every option in it is used.</p>
        {exteriorOptionGroups.map((group) => (
          <OptionGroup
            key={group.key}
            legend={group.legend}
            allLabel={group.allLabel}
            options={group.options}
            selected={setup.exterior[group.key]}
            onChange={(next) => update({ exterior: { ...setup.exterior, [group.key]: next } })}
            surprise
          />
        ))}
      </div>
    </SectionCard>
  );
}
