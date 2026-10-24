/**
 * Condition: what has happened to the room. Pristine adds nothing, so prompts at pristine are
 * identical to prompts before Condition existed. Dated and worn add wear and replace the staging
 * wording. Neglected and below also replace the lighting, atmosphere and photography wording and the
 * color rules that would otherwise keep pushing the room back toward "beautiful".
 */
export const conditions = ["pristine", "dated", "worn", "neglected", "abandoned", "derelict"] as const;
export type ConditionKey = (typeof conditions)[number];

export type ConditionProfile = {
  /** "Condition direction (critical)". Empty at pristine. */
  direction: string;
  /** "Surface wear". Empty at pristine. */
  wear: string;
  /** Replaces the Home quality staging line. */
  staging: string;
  /** Replaces the Home quality furniture line (worn and below). */
  furniture?: string;
  /** Replaces the clutter wording in the shared negative cues. */
  clutterNegative: string;
  /** Neglected and below: replaces the lighting bullets. */
  lightingLines?: string;
  /** Neglected and below: replaces the Home quality atmosphere line. */
  atmosphere?: string;
  /** Neglected and below: replaces the photography finish line. */
  cameraLine?: string;
  /** Neglected and below: replaces the Home quality composition target. */
  composition?: string;
  /** Neglected and below: replaces the Home quality negative cue. */
  negative?: string;
  /** Neglected and below: replaces the ceiling wording that follows the ceiling choice. */
  ceilingSuffix?: string;
  ceilingLightingSuffix?: string;
  defaultCeilingLighting?: string;
  /** Neglected and below: replaces the accent-color rule and the "prevent flat monotony" line. */
  accentRule?: string;
  sameness?: string;
  /** Neglected and below: how decay and the palette work together. */
  colorRule?: string;
  /** Neglected and below: Condition outranks the color rules in the priority line. */
  outranksColor: boolean;
};

const DECAY_COLOR_RULE =
  "Decay changes how the palette looks, never which colors it uses: keep every palette hue identifiable and apply it faded, stained, desaturated and uneven. The color intensity setting still sets how strong the palette is, lowered one notch by wear.";

const DECAY_LIGHTING = `- Dim, dusty light that arrives unevenly through dirty or boarded windows, with soft shadow falloff and dark corners
- Any ceiling fixtures are off, dead or flickering; no glow, no cove lighting, no accent lighting
- Realistic exposure that stays underlit, with no blown highlights and no sparkle
- Photoreal rendering, physically accurate materials`;

const DECAY_COMPOSITION =
  "Plain documentary framing with straight verticals and no staged focal point; the damage is the subject.";

const DECAY_NEGATIVE =
  "Avoid restored, renovated or freshly cleaned finishes, and avoid cartoonish excess.";

const DECAY_CAMERA =
  "plain documentary-style photography, muted contrast, natural uneven light, no editorial polish";

