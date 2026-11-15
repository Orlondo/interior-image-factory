"use client";

import { useEffect, useState } from "react";
import { ChipGroup } from "@/components/ui-modernization";
import { views } from "@/lib/combinations";
import {
  EMPTY_HOUSE,
  HOUSE_PALETTE_MAX,
  LAST_HOUSE_VIEW_KEY,
  TOUR_ROOMS,
  describeHouse,
  houseFloors,
  houseMetals,
  housePaletteChoices,
  houseWallColors,
  houseWoodTones,
  isHouseSet,
  type HouseProfile,
} from "@/lib/houseProfile";
import { readLocalStore } from "@/lib/localStore";
import { evenSplit } from "@/lib/roomMix";
import type { Setup } from "@/lib/setup";
import { CheckboxField, SelectField } from "./fields";
import { SectionCard } from "./SectionCard";

type HouseSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

function ChoiceField({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <SelectField label={label} value={value} onChange={onChange} hint={hint}>
      <option value="">Not set (varies by room)</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </SelectField>
  );
}

/**
 * The house profile: one saved set of choices every room of the house shares, plus the house tour (exterior
 * first, rooms in order, the same house at dusk). Everything is optional; leaving it empty changes nothing.
 */
export function HouseSection({ setup, update }: HouseSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const house = setup.house;
  const [lastView, setLastView] = useState<string | null>(null);

  useEffect(() => {
    setLastView(readLocalStore(LAST_HOUSE_VIEW_KEY));
  }, []);

  function change(patch: Partial<HouseProfile>) {
    update({ house: { ...house, ...patch } });
  }

  function setTour(on: boolean) {
    if (!on) {
      update({ houseTour: false });
      return;
    }

    // A tour is one house, in tour order, with two exterior photos around the rooms.
    update({
      houseTour: true,
      sameHouse: true,
      rooms: TOUR_ROOMS as Setup["rooms"],
      roomSplitMode: "even",
      roomCounts: {},
      anglesPerRoom: 1,
      maxImages: Math.max(setup.maxImages, TOUR_ROOMS.length + 2),
    });
  }

  const summary = [setup.houseTour ? "House tour" : "", describeHouse(house)].filter(Boolean).join(" · ");

  return (
    <SectionCard
      id="house"
      title="House"
      icon="details"
      isOpen={isOpen}
      onToggle={() => setIsOpen((previous) => !previous)}
      summary={summary || "Optional: keep every room in one house"}
    >
      <div className="space-y-4">
        <p className="text-xs text-[#98A2B3]">
          Pick the things every room of one house should share. Anything left as Not set varies by room as usual, and an
          empty profile changes nothing.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChoiceField label="Flooring" value={house.floor} options={houseFloors} onChange={(floor) => change({ floor })} />
          <ChoiceField
            label="Wall color"
            value={house.wallColor}
            options={houseWallColors}
            onChange={(wallColor) => change({ wallColor })}
          />
          <ChoiceField
            label="Wood tone"
            value={house.woodTone}
            options={houseWoodTones}
            onChange={(woodTone) => change({ woodTone })}
          />
          <ChoiceField label="Metal finish" value={house.metal} options={houseMetals} onChange={(metal) => change({ metal })} />
          <ChoiceField
            label="Window view"
            value={house.view}
            options={views}
            onChange={(view) => change({ view })}
            hint={
              house.view && lastView === house.view
                ? "The last run used this view too. Pick another view for a new house."
                : "Locks every room of the house to one view."
            }
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#98A2B3]">
            House palette ({house.palette.length} of {HOUSE_PALETTE_MAX})
          </p>
          <ChipGroup
            options={housePaletteChoices.map((color) => ({ value: color, label: color }))}
            selectedValues={house.palette}
            onToggleValue={(color) => {
              const next = house.palette.includes(color)
                ? house.palette.filter((item) => item !== color)
                : [...house.palette, color].slice(0, HOUSE_PALETTE_MAX);
              change({ palette: next });
            }}
            ariaLabel="House palette"
          />
          <p className="text-xs text-[#98A2B3]">Most rooms will show these colors. Four to six works best.</p>
        </div>

        <div className="space-y-2">
          <CheckboxField label="House tour order" checked={setup.houseTour} onChange={setTour} />
          <p className="text-xs text-[#98A2B3]">
            Makes one house: a daytime exterior first, then the entry, living room, kitchen, dining room, bedroom and
            bathroom in that order, and the same house at dusk last. It uses two of your images for the exteriors. Add
            or remove rooms in the Room section afterwards.
          </p>
        </div>

        {isHouseSet(house) ? (
          <button
            type="button"
            className="text-xs text-[#98A2B3] underline hover:text-[#F5F7FA]"
            onClick={() => update({ house: EMPTY_HOUSE })}
          >
            Clear the house profile
          </button>
        ) : null}
      </div>
    </SectionCard>
  );
}
