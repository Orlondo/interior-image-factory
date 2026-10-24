# Feature Specification: UI Streamline (Regroup + Look Picker)

**Feature Branch**: `ui-streamline`

**Created**: 2026-10-22

**Status**: Implemented (pending your review in the browser)

**Input**: User description: "Streamline the selections page. It can keep as many options as it has, but present them in a more streamlined, efficient way."

## Context

The page already has collapsible sections (see `ui-redesign`, `ui-modernization`), but the
visible Main Prompt Setup still holds 10 controls, six of them overlapping color controls
(Color mood, Color strategy, Palette family, Color intensity + Auto palette variation, Color
coverage). The code ranks them in a hidden priority order (Strategy > Coverage > Intensity >
Palette Family > Mood), which users cannot see. Other color controls are scattered: Color
profile sits in Optional Details and Randomize wall color sits in Advanced Settings. Room
size lives alone in "Layout Details". Output settings (aspect ratio, max images, file size)
are split across two places and away from Generate. `app/page.tsx` is about 1,400 lines.

This spec changes presentation and grouping only. No option is removed and the generate
payload does not change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick a Look Instead of Six Color Dropdowns (Priority: P1)

As a user, I choose one named Look (for example "Moody Luxury" or "Organic Earthy") and see
a swatch preview, instead of setting six color controls whose interaction I cannot see.

**Why this priority**: Color is the most confusing and most-used area, and it is where most
of the visible clutter is.

**Independent Test**: Load the page. Exactly one color control (the Look picker) is visible
by default. Selecting a Look sets the underlying color fields and the request payload
contains the same field names as today.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** I view the Look section, **Then** the default Look
   equals today's defaults (Warm Neutral, Designer Layered, Architectural Surfaces,
   intensity 25, Auto palette family, Auto palette variation on).
2. **Given** I pick a Look, **When** I open "Customize colors", **Then** every underlying
   control (Mood, Strategy, Palette family, Intensity, Coverage, Auto palette variation,
   Color profile, Wall color palette, Randomize wall color) shows the value the Look set.
3. **Given** I change any underlying control, **When** it no longer matches a Look, **Then**
   the picker shows "Custom".
4. **Given** a Look is selected, **When** I view the preview, **Then** swatches for the
   current palette are shown (using the existing `getColorPreviewData`).

---

### User Story 2 - Group Controls by Decision (Priority: P1)

As a user, I find controls in four sections that match how I think: Room, Look, Details,
Output.

**Why this priority**: Directly addresses "more streamlined, efficient" presentation.

**Independent Test**: Verify each control appears in exactly one section and none is lost.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** I view Room, **Then** it contains Room type, Interior
   design style, Home quality, and Room size.
2. **Given** the page loads, **When** I view Output, **Then** it contains Aspect ratio, Max
   images, and File size, adjacent to Generate and the summary.
3. **Given** the page loads, **When** I open Details, **Then** it contains Wall type, Window
   style, Ceiling type, Ceiling lights, Focal points, and Outside view as collapsed groups.
4. **Given** any checkbox group, **When** I use All, **Then** existing All behavior is
   unchanged (FR-008 of `ui-redesign`).

---

### User Story 3 - See What Will Be Generated (Priority: P2)

As a user, I see how many combinations my selections produce and how many images will
actually be generated.

**Why this priority**: Multi-select groups multiply into many scenarios; today the summary
does not say so.

**Independent Test**: Select several walls and windows. The summary shows the combination
count and the image count.

**Acceptance Scenarios**:

1. **Given** multi-selects in Details, **When** the selection changes, **Then** the summary
   updates the combination count and "will generate N images".
2. **Given** the combination count exceeds Max images, **When** I view the summary, **Then**
   it states that the batch is capped at Max images.

---

### User Story 4 - Surprise Me and Saved Setups (Priority: P2)

As a user, I can randomize a Details group in one click and save and reload my own Looks and
full setups.

**Why this priority**: Reduces repeated clicking and supports the preset idea from the 2.0
list.

**Independent Test**: Save a setup, reload the page, apply it, and confirm all controls match.

