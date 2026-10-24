"use client";

import type { ReactNode } from "react";

type AppHeaderProps = {
  /** Controls shown on the right, such as Expand all and Collapse all. */
  actions?: ReactNode;
};

/** The page title, pinned to the top of the screen so it stays visible while you scroll. */
export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#262B36] bg-[#0F1115]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0F1115]/80">
      <div className="mx-auto flex min-h-[56px] max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#4F8CFF]/15 text-[#4F8CFF] sm:inline-flex"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="M21 16l-5-5-8 8" />
            </svg>
          </span>
          <h1 className="min-w-0 truncate text-base font-semibold text-[#F5F7FA]">
            <span className="hidden sm:inline">Interior Image Factory</span>
            <span className="sm:hidden">Image Factory</span>
          </h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 [&_button]:px-1.5 [&_button]:text-xs sm:[&_button]:px-3 sm:[&_button]:text-sm">
            {actions}
          </div> : null}
      </div>
    </header>
  );
}
