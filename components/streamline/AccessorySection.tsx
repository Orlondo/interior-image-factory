"use client";

import { useState } from "react";
import { accessoryOptionGroups } from "@/lib/accessoryCombinations";
import { effectivePhotoTypes } from "@/lib/exteriorCombinations";
import type { Setup } from "@/lib/setup";
import { OptionGroup } from "./OptionGroup";
import { SectionCard } from "./SectionCard";

type AccessorySectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

/** The accessory close-up choices. Shown only when accessory photos are on; a group with nothing picked uses every option. */
export function AccessorySection({ setup, update }: AccessorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!effectivePhotoTypes(setup.photoTypes).includes("accessory")) {
    return null;
  }

  const picked = accessoryOptionGroups.reduce((total, group) => total + setup.accessory[group.key].length, 0);

  return (
    <SectionCard
      id="accessory"
      title="Accessory close-ups"
      icon="details"
      isOpen={isOpen}
      onToggle={() => setIsOpen((previous) => !previous)}
      summary={picked === 0 ? "Every option, mixed across the photos" : `${picked} selections`}
    >
      <div className="space-y-2">
        <p className="text-xs text-[#98A2B3]">Nothing picked in a group means every option in it is used.</p>
        {accessoryOptionGroups.map((group) => (
          <OptionGroup
            key={group.key}
            legend={group.legend}
            allLabel={group.allLabel}
            options={group.options}
            selected={setup.accessory[group.key]}
            onChange={(next) => update({ accessory: { ...setup.accessory, [group.key]: next } })}
            surprise
          />
        ))}
      </div>
    </SectionCard>
  );
}
