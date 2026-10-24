"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { useHideOnScroll } from "@/lib/useHideOnScroll";
import { useMediaQuery } from "@/lib/useMediaQuery";

type AppHeaderProps = {
  /** Controls shown on the right, such as Expand all and Collapse all. */
  actions?: ReactNode;
  /**
   * A second row under the title, pinned with it. On phones it slides away while you scroll down
   * and comes back when you scroll up, so it does not use up the screen.
   */
  secondRow?: ReactNode;
};

/** The page title, pinned to the top of the screen so it stays visible while you scroll. */
export function AppHeader({ actions, secondRow }: AppHeaderProps) {
  const isPhone = useMediaQuery("(max-width: 639px)");
  const rowRef = useRef<HTMLDivElement>(null);
  // Never hide the row while you are using it (typing a name, picking a setup).
  const isRowFocused = useCallback(() => rowRef.current?.contains(document.activeElement) ?? false, []);
  const isRowHidden = useHideOnScroll(isPhone, isRowFocused);

  // The header always keeps the same height in the page flow. Hiding the row slides it up behind the
  // title bar instead of shrinking the header, so the page below never jumps (and scroll anchoring
  // cannot mistake the shift for a scroll up). The header ignores clicks so the gap under the title
  // bar stays clickable, and only the bars themselves take them.
  return (
    <header className="pointer-events-none sticky top-0 z-30">
      <div className="pointer-events-auto relative z-10 border-b border-[#262B36] bg-[#0F1115]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0F1115]/80">
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
          {actions ? (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 [&_button]:px-1.5 [&_button]:text-xs sm:[&_button]:px-3 sm:[&_button]:text-sm">
              {actions}
            </div>
          ) : null}
        </div>
      </div>

      {secondRow ? (
        <div
          ref={rowRef}
          data-testid="header-second-row"
          data-hidden={isRowHidden}
          inert={isRowHidden}
          className={`relative z-0 border-b border-[#262B36] bg-[#0F1115]/90 backdrop-blur transition-[transform,opacity] duration-200 supports-[backdrop-filter]:bg-[#0F1115]/80 ${
            isRowHidden ? "pointer-events-none -translate-y-full opacity-0" : "pointer-events-auto translate-y-0 opacity-100"
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 py-1.5 sm:px-6 lg:px-10">{secondRow}</div>
        </div>
      ) : null}
    </header>
  );
}
