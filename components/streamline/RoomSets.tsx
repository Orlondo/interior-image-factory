"use client";

import { evenSplit } from "@/lib/roomMix";
import {
  MAX_ANGLES,
  describeSets,
  liveLimitMessage,
  planRoomSets,
  usesRoomSets,
} from "@/lib/roomSets";
import type { Setup } from "@/lib/setup";
import { CheckboxField, SelectField } from "./fields";

type RoomSetsProps = {
  setup: Setup;
  update: (patch: Partial<Setup>) => void;
};

const ANGLE_CHOICES = Array.from({ length: MAX_ANGLES }, (_, index) => index + 1);

/**
 * Two options that make images belong together: several angles of the same room, and rooms that look like
 * one house. Both build later images from an earlier one, so they run one image after another.
 */
export function RoomSets({ setup, update }: RoomSetsProps) {
  const { rooms, maxImages, roomSplitMode, roomCounts, anglesPerRoom, sameHouse } = setup;
  const counts =
    roomSplitMode === "custom" && rooms.length >= 2 ? roomCounts : evenSplit(rooms, maxImages);
  const sets = planRoomSets(rooms, counts, anglesPerRoom);
  const summary = describeSets(sets, anglesPerRoom, sameHouse);
  const limit = liveLimitMessage(maxImages, anglesPerRoom, sameHouse);
  const active = usesRoomSets(anglesPerRoom, sameHouse);

  return (
    <div className="rounded-[16px] border border-[#3A4252] bg-[#0F1115] p-4">
      <p className="text-sm font-medium text-[#98A2B3]">Same room, same house</p>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Angles per room"
          value={anglesPerRoom}
          onChange={(value) => update({ anglesPerRoom: Number(value) })}
          hint={
            anglesPerRoom > 1
              ? "Each room is made once, then shown again from other camera positions with the furniture, colors and light kept the same."
              : "Each image is its own room. Choose 2 or more to show one room from several angles."
          }
        >
          {ANGLE_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {choice === 1 ? "1 (each image is its own room)" : `${choice} angles of each room`}
            </option>
          ))}
        </SelectField>

        <div className="min-w-0">
          <span className="mb-2 block text-sm font-medium text-[#98A2B3]">Same house</span>
          <CheckboxField
            label="Make the rooms look like one house"
            checked={sameHouse}
            onChange={(checked) => update({ sameHouse: checked })}
          />
          <p className="mt-2 text-xs text-[#98A2B3]">
            {sameHouse
              ? sets.length > 1
                ? "Every room shares the first room's style, palette, floors, trim and windows."
                : "Pick two or more rooms (or more images) to see a house; one room has nothing to match."
              : "Off: each room is designed on its own."}
          </p>
        </div>
      </div>

      {active ? (
        <p role="status" className="mt-3 text-sm text-[#D6DAE3]">
          {summary || "Pick a room and a number of images."}
        </p>
      ) : null}

      {active ? (
        <p className="mt-2 text-xs text-[#98A2B3]">
          These are made one image after another, each from an earlier one, so they take longer than a normal
          batch and are limited to 24 images.
        </p>
      ) : null}

      {limit ? (
        <p role="status" className="mt-2 text-sm text-[#FCD34D]">
          {limit}
        </p>
      ) : null}
    </div>
  );
}
