"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  selectedCount?: number;
  collapsedSummary?: string;
  isOpen?: boolean;
  onToggle?: () => void;
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  selectedCount,
  collapsedSummary,
  isOpen,
  onToggle,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = typeof isOpen === "boolean" ? isOpen : internalOpen;

  function handleToggle() {
    if (onToggle) {
      onToggle();
      return;
    }

    setInternalOpen((previous) => !previous);
  }

  return (
    <div className="rounded-[16px] border border-[#262B36] bg-[#171A21] p-4">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs text-[#98A2B3]" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
          <span className="text-sm font-semibold text-[#F5F7FA]">{title}</span>
        </div>

        {typeof selectedCount === "number" ? (
          <span className="shrink-0 text-xs text-[#98A2B3]">{selectedCount} selected</span>
        ) : !open && collapsedSummary ? (
          <span className="shrink-0 text-xs text-[#98A2B3]">{collapsedSummary}</span>
        ) : null}
      </button>

      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
