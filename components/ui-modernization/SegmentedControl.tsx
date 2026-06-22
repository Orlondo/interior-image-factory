"use client";

export type SegmentedOption = {
  value: string;
  label: string;
};

type SegmentedControlProps = {
  options: SegmentedOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

export function SegmentedControl({
  options,
  selectedValue,
  onChange,
  ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-[16px] border border-[#262B36] bg-[#171A21] p-1"
    >
      {options.map((option) => {
        const selected = option.value === selectedValue;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              selected
                ? "bg-[#4F8CFF] text-[#F5F7FA]"
                : "bg-transparent text-[#F5F7FA] hover:bg-[#1D2230]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
