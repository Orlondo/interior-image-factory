/**
 * The wording used when an image is built from another one. The long prompt for a room says what the
 * room is; these lines say what to keep from the reference image and what may change.
 */

/** Camera positions for the other angles of one room (the first image is the room's own prompt). */
export const SET_ANGLES: readonly string[] = [
  "from the opposite corner, looking back across the room toward where the first view was taken",
  "at a low eye-level, centered on the main focal area of the room",
  "a closer view of the main furniture group, with the rest of the room softly visible behind it",
  "from the doorway, looking into the room",
  "from a high corner near the ceiling, looking down across the room",
  "a closer view of the window and the wall treatment beside it",
];

export function setAngleDirection(angle: number): string {
  return SET_ANGLES[(Math.max(1, angle) - 1) % SET_ANGLES.length] as string;
}

/** Another view of the room shown in the reference image. */
export function sameRoomPrompt(room: string, direction: string): string {
  return [
    `Photograph the exact same ${room} that is shown in the reference image, from a different camera position: ${direction}.`,
    "Keep the room identical: the same walls, wall color and finish, windows, ceiling and lights, flooring, furniture, decor, colors, materials and time of day.",
    "Do not add, remove or move any furniture; only the camera position changes. Keep the same photographic style and lighting.",
    "Photorealistic interior photograph, straight verticals, no people, no text, no distortion.",
  ].join(" ");
}

/** A different room of the house shown in the reference image. */
export function sameHousePrompt(room: string, roomPrompt: string): string {
  return [
    `The reference image shows one room of a house. Create a photograph of the ${room} of this same house.`,
    "Match the house's design language exactly so the two rooms clearly belong to one home: the same interior style, color palette, wall finishes, flooring, trim and baseboards, door and window style, ceiling treatment, light fixtures, metal finishes and level of finish.",
    "This is a different room: do not copy the reference room's layout, furniture or camera position, and do not show the reference room itself.",
    roomPrompt,
  ].join("\n\n");
}
