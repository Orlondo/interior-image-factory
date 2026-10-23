"use client";

import { useMemo, useState } from "react";
import { CollapsibleSection } from "@/components/ui-modernization";
import { getColorPreviewData } from "@/lib/promptBuilder/colorPalette";
import {
  BUILT_IN_LOOKS,
  findMatchingLook,
  getIntensityStep,
  type Look,
} from "@/lib/looks";
import { validateName, type SavedLook } from "@/lib/savedItems";
import type { Setup } from "@/lib/setup";
import { CustomizeColors } from "./CustomizeColors";
import { SECONDARY_BUTTON_CLASS, SELECT_CLASS } from "./fields";
import { SectionCard } from "./SectionCard";

const CUSTOM_VALUE = "__custom__";

type LookSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
  savedLooks: SavedLook[];
  /** Returns an error message, or null when saved. */
  onSaveLook: (name: string) => string | null;
  onDeleteLook: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isCustomizeOpen: boolean;
  onToggleCustomize: () => void;
};

export function LookSection({
  setup,
  update,
  savedLooks,
  onSaveLook,
  onDeleteLook,
  isOpen,
  onToggle,
  isCustomizeOpen,
  onToggleCustomize,
}: LookSectionProps) {
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const allLooks: Look[] = useMemo(
    () => [
      ...BUILT_IN_LOOKS,
      ...savedLooks.map((saved) => ({
        id: `saved:${saved.id}`,
        name: saved.name,
        description: "Your saved Look.",
        values: saved.values,
      })),
    ],
    [savedLooks]
  );

  const activeLook = findMatchingLook(setup, allLooks);
  const isSavedActive = activeLook?.id.startsWith("saved:") ?? false;

  const preview = useMemo(
    () =>
      getColorPreviewData({
        colorMood: setup.colorMood,
        colorStrategy: setup.colorStrategy,
        colorCoverage: setup.colorCoverage,
        heroColor: setup.heroColor,
        colorIntensity: setup.colorIntensity,
        autoPaletteVariation: setup.autoPaletteVariation,
        imageIndex: 0,
        maxImages: setup.maxImages,
      }),
    [setup]
  );

  const swatches = [
    ["Primary", preview.primary],
    ["Secondary", preview.secondary],
    ["Accent", preview.complementaryAccent],
    ["Neutral", preview.neutralGrounding],
    ["Wood", preview.woodTone],
    ["Metal", preview.metalFinish],
  ];

  function applyLook(id: string) {
    const chosen = allLooks.find((look) => look.id === id);

    if (chosen) {
      update({ ...chosen.values });
      setMessage(null);
    }
  }

  function handleSave() {
    const taken = allLooks.map((look) => look.name);
    const problem = validateName(newName, taken) ?? onSaveLook(newName);

    if (problem) {
      setMessage(problem);
      return;
    }

    setNewName("");
    setMessage("Look saved.");
  }

  const savedId = isSavedActive ? activeLook?.id.slice("saved:".length) : undefined;

  return (
    <SectionCard
      id="look"
      title="Look"
      icon="look"
      isOpen={isOpen}
      onToggle={onToggle}
      summary={
        activeLook
          ? `${activeLook.name} · ${getIntensityStep(setup.colorIntensity).label}`
          : `Custom · ${setup.colorStrategy} · ${getIntensityStep(setup.colorIntensity).label}`
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-medium text-[#98A2B3]">Look</span>
          <select
            aria-label="Choose a Look"
            className={SELECT_CLASS}
            value={activeLook?.id ?? CUSTOM_VALUE}
            onChange={(event) => applyLook(event.target.value)}
          >
            <optgroup label="Built-in Looks">
              {BUILT_IN_LOOKS.map((look) => (
                <option key={look.id} value={look.id}>
                  {look.name}
                </option>
              ))}
            </optgroup>
            {savedLooks.length > 0 ? (
              <optgroup label="Your Looks">
                {savedLooks.map((saved) => (
                  <option key={saved.id} value={`saved:${saved.id}`}>
                    {saved.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {activeLook ? null : (
              <option value={CUSTOM_VALUE} disabled>
                Custom
              </option>
            )}
          </select>
          <span className="text-xs text-[#98A2B3]">
            {activeLook
              ? activeLook.description
              : "Custom: your color settings do not match a saved Look."}{" "}
            Intensity: {getIntensityStep(setup.colorIntensity).label}.
          </span>
        </label>

        <div className="min-w-0 rounded-[16px] border border-[#262B36] bg-[#0F1115] p-3">
          <p className="text-sm font-medium text-[#F5F7FA]">
            {preview.selectedPalette}{" "}
            <span className="text-xs font-normal text-[#98A2B3]">({preview.paletteFamily})</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Palette preview">
            {swatches.map(([role, name]) => (
              <li
                key={role}
                className="rounded-full border border-[#262B36] bg-[#171A21] px-3 py-1 text-xs text-[#D6DAE3]"
              >
                <span className="text-[#98A2B3]">{role}:</span> {name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[#98A2B3]">
            With Auto palette variation on, the palette changes from image to image within this family.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <CollapsibleSection
          title="Customize colors"
          collapsedSummary={`${setup.colorMood}, ${setup.colorStrategy}, ${setup.colorCoverage}`}
          isOpen={isCustomizeOpen}
          onToggle={onToggleCustomize}
        >
          <CustomizeColors setup={setup} update={update} />
        </CollapsibleSection>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-[#98A2B3]">Save current colors as a Look</span>
          <input
            type="text"
            maxLength={40}
            value={newName}
            placeholder="Look name"
            onChange={(event) => setNewName(event.target.value)}
            className={SELECT_CLASS}
          />
        </label>
        <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={handleSave}>
          Save Look
        </button>
        {savedId ? (
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={() => {
              onDeleteLook(savedId);
              setMessage("Look deleted. Your current colors are unchanged.");
            }}
          >
            Delete this Look
          </button>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="mt-2 text-xs text-[#98A2B3]">
          {message}
        </p>
      ) : null}
    </SectionCard>
  );
}
