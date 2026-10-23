"use client";

import { useMemo, useState } from "react";
import type { RoomType } from "@/lib/combinations";
import { ChipGroup } from "./ChipGroup";

type RoomTypeCategory = {
  title: string;
  rooms: RoomType[];
};

type RoomTypePickerProps = {
  selectedRooms: RoomType[];
  roomTypeCategories: RoomTypeCategory[];
  /** Called with the full new selection, so bulk changes happen in one update. */
  onChange: (rooms: RoomType[]) => void;
};

const LINK_BUTTON_CLASS =
  "min-h-[32px] rounded-md px-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]";

function capitalize(room: string): string {
  return room.charAt(0).toUpperCase() + room.slice(1);
}

export function RoomTypePicker({
  selectedRooms,
  roomTypeCategories,
  onChange,
}: RoomTypePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const allRooms = useMemo(
    () => roomTypeCategories.flatMap((category) => category.rooms),
    [roomTypeCategories]
  );

  const visibleCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return roomTypeCategories;
    }

    return roomTypeCategories
      .map((category) => ({
        ...category,
        rooms: category.rooms.filter(
          (room) =>
            room.toLowerCase().includes(query) || category.title.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.rooms.length > 0);
  }, [searchQuery, roomTypeCategories]);

  function toggleRoom(room: string) {
    const typed = room as RoomType;
    onChange(
      selectedRooms.includes(typed)
        ? selectedRooms.filter((item) => item !== typed)
        : [...selectedRooms, typed]
    );
  }

  function toggleCategory(category: RoomTypeCategory) {
    const allSelected = category.rooms.every((room) => selectedRooms.includes(room));

    onChange(
      allSelected
        ? selectedRooms.filter((room) => !category.rooms.includes(room))
        : [...selectedRooms, ...category.rooms.filter((room) => !selectedRooms.includes(room))]
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#98A2B3]">
          Room Type{" "}
          <span className="text-xs font-normal">
            ({selectedRooms.length} of {allRooms.length} selected)
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onChange([...allRooms])}
            disabled={selectedRooms.length === allRooms.length}
            className={`${LINK_BUTTON_CLASS} text-[#6BA3FF] hover:text-[#9CC1FF] disabled:opacity-40`}
          >
            Select all
          </button>
          <span aria-hidden="true" className="text-[#98A2B3]">
            •
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selectedRooms.length === 0}
            className={`${LINK_BUTTON_CLASS} text-[#FCA5A5] hover:text-[#FECACA] disabled:opacity-40`}
          >
            Clear all
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Filter room types..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="mb-3 h-[42px] w-full rounded-[10px] border border-[#3A4252] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] placeholder-[#98A2B3] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
        aria-label="Search room types"
        autoComplete="off"
      />

      {visibleCategories.length === 0 ? (
        <p className="text-sm text-[#98A2B3]">
          No room types found matching &quot;{searchQuery}&quot;
        </p>
      ) : (
        <div className="space-y-3">
          {visibleCategories.map((category) => {
            const fullCategory = roomTypeCategories.find((item) => item.title === category.title);
            const allSelected = (fullCategory ?? category).rooms.every((room) =>
              selectedRooms.includes(room)
            );

            return (
              <div key={category.title}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
                    {category.title}
                  </p>
                  <button
                    type="button"
                    aria-pressed={allSelected}
                    aria-label={`All ${category.title}`}
                    onClick={() => toggleCategory(fullCategory ?? category)}
                    className={`${LINK_BUTTON_CLASS} ${
                      allSelected ? "text-[#9CC1FF]" : "text-[#6BA3FF] hover:text-[#9CC1FF]"
                    }`}
                  >
                    {allSelected ? "✓ All" : "All"}
                  </button>
                </div>
                <ChipGroup
                  ariaLabel={category.title}
                  options={category.rooms.map((room) => ({
                    value: room,
                    label: capitalize(room),
                  }))}
                  selectedValues={selectedRooms}
                  onToggleValue={toggleRoom}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
