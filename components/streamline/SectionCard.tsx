"use client";

import type { ReactNode } from "react";
import { SectionIcon, type SectionIconName } from "./icons";

/** Muted tints, one per section, so long pages are easier to scan. The blue accent stays reserved. */
export const SECTION_TINTS: Record<SectionIconName, string> = {
  setups: "#8B9BB8",
  room: "#C9A66B",
  look: "#A08CD6",
  details: "#5FB3A8",
  output: "#8DB078",
  generate: "#4F8CFF",
};

type SectionCardProps = {
  id: string;
  title: string;
  icon: SectionIconName;
  children: ReactNode;
  /** Present for collapsible sections. Omit for sections that are always open. */
  isOpen?: boolean;
  onToggle?: () => void;
  /** One line shown beside the title while the section is collapsed. */
  summary?: string;
};

export function SectionCard({
  id,
  title,
  icon,
  children,
  isOpen = true,
  onToggle,
  summary,
}: SectionCardProps) {
  const tint = SECTION_TINTS[icon];
  const collapsible = typeof onToggle === "function";
  const bodyId = `${id}-body`;
  const summaryId = `${id}-summary`;

  const badge = (
    <span
      aria-hidden="true"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
      style={{ backgroundColor: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint }}
    >
      <SectionIcon name={icon} />
    </span>
  );

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="rounded-[20px] border border-l-[3px] border-[#262B36] bg-[#171A21]"
      style={{ borderLeftColor: tint }}
    >
      <h2 id={`${id}-heading`} className="text-base font-semibold text-[#F5F7FA]">
        {collapsible ? (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={bodyId}
            aria-label={title}
            aria-describedby={!isOpen && summary ? summaryId : undefined}
            onClick={onToggle}
            className="flex w-full items-center gap-3 rounded-[20px] px-4 py-4 text-left transition hover:bg-[#1D2230] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] sm:px-5"
          >
            {badge}
            <span className="shrink-0">{title}</span>
            {!isOpen && summary ? (
              <span
                id={summaryId}
                className="min-w-0 flex-1 truncate text-xs font-normal text-[#98A2B3]"
              >
                {summary}
              </span>
            ) : (
              <span className="flex-1" />
            )}
            <span aria-hidden="true" className="shrink-0 text-xs text-[#98A2B3]">
              {isOpen ? "▾" : "▸"}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
            {badge}
            <span>{title}</span>
          </div>
        )}
      </h2>

      {isOpen ? (
        <div id={bodyId} className="px-4 pb-4 sm:px-5 sm:pb-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}
