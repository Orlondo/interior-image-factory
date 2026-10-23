"use client";

import { useState } from "react";
import { validateName, type SavedSetup } from "@/lib/savedItems";
import { SECONDARY_BUTTON_CLASS, SELECT_CLASS } from "./fields";
import { SectionCard } from "./SectionCard";

type SetupsBarProps = {
  savedSetups: SavedSetup[];
  /** Returns an error message, or null when saved. */
  onSave: (name: string) => string | null;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
};

export function SetupsBar({ savedSetups, onSave, onApply, onDelete, onReset }: SetupsBarProps) {
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const hasSelection = savedSetups.some((item) => item.id === selectedId);

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
    <SectionCard id="setups" title="Saved setups" icon="setups">
      <p className="text-xs text-[#98A2B3]">
        A setup remembers every selection on this page, saved in this browser.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="Choose a saved setup"
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
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            disabled={!hasSelection}
            onClick={() => {
              onApply(selectedId);
              setMessage("Setup applied.");
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            aria-label="New setup name"
            maxLength={40}
            value={newName}
            placeholder="Name this setup"
            onChange={(event) => setNewName(event.target.value)}
            className={SELECT_CLASS}
          />
          <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={handleSave}>
            Save setup
          </button>
          <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      {message ? (
        <p role="status" className="mt-2 text-xs text-[#98A2B3]">
          {message}
        </p>
      ) : null}
    </SectionCard>
  );
}
