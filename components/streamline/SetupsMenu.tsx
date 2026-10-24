"use client";

import { useEffect, useRef, useState } from "react";
import { validateName, type SavedSetup } from "@/lib/savedItems";
import { SECONDARY_BUTTON_CLASS, SELECT_CLASS } from "./fields";

/** Tinted blue so it stands out from Expand and Collapse without competing with the filled Generate button. */
const SETUPS_BUTTON_CLASS =
  "inline-flex min-h-[42px] items-center gap-1.5 rounded-[10px] border border-[#4F8CFF]/60 bg-[#4F8CFF]/15 px-1.5 py-2 text-xs font-semibold text-[#9DBFFF] transition hover:border-[#4F8CFF] hover:bg-[#4F8CFF]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] sm:px-3 sm:text-sm";

type SetupsMenuProps = {
  savedSetups: SavedSetup[];
  /** Returns an error message, or null when saved. */
  onSave: (name: string) => string | null;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
};

/**
 * Saved setups, reachable from the pinned header. A setup applies to the whole page, so it sits
 * with the page controls instead of inside one section.
 */
export function SetupsMenu({ savedSetups, onSave, onApply, onDelete, onReset }: SetupsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasSelection = savedSetups.some((item) => item.id === selectedId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function handleSave() {
    const problem =
      validateName(newName, savedSetups.map((item) => item.name)) ?? onSave(newName);

    if (problem) {
      setMessage(problem);
      return;
    }

    setNewName("");
    setMessage("Setup saved.");
  }

  return (
    <div ref={rootRef} className="sm:relative">
      <button
        type="button"
        className={SETUPS_BUTTON_CLASS}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Setups, ${savedSetups.length} saved`}
        onClick={() => {
          setIsOpen((previous) => !previous);
          setMessage(null);
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden h-4 w-4 shrink-0 sm:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
        Setups
        <span
          aria-hidden="true"
          className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
            savedSetups.length > 0 ? "bg-[#4F8CFF] text-[#0F1115]" : "bg-[#3A4252] text-[#98A2B3]"
          }`}
        >
          {savedSetups.length}
        </span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Saved setups"
          className="fixed inset-x-4 top-[60px] z-40 rounded-[12px] border border-[#3A4252] bg-[#1A1E27] p-4 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[26rem]"
        >
          <p className="text-xs text-[#98A2B3]">
            A setup remembers every selection on this page, saved in this browser.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs font-medium text-[#98A2B3]" htmlFor="setups-menu-choose">
              Saved setups
            </label>
            <select
              id="setups-menu-choose"
              className={SELECT_CLASS}
              value={hasSelection ? selectedId : ""}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              <option value="">
                {savedSetups.length === 0 ? "No saved setups yet" : "Choose a saved setup"}
              </option>
              {savedSetups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${SECONDARY_BUTTON_CLASS} flex-1`}
                disabled={!hasSelection}
                onClick={() => {
                  onApply(selectedId);
                  setIsOpen(false);
                }}
              >
                Apply
              </button>
              <button
                type="button"
                className={`${SECONDARY_BUTTON_CLASS} flex-1`}
                disabled={!hasSelection}
                onClick={() => {
                  onDelete(selectedId);
                  setSelectedId("");
                  setMessage("Setup deleted.");
                }}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#262B36] pt-4">
            <label className="text-xs font-medium text-[#98A2B3]" htmlFor="setups-menu-name">
              Save the current page as a setup
            </label>
            <input
              id="setups-menu-name"
              type="text"
              maxLength={40}
              value={newName}
              placeholder="Name this setup"
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSave();
                }
              }}
              className={SELECT_CLASS}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className={`${SECONDARY_BUTTON_CLASS} flex-1`}
                onClick={handleSave}
              >
                Save setup
              </button>
              <button
                type="button"
                className={`${SECONDARY_BUTTON_CLASS} flex-1`}
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
              >
                Reset page
              </button>
            </div>
          </div>

          {message ? (
            <p role="status" className="mt-3 text-xs text-[#98A2B3]">
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
