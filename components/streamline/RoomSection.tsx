"use client";

import { RoomTypePicker } from "@/components/ui-modernization";
import { homeQualities, roomSizes, rooms, styles, type RoomType } from "@/lib/combinations";
import { setAll, toggleValue } from "@/lib/selection";
import type { HomeQuality, Setup } from "@/lib/setup";
import { SECTION_CLASS, SelectField } from "./fields";

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

const HOME_QUALITY_DESCRIPTIONS: Record<HomeQuality, string> = {
  "builder's grade layout": "Standard tract-home layout with practical finishes and simpler detailing.",
  everyday: "Practical, comfortable finishes and realistic residential styling.",
  upscale: "Refined materials and polished details without full luxury opulence.",
  luxury: "High-end finishes, designer furniture, and premium composition.",
  "ultra luxury": "Top-tier bespoke interiors with exceptional materials and craftsmanship.",
};

type RoomSectionProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

export function RoomSection({ setup, update }: RoomSectionProps) {
  function toggleRoom(value: RoomType | "All") {
    update({
      rooms:
        value === "All"
          ? setAll(rooms, setup.rooms.length !== rooms.length)
          : toggleValue(setup.rooms, value),
    });
  }

  return (
    <section className={SECTION_CLASS} aria-labelledby="room-heading">
      <h2 id="room-heading" className="text-sm font-semibold">
        Room
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
        <div className="md:col-span-3">
          <RoomTypePicker
            selectedRooms={setup.rooms}
            roomTypeCategories={ROOM_TYPE_CATEGORIES}
            allRooms={rooms}
            onToggleRoom={toggleRoom}
          />
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
    </section>
  );
}
