/**
 * Some styles are about light, emptiness or framing more than furniture, and the shared prompt lines
 * (bright daylight, styled rooms, editorial photography) outvote them. A style listed here replaces
 * those shared lines. A style that is not listed gets the shared lines, unchanged.
 */
export type StyleOverride = {
  /** Replaces the bullet lines under "Lighting:". */
  lightingLines: string;
  /** Replaces the "8k detail, tack-sharp focus, ..." camera line. */
  cameraLine: string;
  /** Replaces the Home quality "Composition target". */
  composition: string;
  /** Replaces the Home quality "Atmosphere direction". */
  atmosphere: string;
  /** Replaces the Home quality staging line. */
  staging: string;
  /** Replaces the Home quality "Furniture and styling direction". */
  furniture: string;
  /** Replaces the "prevent flat monotony" line. */
  sameness: string;
  /** Used when no ceiling lighting is selected. */
  defaultCeilingLighting: string;
  /** One extra negative cue. */
  negative: string;
};

export const STYLE_OVERRIDES: Record<string, StyleOverride> = {
  "liminal spaces": {
    lightingLines: `- Flat, even artificial lighting from overhead fixtures (flush ceiling panels or recessed cans), slightly dim and slightly warm
- Soft, uniform shadows with no strong highlights; no sun beams and no dramatic shadows
- No glow, no cove lighting and no accent lighting; windows, if any, show an overcast or empty view
- Realistic exposure that stays a little underlit, with mild falloff toward the corners
- Photoreal rendering, physically accurate materials`,
    cameraLine:
      "plain, unstyled snapshot look, slightly muted contrast, subtle film grain, even artificial-light balance",
    composition:
      "Centered one-point perspective down a long sightline, with plain, unstyled framing and no focal styling.",
    atmosphere:
      "Still, quiet and impersonal, slightly uncanny: a place no one is using right now.",
    staging:
      "Empty or nearly empty: no people, and at most one or two plain, dated pieces of furniture; no styled vignettes, plants or decor accessories.",
    furniture:
      "Almost none: a few plain, functional pieces pushed to the walls or nothing at all; no curated styling, no rugs, no decor objects.",
    sameness:
      "Keep surfaces plain and repetitive; a mild flat, same-after-same look is intended, with no accent drama",
    defaultCeilingLighting: "evenly spaced flush ceiling panels or recessed cans",
    negative:
      "No people or pets, no dramatic sunbeams, no styled vignettes, no decorative clutter, no magazine or showroom look.",
  },
};
