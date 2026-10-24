"use client";

import { useEffect, useRef } from "react";
import { INTENSITY_STEPS, getIntensityStepIndex } from "@/lib/looks";

type IntensityStepsProps = {
  intensity: number;
  onChange: (value: number) => void;
};

export function IntensitySteps({ intensity, onChange }: IntensityStepsProps) {
  const activeIndex = getIntensityStepIndex(intensity);
  const active = INTENSITY_STEPS[activeIndex];
  const groupRef = useRef<HTMLDivElement>(null);

  // On phones the strip scrolls sideways; keep the chosen step in view.
  useEffect(() => {
    const group = groupRef.current;
    const el = group?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!group || !el) return;
    const left = el.offsetLeft - (group.clientWidth - el.offsetWidth) / 2;
    group.scrollTo({ left: Math.max(0, left) });
  }, [activeIndex]);

  return (
    <div className="min-w-0">
      <span id="intensity-label" className="text-sm font-medium text-[#98A2B3]">
        Color intensity
      </span>
      <div
        role="radiogroup"
        aria-labelledby="intensity-label"
        ref={groupRef}
        className="relative mt-2 flex w-full overflow-x-auto rounded-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              className={`min-h-[42px] shrink-0 flex-1 whitespace-nowrap border px-3 py-2 text-sm font-medium transition first:rounded-l-[10px] last:rounded-r-[10px] focus:outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[#4F8CFF] ${
                index > 0 ? "-ml-px" : ""
              } ${
                selected
                  ? "relative z-10 border-[#4F8CFF] bg-[#4F8CFF] text-[#F5F7FA]"
                  : "border-[#3A4252] bg-[#262B36] text-[#F5F7FA] hover:z-10 hover:border-[#4F8CFF] hover:bg-[#2D3342]"
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
