"use client";

import { RoomTypePicker } from "@/components/ui-modernization";
import { homeQualities, roomSizes, rooms, styles, type RoomType } from "@/lib/combinations";
import { evenSplit } from "@/lib/roomMix";
import { resolveQuickSets } from "@/lib/roomPicker";
import type { HomeQuality, Setup } from "@/lib/setup";
import { SelectField } from "./fields";
import { RoomMix } from "./RoomMix";
import { SectionCard } from "./SectionCard";

const ROOM_CATEGORY_DEFINITIONS: Array<{ title: string; rooms: string[] }> = [
  {
    title: "Living Spaces",
    rooms: ["living room", "sunken living room", "family room", "breakfast nook", "library", "dining room"],
  },
  { title: "Private Spaces", rooms: ["bedroom", "home office", "nursery", "bathroom"] },
  {
    title: "Service Spaces",
    rooms: ["kitchen", "pantry", "laundry room", "mud room", "walk-in closet", "foyer"],
  },
  {
    title: "Entertainment Spaces",
    rooms: ["theater room", "game room", "wine cellar", "recording studio"],
  },
  { title: "Fitness Spaces", rooms: ["home gym"] },
  { title: "Utility Spaces", rooms: ["basement"] },
];

const ROOM_TYPE_CATEGORIES = ROOM_CATEGORY_DEFINITIONS.map((category) => ({
  ...category,
  rooms: category.rooms.filter((room): room is RoomType => rooms.includes(room as RoomType)),
})).filter((category) => category.rooms.length > 0);

const QUICK_SETS = resolveQuickSets(rooms);

const HOME_QUALITY_DESCRIPTIONS: Record<HomeQuality, string> = {
  "builder's grade layout":
    "Plain, ordinary home: standard 8 ft ceilings, simple trim, stock cabinets, mass-market furniture, tidy and lived-in.",
  everyday:
    "Comfortable, practical home: simple trim, retail furniture, warm and lived-in rather than staged.",
  upscale:
    "Refined materials and tailored millwork, curated furniture, 9 ft ceilings, restrained styling.",
  luxury:
    "Premium stone and bespoke millwork, high ceilings, designer furniture, polished styling.",
  "ultra luxury":
    "Museum-grade custom joinery, collectible furnishings, grand scale, gallery-level styling.",
};

type RoomSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
  isOpen: boolean;
  onToggle: () => void;
};

function describeRooms(selected: string[]): string {
  if (selected.length === 0) return "no room type";
  if (selected.length <= 2) return selected.join(" and ");
  return `${selected.length} room types`;
}

export function RoomSection({ setup, update, isOpen, onToggle }: RoomSectionProps) {
  function changeRooms(nextRooms: RoomType[]) {
    // A different set of rooms starts the custom counts over from an even split.
    const keepCustom = setup.roomSplitMode === "custom" && nextRooms.length >= 2;

    update({
      rooms: nextRooms,
      roomSplitMode: keepCustom ? "custom" : "even",
      roomCounts: keepCustom ? evenSplit(nextRooms, setup.maxImages) : {},
    });
  }

  return (
    <SectionCard
      id="room"
      title="Room"
      icon="room"
      isOpen={isOpen}
      onToggle={onToggle}
      summary={`${describeRooms(setup.rooms)} · ${setup.designStyle} · ${setup.homeQuality} · ${setup.roomSize}`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
        <div className="md:col-span-3">
          <RoomTypePicker
            selectedRooms={setup.rooms}
            roomTypeCategories={ROOM_TYPE_CATEGORIES}
            quickSets={QUICK_SETS}
            onChange={changeRooms}
          />
        </div>

        <div className="md:col-span-3">
          <RoomMix setup={setup} update={update} />
        </div>

        <SelectField
          label="Interior design style"
          value={setup.designStyle}
          onChange={(designStyle) => update({ designStyle })}
        >
          {styles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Home quality"
          value={setup.homeQuality}
          onChange={(homeQuality) => update({ homeQuality: homeQuality as HomeQuality })}
          hint={`Current quality profile: ${HOME_QUALITY_DESCRIPTIONS[setup.homeQuality]}`}
        >
          {homeQualities.map((quality) => (
            <option key={quality} value={quality}>
              {quality}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Room size"
          value={setup.roomSize}
          onChange={(roomSize) => update({ roomSize })}
        >
          {roomSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </SelectField>
      </div>
    </SectionCard>
  );
}