**Acceptance Scenarios**:

1. **Given** a Details group, **When** I click "Surprise me", **Then** a random valid subset
   is selected for that group only.
2. **Given** I click "Save look" or "Save setup", **When** I name it, **Then** it appears in
   the picker and persists across reloads (browser localStorage, no new dependency).
3. **Given** a saved item, **When** I delete it, **Then** it is removed and built-in Looks
   cannot be deleted.

---

### User Story 5 - Smaller, Maintainable Page (Priority: P3)

As the maintainer, I have `page.tsx` split into section components so no component file
exceeds 400 lines.

**Independent Test**: Line counts per file; behavior identical per the payload snapshot test.

---

### Edge Cases

- A Look must only set fields that exist today; unknown or legacy values must fall back to
  defaults without errors.
- Selecting "Neutral Base" or "Decor Only" in Customize switches on the legacy neutral
  guardrails in the prompt builder. The UI should say so in a hint.
- Mobile: no horizontal overflow; the Look picker and swatches stack cleanly; tap targets
  stay at least 42px high.
- Deleting a saved item that is currently applied leaves the current values and shows "Custom".
- localStorage unavailable or full: saving fails with a clear message; the page still works.
- Existing requests and defaults produce an identical payload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST present four sections: Room, Look, Details, Output.
- **FR-002**: Room MUST contain Room type, Interior design style, Home quality, Room size.
- **FR-003**: Look MUST show one picker (built-in Looks, saved Looks, "Custom") and a swatch
  preview; all other color controls MUST be inside a collapsed "Customize colors" panel.
- **FR-004**: "Customize colors" MUST contain Color mood, Color strategy, Palette family,
  Color intensity, Auto palette variation, Color coverage, Color profile, Wall color
  palette, and Randomize wall color.
- **FR-005**: Details MUST contain Wall type, Window style, Ceiling type, Ceiling lights,
  Focal points, Outside view, collapsed by default, with a per-group "Surprise me".
- **FR-006**: Output MUST contain Aspect ratio, Max images, File size, placed with the
  generation summary and Generate button.
- **FR-007**: No existing option or default value may be removed or changed.
- **FR-008**: The generate request payload MUST be identical to today's for identical
  selections (verified by a snapshot test).
- **FR-009**: The summary MUST show combination count and images to be generated, and the cap.
- **FR-010**: Saved Looks and saved setups MUST persist in localStorage and be deletable.
- **FR-011**: Layout MUST work on mobile, tablet, and desktop without horizontal overflow.
- **FR-012**: Styling MUST follow `ui-modernization/design-system.md`.
- **FR-013**: Color intensity MUST be a six-step control (Very muted, Muted, Soft, Balanced,
  Expressive, Bold) instead of a 0-100 slider. Each step sends one fixed number, chosen so
  the default stays 25: Very muted 5, Muted 15, Soft 25, Balanced 50, Expressive 70, Bold 90.
  The payload field stays `colorIntensity` (a number), so the API and prompt builder bands
  (0-10, 11-20, 21-40, 41-60, 61-80, 81-100) are unchanged. A short hint states that
  intensity sets the strength of color and Coverage sets where it appears.

### Starter Looks (as built; tune after reviewing generated images)

Intensity uses the six steps from FR-013, so values differ slightly from the first draft.

| Look | Mood | Strategy | Coverage | Intensity step | Palette family |
|------|------|----------|----------|----------------|----------------|
| Designer Layered (default) | Warm Neutral | Designer Layered | Architectural Surfaces | Soft (25) | Auto |
| Warm Neutral Classic | Warm Neutral | Neutral Base | Decor Only | Muted (15) | Auto |
| Organic Earthy | Organic Earthy | Nature Inspired | Softly Distributed | Balanced (50) | Earthy Mixed |
| Light & Airy | Light & Airy | Accent Color | Softly Distributed | Soft (25) | Auto |
| Coastal | Coastal Neutral | Accent Color | Softly Distributed | Soft (25) | Cool Mixed |
| Gallery | Warm Neutral | Gallery Inspired | Softly Distributed | Balanced (50) | Auto |
| Moody Luxury | Moody Luxury | Statement Room | Architectural Surfaces | Expressive (70) | Jewel Tone Mixed |
| Deep Color Drenched | Moody Luxury | Color Drenched | Whole Room | Bold (90) | Jewel Tone Mixed |

