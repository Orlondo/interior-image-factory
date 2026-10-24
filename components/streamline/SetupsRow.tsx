"use client";

import { useEffect, useRef, useState } from "react";
import { validateName, type SavedSetup } from "@/lib/savedItems";

type SetupsRowProps = {
  savedSetups: SavedSetup[];
  /** Returns an error message, or null when saved. */
  onSave: (name: string) => string | null;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
};

const FIELD =
  "h-10 min-w-0 sm:h-9 rounded-[10px] border border-[#4F8CFF]/50 bg-[#0F1115] px-3 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] disabled:cursor-not-allowed disabled:opacity-50";
const BUTTON =
  "h-10 shrink-0 sm:h-9 rounded-[10px] border px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] disabled:cursor-not-allowed disabled:opacity-40";
const PRIMARY = `${BUTTON} border-[#4F8CFF]/60 bg-[#4F8CFF]/20 text-[#9DBFFF] hover:border-[#4F8CFF] hover:bg-[#4F8CFF]/30`;
const SECONDARY = `${BUTTON} border-[#3A4252] bg-[#262B36] text-[#F5F7FA] hover:border-[#4F8CFF] hover:bg-[#2D3342]`;

/**
 * Saved setups as a row in the pinned header: pick one and Apply it, save the current page under a
 * name, or open the menu to delete one or reset the page. A setup applies to the whole page, so it
 * sits with the page controls instead of inside one section.
 */
export function SetupsRow({ savedSetups, onSave, onApply, onDelete, onReset }: SetupsRowProps) {
  const [mode, setMode] = useState<"browse" | "save">("browse");
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSelection = savedSetups.some((item) => item.id === selectedId);
  const count = savedSetups.length;

  function say(text: string) {
    setStatus(text);

    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => setStatus(null), 3000);
  }

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  function handleSave() {
    const problem =
      validateName(newName, savedSetups.map((item) => item.name)) ?? onSave(newName);

    if (problem) {
      say(problem);
      return;
    }

    setNewName("");
    setMode("browse");
    say("Setup saved.");
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5 sm:gap-2">
      <span
        className="flex h-10 shrink-0 items-center sm:h-9 gap-1.5 text-sm font-semibold text-[#9DBFFF]"
        title="Saved setups"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
        <span className="hidden sm:inline">Setups</span>
        <span
          aria-label={`${count} saved`}
          className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
            count > 0 ? "bg-[#4F8CFF] text-[#0F1115]" : "bg-[#3A4252] text-[#98A2B3]"
          }`}
        >
          {count}
        </span>
      </span>

      {mode === "browse" ? (
        <>
          <select
            aria-label="Choose a saved setup"
            className={`${FIELD} flex-1 sm:max-w-sm`}
            disabled={count === 0}
            value={hasSelection ? selectedId : ""}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            <option value="">{count === 0 ? "No saved setups yet" : "Choose a saved setup"}</option>
            {savedSetups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={PRIMARY}
            disabled={!hasSelection}
            onClick={() => {
              onApply(selectedId);
              say("Setup applied.");
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className={SECONDARY}
            onClick={() => {
              setMode("save");
              setIsMenuOpen(false);
            }}
          >
            <span className="sm:hidden">Save…</span>
            <span className="hidden sm:inline">Save current…</span>
          </button>
          <button
            type="button"
            aria-label="More setup actions"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className={`${SECONDARY} w-10 px-0 text-base leading-none`}
            onClick={() => setIsMenuOpen((previous) => !previous)}
          >
            ⋯
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            aria-label="Name for this setup"
            autoFocus
            maxLength={40}
            value={newName}
            placeholder="Name this setup"
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSave();
              }

              if (event.key === "Escape") {
                setMode("browse");
              }
            }}
            className={`${FIELD} flex-1 sm:max-w-sm`}
          />
          <button type="button" className={PRIMARY} onClick={handleSave}>
            Save
          </button>
          <button type="button" className={SECONDARY} onClick={() => setMode("browse")}>
            Cancel
          </button>
        </>
      )}

      {isMenuOpen ? (
        <div
          role="menu"
          aria-label="More setup actions"
          className="absolute right-0 top-full z-40 mt-1.5 w-56 rounded-[12px] border border-[#3A4252] bg-[#1A1E27] p-1.5 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!hasSelection}
            className="block w-full rounded-[8px] px-3 py-2 text-left text-sm text-[#F5F7FA] transition hover:bg-[#262B36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              onDelete(selectedId);
              setSelectedId("");
              setIsMenuOpen(false);
              say("Setup deleted.");
            }}
          >
            Delete selected setup
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded-[8px] px-3 py-2 text-left text-sm text-[#F5F7FA] transition hover:bg-[#262B36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]"
            onClick={() => {
              onReset();
              setIsMenuOpen(false);
              say("Page reset to defaults.");
            }}
          >
            Reset page to defaults
          </button>
        </div>
      ) : null}

      {status ? (
        <p
          role="status"
          className="absolute left-0 top-full z-40 mt-1.5 rounded-[10px] border border-[#3A4252] bg-[#1A1E27] px-3 py-1.5 text-xs text-[#D0D5DD] shadow-lg"
        >
          {status}
        </p>
      ) : null}
    </div>
  );
}
