"use client";

import { useCallback, useState } from "react";
import { DetailsSection } from "@/components/streamline/DetailsSection";
import { GenerationPanel } from "@/components/streamline/GenerationPanel";
import { ImageReview } from "@/components/streamline/ImageReview";
import { LookSection } from "@/components/streamline/LookSection";
import { OutputSection } from "@/components/streamline/OutputSection";
import { RoomSection } from "@/components/streamline/RoomSection";
import { SetupsBar } from "@/components/streamline/SetupsBar";
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
import { useSavedItems } from "@/lib/useSavedItems";

export default function Home() {
  const [setup, setSetup] = useState<Setup>(DEFAULT_SETUP);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const generation = useGeneration();
  const savedLooks = useSavedItems<SavedLook>(SAVED_LOOKS_KEY, parseSavedLooks);
  const savedSetups = useSavedItems<SavedSetup>(SAVED_SETUPS_KEY, parseSavedSetups);

  const update = useCallback((patch: Partial<Setup>) => {
    setSetup((previous) => ({ ...previous, ...patch }));
  }, []);

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

        <RoomSection setup={setup} update={update} />

        <LookSection
          setup={setup}
          update={update}
          savedLooks={savedLooks.items}
          onSaveLook={saveLook}
          onDeleteLook={(id) => savedLooks.save(savedLooks.items.filter((item) => item.id !== id))}
          isCustomizeOpen={isCustomizeOpen}
          onToggleCustomize={() => setIsCustomizeOpen((previous) => !previous)}
        />

        <DetailsSection
          setup={setup}
          update={update}
          isOpen={isDetailsOpen}
          onToggle={() => setIsDetailsOpen((previous) => !previous)}
        />

        <OutputSection setup={setup} update={update} />

        <GenerationPanel
          setup={setup}
          isGenerating={generation.isGenerating}
          generationUiState={generation.generationUiState}
          generationProgress={generation.generationProgress}
          generationStatusMessage={generation.generationStatusMessage}
          onGenerate={() => generation.generate(setup)}
          onCancel={generation.cancelGeneration}
        />
      </div>

      <ImageReview images={generation.images} />
    </main>
  );
}