All Looks keep Auto palette variation on.

### Key Entities

- **Look**: A named set of the nine color-related fields plus an optional swatch preview.
- **Saved Setup**: A named snapshot of all page selections, stored in localStorage.
- **Section**: Room, Look, Details, or Output; each owns its own component file.

### Constitution Alignment *(mandatory)*

- **CA-001 (Clean Code)**: One component per section, logic passed down by props, no file over
  400 lines, no dead code.
- **CA-002 (Simple UI)**: One color control by default instead of six; safe defaults unchanged.
- **CA-003 (Responsive)**: All new controls usable at mobile widths.
- **CA-004 (Minimal Dependencies)**: No new dependency; localStorage and existing helpers only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visible controls on first load drop from 10 in Main Prompt Setup to 4 (Room)
  plus 1 (Look picker), with Output beside Generate.
- **SC-002**: A user can generate with defaults without opening any collapsed section.
- **SC-003**: Request payload snapshot is byte-identical to today's for the same selections.
- **SC-004**: No component file exceeds 400 lines.
- **SC-005**: Every option present before this change is still reachable.

## Assumptions and Open Questions

- **Verify before building**: how Max images caps the combination count in
  `app/generate/route.ts`; the summary text must match the real behavior.
- **(Resolved) Single-color picks are gone from the UI.** The Palette family dropdown offers only six
  mixed families. The 12 single hero colors (Teal, Olive, Terracotta, and so on) exist only
  as legacy payload values. Decision needed: restore a single-color picker in
  "Customize colors"?
- **Color conflicts are out of scope but affect Look results**: `image-variety/spec.md` still
  says to avoid blue and saturated walls; Randomize wall color draws from only two palettes
  unless "earthy saturated" is the only profile; some negative cues apply to every prompt.
  Recommend fixing these before or together with this feature so Looks behave as labeled.
- **Intensity redesign (decided):** the prompt builder only changes wording at band edges, so
  a continuous slider implies precision that does not exist. Intensity beats Coverage on
  strength; Coverage decides placement. Low-intensity prompt wording is already implemented.
- The first version is a single scrolling page. A step-by-step wizard is a possible later
  change.

## Implementation Notes (as built)

- **A Look sets six fields**: mood, strategy, coverage, palette family, intensity, auto palette
  variation. Color profile and Randomize wall color live in "Customize colors" but are not set
  by a Look, so choosing a Look never silently resets them.
- **There is no "Wall color palette" control.** The page never had one (the server picks the
  default), so none was added. FR-004 lists it by mistake.
- **Palette preview shows color names, not swatches.** The palette data has names such as
  "olive" and "ivory and limestone", not hex values.
- **Extras beyond the spec**: a Reset button that restores defaults, and a "Delete this Look"
  button that appears when a saved Look is active.
- **Batch summary rule (verified in `route.ts`)**: the server always generates exactly Max
  images. More combinations than Max gives a random sample; fewer cycles through them again.
- **Server guard (done)**: above 5,000 combinations the server samples `maxImages` combinations
  directly instead of listing them all (`lib/scenarioSampling.ts`). A test request with 8.3
  million combinations returns in milliseconds; the old code ran out of memory. Selections of
  5,000 or fewer take the original path, so their results are unchanged.

## Addendum: Section Look and Behavior (Build A)

Decisions made after the first build, written down so the record stays in one place.

- **FR-014**: Every section card MUST show an inline SVG icon in a muted tinted badge and a
  matching 3px left edge. Tints are defined in `ui-modernization/design-system.md`. No icon
  library is added.
- **FR-015**: Room, Look, Details and Output MUST be collapsible. Room, Look and Output start
  open and Details starts closed, so defaults can still be generated without opening anything.
