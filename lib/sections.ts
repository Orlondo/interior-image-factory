export const SECTION_IDS = ["room", "look", "details", "output", "results"] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type SectionState = Record<SectionId, boolean>;

export const SECTIONS_KEY = "iif.sections.v1";

/**
 * Room, Look, Output and Results start open so defaults can be generated at once. Details starts
 * closed: it is for fine tuning. (Saved setups live in the header, not in a section.)
 */
export const SECTION_DEFAULTS: SectionState = {
  room: true,
  look: true,
  details: false,
  output: true,
  results: true,
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
      room: typeof source.room === "boolean" ? source.room : SECTION_DEFAULTS.room,
      look: typeof source.look === "boolean" ? source.look : SECTION_DEFAULTS.look,
      details: typeof source.details === "boolean" ? source.details : SECTION_DEFAULTS.details,
      output: typeof source.output === "boolean" ? source.output : SECTION_DEFAULTS.output,
      results: typeof source.results === "boolean" ? source.results : SECTION_DEFAULTS.results,
    };
  } catch {
    return SECTION_DEFAULTS;
  }
}

export function setAllSections(open: boolean): SectionState {
  return { room: open, look: open, details: open, output: open, results: open };
}
