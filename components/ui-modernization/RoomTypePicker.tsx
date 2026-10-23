"use client";

import { useId, useMemo, useState } from "react";
import type { RoomType } from "@/lib/combinations";
import {
  type QuickSet,
  countSelected,
  filterGroups,
  initialOpenGroups,
  quickSetMatches,
  selectedInGroup,
} from "@/lib/roomPicker";
import { ChipGroup } from "./ChipGroup";

type RoomTypeCategory = {
  title: string;
  rooms: RoomType[];
};

type RoomTypePickerProps = {
  selectedRooms: RoomType[];
  roomTypeCategories: RoomTypeCategory[];
  /** One-click sets of rooms. Choosing one replaces the current selection. */
  quickSets?: QuickSet[];
  /** Called with the full new selection, so bulk changes happen in one update. */
  onChange: (rooms: RoomType[]) => void;
};

const LINK_BUTTON_CLASS =
  "min-h-[32px] rounded-md px-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]";

function capitalize(room: string): string {
  return room.charAt(0).toUpperCase() + room.slice(1);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 text-[#98A2B3] transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4l6 6-6 6" />
    </svg>
  );
}

export function RoomTypePicker({
  selectedRooms,
  roomTypeCategories,
  quickSets = [],
  onChange,
}: RoomTypePickerProps) {
  const baseId = useId();
  const [searchQuery, setSearchQuery] = useState("");
  // Groups with a selected room start open; the rest stay closed until you open them.
  const [openGroups, setOpenGroups] = useState(() =>
    initialOpenGroups(roomTypeCategories, selectedRooms)
  );
  const allRooms = useMemo(
    () => roomTypeCategories.flatMap((category) => category.rooms),
    [roomTypeCategories]
  );
  const searching = searchQuery.trim().length > 0;
  const visibleCategories = useMemo(
    () => filterGroups(roomTypeCategories, searchQuery),
    [searchQuery, roomTypeCategories]
  );

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

    // Choosing a whole category shows what was chosen.
    if (!allSelected) {
      setOpenGroups((current) => ({ ...current, [category.title]: true }));
    }
  }

  function applyQuickSet(set: QuickSet) {
    onChange(set.rooms as RoomType[]);
    // Open every category the set touches, so the picks are visible.
    setOpenGroups((current) => {
      const next = { ...current };

      for (const category of roomTypeCategories) {
        if (category.rooms.some((room) => set.rooms.includes(room))) {
          next[category.title] = true;
        }
      }

      return next;
    });
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

      {quickSets.length > 0 ? (
        <div
          className="mb-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Quick sets"
        >
          <span className="text-xs font-medium text-[#98A2B3]">Quick sets</span>
          {quickSets.map((set) => {
            const active = quickSetMatches(selectedRooms, set);

            return (
              <button
                key={set.id}
                type="button"
                aria-pressed={active}
                title={`Select ${set.rooms.map(capitalize).join(", ")} (replaces your current selection)`}
                onClick={() => applyQuickSet(set)}
                className={`min-h-[32px] rounded-full border px-3 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] ${
                  active
                    ? "border-[#4F8CFF] bg-[#4F8CFF]/15 text-[#F5F7FA]"
                    : "border-[#3A4252] bg-[#262B36] text-[#F5F7FA] hover:border-[#4F8CFF]/60 hover:bg-[#2D3342]"
                }`}
              >
                {set.label}
              </button>
            );
          })}
        </div>
      ) : null}

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
        <div className="space-y-2">
          {visibleCategories.map((category) => {
            const fullCategory =
              roomTypeCategories.find((item) => item.title === category.title) ?? category;
            const allSelected = fullCategory.rooms.every((room) => selectedRooms.includes(room));
            const count = countSelected(fullCategory, selectedRooms);
            // A search opens every matching group; otherwise each group keeps its own state.
            const open = searching || Boolean(openGroups[category.title]);
            const bodyId = `${baseId}-${category.title.replace(/\s+/g, "-").toLowerCase()}`;
            const picked = selectedInGroup(fullCategory, selectedRooms);

            return (
              <div
                key={category.title}
                className="rounded-[10px] border border-[#2F3644] bg-[#171A21]"
              >
                <div className="flex items-center gap-1 pr-1">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={bodyId}
                    aria-label={`${category.title}, ${count} of ${fullCategory.rooms.length} selected`}
                    disabled={searching}
                    onClick={() =>
                      setOpenGroups((current) => ({
                        ...current,
                        [category.title]: !current[category.title],
                      }))
                    }
                    className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-[10px] px-3 text-left transition hover:bg-[#1F232C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <Chevron open={open} />
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
                      {category.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        count > 0 ? "bg-[#4F8CFF]/20 text-[#9CC1FF]" : "bg-[#262B36] text-[#98A2B3]"
                      }`}
                    >
                      {count} of {fullCategory.rooms.length}
                    </span>
                    {!open && picked.length > 0 ? (
                      <span className="min-w-0 truncate text-xs text-[#98A2B3]">
                        {picked.map(capitalize).join(", ")}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-pressed={allSelected}
                    aria-label={`All ${category.title}`}
                    onClick={() => toggleCategory(fullCategory)}
                    className={`${LINK_BUTTON_CLASS} shrink-0 ${
                      allSelected ? "text-[#9CC1FF]" : "text-[#6BA3FF] hover:text-[#9CC1FF]"
                    }`}
                  >
                    {allSelected ? "✓ All" : "All"}
                  </button>
                </div>
                {open ? (
                  <div id={bodyId} className="px-3 pb-3 pt-1">
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
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