- **FR-016**: A collapsed section MUST show a one-line summary of its current choices.
- **FR-017**: Generate and Saved setups are not collapsible. Generate is always open.
- **FR-018**: Expand all and Collapse all buttons MUST affect the four main sections only.
- **FR-019**: Open or closed state is remembered in the browser. If storage is blocked, it still
  works for the current page view and is forgotten on reload.
- **FR-020**: Inner collapsing (Customize colors, Details groups, Prompt Preview) is unchanged.
- **FR-021**: Buttons, chips and intensity steps MUST use a raised fill and a clear border so
  they stand out from their card (minimum 1.15:1 luminance ratio against the card).
- Out of scope: a sticky section navigator, and larger section headings with descriptions.

## Update: pinned title, collapsible Saved setups, collapsed Prompt Preview

This supersedes FR-015, FR-017 and FR-018 above where they say Saved setups is not collapsible and that Expand all and Collapse all cover four sections.

- **Pinned header.** The page has a title bar, "Interior Image Factory" ("Image Factory" on narrow screens), pinned to the top of the screen while you scroll, like the Channel Studio header. Expand all and Collapse all moved into it. The browser tab title is now "Interior Image Factory".
- **Saved setups collapse.** Saved setups is now the fifth collapsible section and starts closed, with a one-line summary ("none saved yet" or "3 saved"). Expand all and Collapse all include it. Open/closed state saved before this change still loads: the sections keep their state and Saved setups starts closed.
- **Prompt Preview starts collapsed.** It still shows the coverage and intensity summary while closed, and opens on click.
- Test coverage: `tests/sections.test.ts` (defaults, older saved state, expand/collapse all) and a browser run at 1200 px and 375 px (pinned header while scrolled, no clipped title or buttons, collapsed defaults, remembered state, no overflow).

## Update: Saved setups moved to the header

This supersedes the "Saved setups collapse" bullet above.

- **Setups button in the pinned header.** A "Setups" button (with a count once you have saved some) opens a small panel: choose a saved setup and Apply or Delete it, name and save the current page, or reset the page. Apply and Reset close the panel; Escape or a click outside also closes it. On a phone the panel spans the screen width below the header.
- **No Saved setups section.** There are four collapsible sections again (Room, Look, Details, Output), and Expand all and Collapse all cover those four. State saved while Saved setups was a section still loads; its `setups` value is ignored.
- Buttons in the header are slightly smaller below 640 px so the title stays readable.
- Test coverage: `tests/sections.test.ts`, and a browser run at 1200 px and 375 px (button in the header, panel inside the viewport, empty name rejected, save, count, apply, delete, persistence after reload, Escape and outside click, panel while scrolled, no page errors).

## Update: Saved setups row in the pinned header

Supersedes the header "Setups" button and panel.

- Saved setups live in a second row of the sticky header, below the title and the Expand/Collapse buttons. It is a working control, not a single button.
- Row contents: bookmark icon, "Setups" label (sm and up) with a count pill, a select of saved setups, an explicit **Apply** button (disabled until a setup is chosen), **Save current…**, and a **⋯** menu (Delete selected setup, Reset page to defaults).
- Choosing a setup in the select does not change the page; only Apply does.
- Save is inline: the row switches to a name field with Save and Cancel. Enter saves, Escape cancels. An empty name shows "Enter a name."
- Status messages ("Setup applied.", saved, deleted) appear in a small `role="status"` pill below the row and clear after 3 seconds.
- Phones (max-width 639px): the row hides when scrolling down and returns when scrolling up or near the top. It stays visible while a control inside it has focus. Desktop: always visible.
- The header keeps a constant height. The hidden row slides up and fades (translate and opacity) and is `inert`, so the page never jumps and hidden controls cannot be tabbed to.
- Below sm, the app icon is hidden and header button padding shrinks so the title fits at 375px.
- Logic is in `lib/scrollDirection.ts` (`nextHidden`), `lib/useHideOnScroll.ts` and `lib/useMediaQuery.ts`; tests in `tests/scroll-direction.test.ts`.
