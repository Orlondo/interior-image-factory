"use client";

export type ChipOption = {
  value: string;
  label: string;
};

type ChipGroupProps = {
  options: ChipOption[];
  selectedValues: string[];
  onToggleValue: (value: string) => void;
  multiSelect?: boolean;
  ariaLabel: string;
};

export function ChipGroup({
  options,
  selectedValues,
  onToggleValue,
  multiSelect = true,
  ariaLabel,
}: ChipGroupProps) {
  return (
    <div className="flex flex-wrap items-start gap-2" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = selectedValues.includes(option.value);
        const chipClass = selected
          ? "border-[#3A4252] bg-[#171A21] text-[#F5F7FA] hover:border-[#4F8CFF]/60"
          : "border-[#262B36] bg-[#171A21] text-[#F5F7FA] hover:bg-[#1D2230] hover:border-[#4F8CFF]/50";

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggleValue(option.value)}
            className={`max-w-full rounded-full border px-3 py-2 text-left text-sm font-medium transition whitespace-normal break-words ${chipClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]`}
          >
            {selected ? (
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#4F8CFF]"
              />
            ) : null}
            {option.label}
            {!multiSelect && selected ? " *" : ""}
          </button>
        );
      })}
    </div>
  );
}
