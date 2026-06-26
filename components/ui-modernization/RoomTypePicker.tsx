"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoomType } from "@/lib/combinations";

type RoomTypeCategory = {
  title: string;
  rooms: RoomType[];
};

type RoomTypePickerProps = {
  selectedRooms: RoomType[];
  roomTypeCategories: RoomTypeCategory[];
  allRooms: RoomType[];
  onToggleRoom: (room: RoomType | "All") => void;
};

export function RoomTypePicker({
  selectedRooms,
  roomTypeCategories,
  allRooms,
  onToggleRoom,
}: RoomTypePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter categories and rooms based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return roomTypeCategories
      .map((category) => ({
        ...category,
        rooms: category.rooms.filter(
          (room) =>
            room.toLowerCase().includes(query) ||
            category.title.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.rooms.length > 0);
  }, [searchQuery, roomTypeCategories]);

  // Flatten filtered rooms for keyboard navigation
  const flattenedRooms = useMemo(() => {
    return filteredCategories.flatMap((category) => category.rooms);
  }, [filteredCategories]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isOpen = searchQuery.trim().length > 0;

      if (!isOpen && e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        return;
      }

      if (e.key === "Escape") {
        setSearchQuery("");
        setHighlightedIndex(-1);
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flattenedRooms.length - 1 ? prev + 1 : prev
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }

      if (e.key === "Enter" && highlightedIndex >= 0 && flattenedRooms[highlightedIndex]) {
        e.preventDefault();
        onToggleRoom(flattenedRooms[highlightedIndex]);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [highlightedIndex, flattenedRooms, onToggleRoom, searchQuery]);

  const isOpen = searchQuery.trim().length > 0;

  const handleRemoveRoom = (room: RoomType) => {
    onToggleRoom(room);
  };

  const handleSelectAll = () => {
    // Select all rooms that aren't already selected
    const roomsToSelect = allRooms.filter((room) => !selectedRooms.includes(room));
    roomsToSelect.forEach((room) => onToggleRoom(room));
  };

  const handleClearAll = () => {
    // Deselect all selected rooms
    selectedRooms.forEach((room) => onToggleRoom(room));
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#98A2B3]">Room Type</p>
        <div className="flex flex-wrap items-center gap-2">
          {selectedRooms.length === 0 ? (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-medium text-[#4F8CFF] hover:text-[#6BA3FF] transition"
            >
              Select all
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium text-[#4F8CFF] hover:text-[#6BA3FF] transition"
              >
                Select all
              </button>
              <span className="text-[#98A2B3]">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-medium text-[#EF4444] hover:text-[#FCA5A5] transition"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search room types..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(-1);
            }}
            className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] placeholder-[#98A2B3] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
            aria-label="Search room types"
            autoComplete="off"
          />

          {/* Results Dropdown */}
          {isOpen && filteredCategories.length > 0 && (
            <div
              ref={resultsRef}
              className="absolute top-full z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-[10px] border border-[#262B36] bg-[#171A21] shadow-lg"
              role="listbox"
            >
              {filteredCategories.map((category) => (
                <div key={category.title}>
                  <div className="sticky top-0 bg-[#0F1115] px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
                      {category.title}
                    </p>
                  </div>
                  {category.rooms.map((room) => {
                    const isHighlighted =
                      flattenedRooms[highlightedIndex] === room;
                    const isSelected = selectedRooms.includes(room);

                    return (
                      <button
                        key={room}
                        type="button"
                        onClick={() => {
                          onToggleRoom(room);
                          setSearchQuery("");
                          setHighlightedIndex(-1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition ${
                          isHighlighted
                            ? "bg-[#4F8CFF]/20 text-[#4F8CFF]"
                            : isSelected
                              ? "bg-[#1D2230] text-[#F5F7FA]"
                              : "text-[#F5F7FA] hover:bg-[#1D2230]"
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {room.charAt(0).toUpperCase() + room.slice(1)}
                        {isSelected && (
                          <span className="ml-2 text-xs text-[#4F8CFF]">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {isOpen && searchQuery.trim() && filteredCategories.length === 0 && (
            <div className="absolute top-full z-50 mt-2 w-full rounded-[10px] border border-[#262B36] bg-[#171A21] px-3 py-2 text-sm text-[#98A2B3]">
              No room types found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Selected Rooms as Chips */}
        {selectedRooms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedRooms.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => handleRemoveRoom(room)}
                className="flex items-center gap-2 rounded-full border border-[#3A4252] bg-[#171A21] px-3 py-2 text-sm font-medium text-[#F5F7FA] transition hover:border-[#4F8CFF]/60 hover:bg-[#1D2230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]"
                aria-label={`Remove ${room}`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-[#4F8CFF]"
                />
                {room.charAt(0).toUpperCase() + room.slice(1)}
                <span className="text-[#98A2B3]">×</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
