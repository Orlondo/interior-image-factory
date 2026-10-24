# Spec: Room condition, and rooms that are not beautiful

**Status**: Implemented
**App**: interior-image-factory
**Related**: `specs/style-overrides/spec.md` (Liminal), `specs/home-quality/spec.md` (the same method)

## Goal

Make images that are deliberately off-putting: dated, worn, neglected, abandoned, derelict. Today every image is pushed toward "beautiful": tidy, bright, tasteful color, premium finish. Liminal spaces helped but cannot go further, because nothing in the app can say "this room is in bad shape", and every room type is a room people live in.

## What the code does today

- The prompt has no notion of condition. Shared lines say "no clutter", "tidy", "tasteful", "clean lines", "bright natural daylight", and "Keep output realistic, upscale, and materially coherent".
- The color rules ask for visible, cohesive accents and "prevent flat monotony". Decay washes color out and makes it uneven, so those rules fight it.
- The 22 room types are all rooms in a home. There is nothing for a hallway, stairwell, lobby, waiting room or empty office.

## Design

### 1. A Condition control (FR-001 to FR-008)

- **FR-001**: A new **Condition** select sits in the Room section beside Home quality. Steps, in order: **pristine** (the default), **dated**, **worn**, **neglected**, **abandoned**, **derelict**.
- **FR-002**: Pristine changes nothing. Prompts at pristine are identical, word for word, to prompts before this change. A test compares them with a stored snapshot.
- **FR-003**: Each other step adds a "Condition direction (critical)" line and a "Surface wear" line, and replaces the lines that contradict it:
  - the staging line and the "no clutter" negative cue
  - from **neglected** up, also the lighting bullets (dim, dusty light; grimy or boarded windows), the atmosphere line, the photography finish and composition target (plain documentary framing instead of "design magazine"), the ceiling wording, the accent-color rule, the "prevent flat monotony" line, and the tier's negative cue ("avoid cheap/basic finishes" becomes "avoid restored or freshly cleaned finishes")
  - from **worn** up, the furniture line (no curated styling or layered rugs)
- **FR-004**: What each step looks like (concrete cues, not only adjectives):

  | Step | Visible cues |
  |---|---|
  | dated | Styles and finishes from 20 to 40 years ago, tired but clean: worn carpet, laminate, yellowed switch plates, old light fixtures, faded wallpaper |
  | worn | Dated plus use: scuffed floors, scratched trim, sagging upholstery, chipped paint, mismatched replacement parts, no one has updated it in years |
  | neglected | Dust and grime on every surface, water stains on ceiling and walls, peeling paint, stained or missing ceiling tiles, dead plants, dirty windows, stuff left behind |
  | abandoned | Empty of people and care: heavy dust, peeling wall coverings, damp and mold patches, debris on the floor, broken fixtures, some furniture left tipped or covered |
  | derelict | Near ruin: collapsed ceiling sections, exposed lath and wiring, large water damage, rot, broken windows, plants and moss coming in, floor damage |

- **FR-005**: Home quality still sets the starting point: an abandoned Luxury room is a decayed grand room, an abandoned Builder's grade room is a decayed plain one. Materials, millwork, room scale and trim keep following the tier; the Condition lines say what has happened to them.
- **FR-006**: Priority is graded, so your color choices are not overridden where decay is mild:
  - **Dated and worn**: the priority line is unchanged. Color rules keep their rank above Condition, and Condition only adds wear.
  - **Neglected, abandoned and derelict**: the priority line becomes "Room Type > Condition > Color Strategy > ...", so decay can fade the color.
  - **The hue always stays.** From neglected up, a rule says decay changes saturation, brightness and evenness, never the hue, and the palette's color names stay in the prompt. An olive and walnut palette still reads as olive and walnut, only worn.
  - The Color intensity slider still sets how strong the color is; decay lowers it a notch.
- **FR-007**: Style overrides win over Condition for lighting and staging, so Liminal spaces plus Abandoned stays flat and artificial-lit with decay added. Condition wins over Home quality.
- **FR-008**: Condition is part of the setup: it is saved and restored with saved setups (older setups load as pristine), sent to the generate route, shown in the Room section summary ("modern · upscale · abandoned · ..."), and in the generation summary and filenames where Home quality already appears.

### 2. Rooms that are not beautiful (FR-009 to FR-011)

- **FR-009**: A new room category, **Transitional spaces**: hallway, stairwell, lobby, waiting room, empty office, indoor pool. They appear in the room picker as their own collapsible row, and are selectable like any room.
- **FR-010**: A new quick set, **Transitional places**, selects all six.
- **FR-011**: These rooms are written as places no one lives in; there is no new per-room wording beyond the room name. The Room size options (for example "standard room (180-280 sq ft)") were written for homes and may read oddly for a stairwell. That is a known limit; say so if it matters and I will add room-specific sizes.

## Not in this build

- Per-room condition (one condition applies to the whole batch).
- Extra condition-specific lighting for pristine or dated rooms.
- A "grungy" photography style (film grain, flash). Only Liminal has a plain snapshot look today.
- Reworking the color directive that says "upscale". Neglected and below get a Condition line that outranks it; the directive itself is untouched.

## Edge cases

- Condition plus Moody Luxury mood: Condition lighting applies from neglected up; below that, the mood lighting stays.
- Pristine plus any new room: works like any room, with the shared bright lighting. Pair a new room with Liminal spaces or a non-pristine condition for the intended look.

## Test plan

- Pristine prompts equal the stored snapshot, for several styles, tiers and moods.
- Every condition step produces a different prompt, with a measured difference between neighbors (target at least 6% of the words, like Home quality).
- The palette's color names appear in the prompt at every condition step. The priority line equals today's at pristine, dated and worn, and differs only at neglected and above.
- Non-pristine prompts contain none of "no clutter", "tidy", "Perfect spatial balance"; neglected and below contain none of "Bright natural daylight", "Prevent flat monotony" and "Accent colors should be present and visible".
- Condition plus Liminal keeps the Liminal lighting and adds the decay lines.
- Saved setups: an older setup loads as pristine; a new one round-trips.
- Room picker: the new category, the new quick set, and the filter work at 1200 and 375 px.
- Check by eye (yours): the same room at all six steps, then Liminal plus each of neglected, abandoned and derelict.

## Open questions

1. Step names. "Dated" and "worn" overlap for some people; "derelict" may be stronger than you want. Say if you want different words.
2. The six new rooms. Suggested swaps: parking garage, laundromat, motel room, school classroom.

## Implementation notes

- The wording lives in `lib/promptBuilder/condition.ts` (`CONDITION_PROFILES`), one profile per step, in the same way as `homeQuality.ts`. `buildPrompt` takes `condition` as a last, optional argument that defaults to pristine.
- Precedence for lighting, staging, furniture, atmosphere, composition and camera: a style override (Liminal) wins, then Condition, then Home quality. For lighting, Condition (neglected and below) also wins over the Moody Luxury mood.
- The generate payload carries `condition` only when it is not pristine, and the batch seed ignores it at pristine, so existing batches, saved payloads and seeds are unchanged.
- `tests/fixtures/prompt-hashes.json` holds a hash of 282 prompts taken before Condition existed (every style, tier and mood, and a grid of color strategy, coverage and intensity). `tests/condition.test.ts` checks that pristine prompts still match it. If you later change prompt wording on purpose, regenerate it.
- Step differences measured by the tests: neighbors at least 6% of the words, pristine versus derelict at least 20%.
- The Condition select sits beside Home quality, so the Room section's selects now share one row on desktop (four across) and wrap to two across and then one on narrower screens.
