"use client";

import { INTENSITY_STEPS, getIntensityStepIndex } from "@/lib/looks";

type IntensityStepsProps = {
  intensity: number;
  onChange: (value: number) => void;
};

export function IntensitySteps({ intensity, onChange }: IntensityStepsProps) {
  const activeIndex = getIntensityStepIndex(intensity);
  const active = INTENSITY_STEPS[activeIndex];

  return (
    <div className="min-w-0">
      <span id="intensity-label" className="text-sm font-medium text-[#98A2B3]">
        Color intensity
      </span>
      <div
        role="radiogroup"
        aria-labelledby="intensity-label"
        className="mt-2 flex flex-wrap gap-2"
      >
        {INTENSITY_STEPS.map((step, index) => {
          const selected = index === activeIndex;

          return (
            <button
              key={step.label}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(step.value)}
              className={`min-h-[42px] rounded-[10px] border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] ${
                selected
                  ? "border-[#4F8CFF] bg-[#4F8CFF] text-[#F5F7FA]"
                  : "border-[#3A4252] bg-[#262B36] text-[#F5F7FA] hover:border-[#4F8CFF] hover:bg-[#2D3342]"
              }`}
            >
              {step.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[#98A2B3]">
        {active?.hint}. Intensity sets the strength of color; Coverage sets where it appears.
      </p>
    </div>
  );
}
