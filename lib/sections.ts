export const SECTION_IDS = ["setups", "room", "look", "details", "output"] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type SectionState = Record<SectionId, boolean>;

export const SECTIONS_KEY = "iif.sections.v1";

/**
 * Room, Look and Output start open so defaults can be generated at once. Saved setups and Details
 * start closed: setups are used now and then, and Details is for fine tuning.
 */
export const SECTION_DEFAULTS: SectionState = {
  setups: false,
  room: true,
  look: true,
  details: false,
  output: true,
};

/** Parses saved open/closed state. Anything missing or malformed falls back to the default. */
export function parseSectionState(serialized: string | null): SectionState {
  if (!serialized) {
    return SECTION_DEFAULTS;
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    const source = (typeof parsed === "object" && parsed !== null ? parsed : {}) as Record<
      string,
      unknown
    >;

    return {
      setups: typeof source.setups === "boolean" ? source.setups : SECTION_DEFAULTS.setups,
      room: typeof source.room === "boolean" ? source.room : SECTION_DEFAULTS.room,
      look: typeof source.look === "boolean" ? source.look : SECTION_DEFAULTS.look,
      details: typeof source.details === "boolean" ? source.details : SECTION_DEFAULTS.details,
      output: typeof source.output === "boolean" ? source.output : SECTION_DEFAULTS.output,
    };
  } catch {
    return SECTION_DEFAULTS;
  }
}

export function setAllSections(open: boolean): SectionState {
  return { setups: open, room: open, look: open, details: open, output: open };
}
