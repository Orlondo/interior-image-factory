"use client";

import { ChipGroup, CollapsibleSection } from "@/components/ui-modernization";
import { pickRandomSubset } from "@/lib/batch";
import { setAll, toggleValue } from "@/lib/selection";
import { SECONDARY_BUTTON_CLASS } from "./fields";

const ALL_VALUE = "__all__";

type OptionGroupProps = {
  legend: string;
  allLabel: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Show a per-group "Surprise me" button. */
  surprise?: boolean;
  /** Render the chips directly, without the collapsible wrapper. */
  bare?: boolean;
};

export function OptionGroup({
  legend,
  allLabel,
  options,
  selected,
  onChange,
  surprise = false,
  bare = false,
}: OptionGroupProps) {
  const allSelected = selected.length === options.length;
  const chipOptions = [
    { value: ALL_VALUE, label: allLabel },
    ...options.map((option) => ({ value: option, label: option })),
  ];

  function handleToggle(value: string) {
    onChange(value === ALL_VALUE ? setAll(options, !allSelected) : toggleValue(selected, value));
  }

  const chips = (
    <div className="space-y-3">
      {surprise ? (
        <button
          type="button"
          className={SECONDARY_BUTTON_CLASS}
          onClick={() => onChange(pickRandomSubset(options))}
        >
          Surprise me
        </button>
      ) : null}
      <ChipGroup
        options={chipOptions}
        selectedValues={allSelected ? [ALL_VALUE, ...selected] : selected}
        onToggleValue={handleToggle}
        ariaLabel={legend}
      />
    </div>
  );

  if (bare) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#98A2B3]">{legend}</p>
        {chips}
      </div>
    );
  }

  return (
    <CollapsibleSection title={legend} selectedCount={selected.length}>
      {chips}
    </CollapsibleSection>
  );
}
