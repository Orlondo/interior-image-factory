"use client";

import { evenSplit, sumCounts, type RoomCounts } from "@/lib/roomMix";
import type { RoomSplitMode, Setup } from "@/lib/setup";
import { SECONDARY_BUTTON_CLASS } from "./fields";

type RoomMixProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

function modeClass(active: boolean): string {
  return `${SECONDARY_BUTTON_CLASS} ${
    active ? "border-[#4F8CFF] bg-[#4F8CFF]/15 hover:bg-[#4F8CFF]/25" : ""
  }`;
}

/** Only shown with two or more rooms: choose an even split or exact counts per room. */
export function RoomMix({ setup, update }: RoomMixProps) {
  const { rooms, maxImages, roomSplitMode, roomCounts } = setup;

  if (rooms.length < 2) {
    return null;
  }

  const even = evenSplit(rooms, maxImages);
  const isCustom = roomSplitMode === "custom";
  const assigned = sumCounts(rooms, roomCounts);
  const remaining = maxImages - assigned;

  function setMode(mode: RoomSplitMode) {
    update(
      mode === "custom"
        ? { roomSplitMode: "custom", roomCounts: evenSplit(rooms, maxImages) }
        : { roomSplitMode: "even", roomCounts: {} }
    );
  }

  function setCount(room: string, raw: string) {
    const parsed = Math.max(0, Math.min(maxImages, Math.floor(Number(raw) || 0)));
    const next: RoomCounts = { ...roomCounts, [room]: parsed };
    update({ roomCounts: next });
  }

  return (
    <div className="rounded-[16px] border border-[#3A4252] bg-[#0F1115] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#98A2B3]">Images per room</p>
        <div className="flex gap-2" role="group" aria-label="Room split mode">
          <button
            type="button"
            aria-pressed={!isCustom}
            className={modeClass(!isCustom)}
            onClick={() => setMode("even")}
          >
            Split evenly
          </button>
          <button
            type="button"
            aria-pressed={isCustom}
            className={modeClass(isCustom)}
            onClick={() => setMode("custom")}
          >
            Set counts
          </button>
        </div>
      </div>

      {isCustom ? (
        <>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {rooms.map((room) => (
              <li key={room} className="flex items-center justify-between gap-3">
                <label htmlFor={`room-count-${room}`} className="min-w-0 truncate text-sm">
                  {room.charAt(0).toUpperCase() + room.slice(1)}
                </label>
                <input
                  id={`room-count-${room}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={maxImages}
                  value={roomCounts[room] ?? 0}
                  onChange={(event) => setCount(room, event.target.value)}
                  className="h-[42px] w-20 rounded-[10px] border border-[#3A4252] bg-[#171A21] px-3 text-sm text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                />
              </li>
            ))}
          </ul>
          <p
            role="status"
            className={`mt-3 text-sm ${remaining === 0 ? "text-[#86EFAC]" : "text-[#FCD34D]"}`}
          >
            Assigned {assigned} of {maxImages}
            {remaining > 0 ? ` — ${remaining} more to assign` : ""}
            {remaining < 0 ? ` — ${-remaining} too many` : ""}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-[#D6DAE3]">
          {rooms.map((room) => `${room} ${even[room] ?? 0}`).join(", ")}
        </p>
      )}

      {rooms.length > maxImages ? (
        <p className="mt-2 text-sm text-[#FCD34D]">
          You picked {rooms.length} rooms but only {maxImages} images, so some rooms will get none.
        </p>
      ) : null}
    </div>
  );
}
