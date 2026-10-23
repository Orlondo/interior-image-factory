"use client";

import { useCallback, useState } from "react";
import { DetailsSection } from "@/components/streamline/DetailsSection";
import { GenerationPanel } from "@/components/streamline/GenerationPanel";
import { ImageReview } from "@/components/streamline/ImageReview";
import { LookSection } from "@/components/streamline/LookSection";
import { OutputSection } from "@/components/streamline/OutputSection";
import { RoomSection } from "@/components/streamline/RoomSection";
import { SECONDARY_BUTTON_CLASS } from "@/components/streamline/fields";
import { SetupsBar } from "@/components/streamline/SetupsBar";
import { sumCounts } from "@/lib/roomMix";
import { getLookValues } from "@/lib/looks";
import {
  SAVED_LOOKS_KEY,
  SAVED_SETUPS_KEY,
  makeId,
  parseSavedLooks,
  parseSavedSetups,
  cleanName,
  type SavedLook,
  type SavedSetup,
} from "@/lib/savedItems";
import { DEFAULT_SETUP, type Setup } from "@/lib/setup";
import { useGeneration } from "@/lib/useGeneration";
import { useSectionState } from "@/lib/useSectionState";
import { useSavedItems } from "@/lib/useSavedItems";

export default function Home() {
  const [setup, setSetup] = useState<Setup>(DEFAULT_SETUP);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const sections = useSectionState();
  const generation = useGeneration();
  const savedLooks = useSavedItems<SavedLook>(SAVED_LOOKS_KEY, parseSavedLooks);
  const savedSetups = useSavedItems<SavedSetup>(SAVED_SETUPS_KEY, parseSavedSetups);

  const update = useCallback((patch: Partial<Setup>) => {
    setSetup((previous) => ({ ...previous, ...patch }));
  }, []);

  const canGenerate =
    setup.roomSplitMode !== "custom" ||
    setup.rooms.length < 2 ||
    sumCounts(setup.rooms, setup.roomCounts) === setup.maxImages;

  function saveLook(name: string): string | null {
    const result = savedLooks.save([
      ...savedLooks.items,
      { id: makeId(), name: cleanName(name), values: getLookValues(setup) },
    ]);

    return result.ok ? null : result.message;
  }

  function saveSetup(name: string): string | null {
    const result = savedSetups.save([
      ...savedSetups.items,
      { id: makeId(), name: cleanName(name), setup },
    ]);

    return result.ok ? null : result.message;
  }

  function applySetup(id: string) {
    const found = savedSetups.items.find((item) => item.id === id);

    if (found) {
      setSetup(found.setup);
    }
  }

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-6 text-[#F5F7FA] sm:px-6 lg:px-10">
      <div className="space-y-4">
        <SetupsBar
          savedSetups={savedSetups.items}
          onSave={saveSetup}
          onApply={applySetup}
          onDelete={(id) => savedSetups.save(savedSetups.items.filter((item) => item.id !== id))}
          onReset={() => setSetup(DEFAULT_SETUP)}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={() => sections.setAll(true)}
          >
            Expand all
          </button>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={() => sections.setAll(false)}
          >
            Collapse all
          </button>
        </div>

        <RoomSection
          setup={setup}
          update={update}
          isOpen={sections.state.room}
          onToggle={() => sections.toggle("room")}
        />

        <LookSection
          setup={setup}
          update={update}
          savedLooks={savedLooks.items}
          onSaveLook={saveLook}
          onDeleteLook={(id) => savedLooks.save(savedLooks.items.filter((item) => item.id !== id))}
          isOpen={sections.state.look}
          onToggle={() => sections.toggle("look")}
          isCustomizeOpen={isCustomizeOpen}
          onToggleCustomize={() => setIsCustomizeOpen((previous) => !previous)}
        />

        <DetailsSection
          setup={setup}
          update={update}
          isOpen={sections.state.details}
          onToggle={() => sections.toggle("details")}
        />

        <OutputSection
          setup={setup}
          update={update}
          isOpen={sections.state.output}
          onToggle={() => sections.toggle("output")}
        />

        <GenerationPanel
          setup={setup}
          isGenerating={generation.isGenerating}
          generationUiState={generation.generationUiState}
          generationProgress={generation.generationProgress}
          generationStatusMessage={generation.generationStatusMessage}
          canGenerate={canGenerate}
          onGenerate={() => generation.generate(setup)}
          onCancel={generation.cancelGeneration}
        />
      </div>

      <ImageReview images={generation.images} />
    </main>
  );
}