export const CONDITION_PROFILES: Record<ConditionKey, ConditionProfile> = {
  pristine: {
    direction: "",
    wear: "",
    staging: "",
    clutterNegative: "",
    outranksColor: false,
  },
  dated: {
    direction:
      "The room is clean but dated: furnishings and finishes from twenty to forty years ago that no one has updated, tired but cared for.",
    wear:
      "Worn carpet or laminate, yellowed switch plates and outlets, old builder-grade light fixtures, faded wallpaper or paint, heavy old window treatments.",
    staging:
      "Plain and lived-in, with a few mismatched older pieces; no styled vignettes and no designer staging.",
    furniture:
      "Older, mismatched pieces from past decades with worn upholstery; no curated styling and no layered rugs.",
    clutterNegative: "no heavy clutter, no styled vignettes",
    outranksColor: false,
  },
  worn: {
    direction:
      "The room has been used hard and not updated in years: everything works, but nothing is fresh.",
    wear:
      "Scuffed floors, scratched trim and door edges, chipped paint, sagging or stained upholstery, dull and cloudy finishes, mismatched replacement parts, faded patches where sun or furniture used to be.",
    staging:
      "Lived-in and a little messy, with leftover everyday objects; no staging and no styled vignettes.",
    furniture:
      "Sagging, stained, mismatched furniture and tired textiles; no curated styling and no layered rugs.",
    clutterNegative: "no staged vignettes, no freshly cleaned or showroom-perfect surfaces",
    outranksColor: false,
  },
  neglected: {
    direction:
      "The room has been neglected for years: still furnished, but visibly unloved, dirty and slowly failing.",
    wear:
      "Dust and grime on every surface, water stains on the ceiling and walls, peeling paint, stained or missing ceiling tiles, dirty windows, dead plants, boxes and objects left behind.",
    staging:
      "Furnished but untouched for years, with dust, leftover objects and some pieces out of place; no styling and no staging.",
    furniture:
      "Dusty, stained, damaged furniture left where it was; no curated styling, no layered rugs, no decor.",
    clutterNegative: "no freshly cleaned, polished or showroom-perfect surfaces",
    lightingLines: DECAY_LIGHTING,
    atmosphere: "Stale, dusty, quietly unsettling; a room people stopped caring about.",
    cameraLine: DECAY_CAMERA,
    composition: DECAY_COMPOSITION,
    negative: DECAY_NEGATIVE,
    ceilingSuffix: "stained, sagging in places and showing water damage",
    ceilingLightingSuffix: "dusty, dim and partly dead",
    defaultCeilingLighting: "dusty flush ceiling fixtures, some dead",
    accentRule:
      "Accent colors should be dull, faded and dusty, limited to what is left of fabrics, objects and painted surfaces.",
    sameness: "Let grime, stains and fading make surfaces uneven; do not keep tones neat or uniform",
    colorRule: DECAY_COLOR_RULE,
    outranksColor: true,
  },
  abandoned: {
    direction:
      "The room has been abandoned and left to rot: empty of people and care, with decay well advanced.",
    wear:
      "Heavy dust, peeling wall coverings, damp and mold patches, debris and fallen plaster on the floor, broken fixtures, hanging or missing ceiling tiles, a few pieces of furniture left tipped over or under dust sheets.",
    staging:
      "Abandoned: nearly empty, with debris, a few tipped or covered pieces of furniture, and no sign of anyone present.",
    furniture:
      "Almost none: a few broken or tipped pieces left behind, some covered with dust sheets; no curated styling, no rugs, no decor.",
    clutterNegative: "no clean, intact, polished or showroom-perfect surfaces, and no people",
    lightingLines: DECAY_LIGHTING,
    atmosphere: "Silent, damp and forgotten; a place left in a hurry and never returned to.",
    cameraLine: DECAY_CAMERA,
    composition: DECAY_COMPOSITION,
    negative: DECAY_NEGATIVE,
    ceilingSuffix: "stained, partly collapsed or hanging in places",
    ceilingLightingSuffix: "dead, broken or hanging loose",
    defaultCeilingLighting: "broken or missing ceiling fixtures with exposed wiring",
    accentRule:
      "Accent colors should survive only as faded, stained traces on fabrics, painted surfaces and left-behind objects.",
    sameness: "Let damp, mold, peeling and fading make surfaces patchy and uneven; do not keep tones neat or uniform",
    colorRule: DECAY_COLOR_RULE,
    outranksColor: true,
  },
  derelict: {
    direction:
      "The room is near ruin: the structure itself is failing, and nature and weather are taking it back.",
    wear:
      "Collapsed ceiling sections, exposed lath, beams and wiring, large water damage, rot and swollen floors, broken windows, moss, plants and puddles coming in, crumbling plaster, rusted metal.",
    staging:
      "Ruin: empty and open to the weather, with fallen debris and plant growth; no furniture worth the name and no sign of anyone present.",
    furniture:
      "Nothing intact: at most rotted fragments of furniture under debris; no styling and no decor.",
    clutterNegative: "no intact, clean or polished surfaces, no staging, and no people",
    lightingLines: DECAY_LIGHTING,
    atmosphere: "Ruined, damp and overgrown; the building is giving up.",
    cameraLine: DECAY_CAMERA,
    composition: DECAY_COMPOSITION,
    negative: DECAY_NEGATIVE,
    ceilingSuffix: "partly collapsed with exposed lath and beams",
    ceilingLightingSuffix: "gone, with only wiring left hanging",
    defaultCeilingLighting: "no working fixtures, only hanging wiring",
    accentRule:
      "Accent colors should be almost gone: only faint, bleached or stained traces on the remains of painted surfaces and objects.",
    sameness: "Let rot, rust, moss and water damage make surfaces patchy and uneven; do not keep tones neat or uniform",
    colorRule: DECAY_COLOR_RULE,
    outranksColor: true,
  },
};
