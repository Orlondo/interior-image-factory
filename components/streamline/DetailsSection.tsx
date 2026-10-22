"use client";

import { CollapsibleSection } from "@/components/ui-modernization";
import {
  ceilingLights,
  ceilings,
  focalPoints,
  views,
  walls,
  windowStyles,
} from "@/lib/combinations";
import type { Setup } from "@/lib/setup";
import { OptionGroup } from "./OptionGroup";

type GroupKey = "walls" | "windowStyles" | "ceilings" | "ceilingLights" | "focalPoints" | "views";

const GROUPS: Array<{
  key: GroupKey;
  legend: string;
  allLabel: string;
  options: readonly string[];
}> = [
  { key: "walls", legend: "Wall type", allLabel: "All wall types", options: walls },
  { key: "windowStyles", legend: "Window style", allLabel: "All window styles", options: windowStyles },
  { key: "ceilings", legend: "Ceiling type", allLabel: "All ceiling types", options: ceilings },
  { key: "ceilingLights", legend: "Ceiling lights", allLabel: "All ceiling lights", options: ceilingLights },
  { key: "focalPoints", legend: "Focal points", allLabel: "All focal points", options: focalPoints },
  { key: "views", legend: "Outside view", allLabel: "All outside views", options: views },
];

type DetailsSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
  isOpen: boolean;
  onToggle: () => void;
};

export function DetailsSection({ setup, update, isOpen, onToggle }: DetailsSectionProps) {
  const customizationCount = GROUPS.reduce((total, group) => total + setup[group.key].length, 0);

  return (
    <section className="w-full" aria-label="Details">
      <CollapsibleSection
        title="Details"
        collapsedSummary={`${customizationCount} selections: walls, windows, ceilings, lights, focal points, view`}
        isOpen={isOpen}
        onToggle={onToggle}
      >
        <div className="space-y-2">
          {GROUPS.map((group) => (
            <OptionGroup
              key={group.key}
              legend={group.legend}
              allLabel={group.allLabel}
              options={group.options}
              selected={setup[group.key]}
              onChange={(next) => update({ [group.key]: next } as Partial<Setup>)}
              surprise
            />
          ))}
        </div>
      </CollapsibleSection>
    </section>
  );
}
