# Spec: Tidier room picker (collapsible categories and quick sets)

**Status**: Implemented
**App**: interior-image-factory
**Builds on**: `specs/room-mix/spec.md` (FR-001 to FR-003). This changes how the chips are laid out; what you can select does not change.

## Goal

The Room Type picker showed all 22 room chips at once, which took a lot of vertical space for something set once per batch. Make it compact by default without hiding any room more than one click away, and add one-click sets for common choices.

## Design

### 1. Collapsible categories (FR-001 to FR-006)

- **FR-001**: Each category is one row: a chevron, the category name, a count badge ("2 of 6"), and the All toggle on the right. Clicking the row opens or closes its chips.
- **FR-002**: On load, categories that contain a selected room start open. If nothing is selected, the first category opens, so the picker never looks empty.
- **FR-003**: A closed row with selected rooms lists them on one line after the badge (truncated if long), so you can see what is chosen without opening it.
- **FR-004**: The All toggle works on a closed row. When it selects a category, that category opens.
- **FR-005**: The filter box still matches room names and category names. While filtering, every matching category is open and the rows cannot be toggled. Clearing the filter returns each category to its own open or closed state.
- **FR-006**: Rows are real buttons with `aria-expanded` and `aria-controls`, and work with Enter and Space. Select all and Clear all stay in the header.

### 2. Quick sets (FR-007 to FR-010)

- **FR-007**: A "Quick sets" row above the filter has one pill per set. These are the sets:
  - Main living areas: living room, family room, dining room, kitchen
  - Bedrooms & baths: bedroom, nursery, bathroom, walk-in closet
  - Work & storage: home office, pantry, laundry room, mud room
  - Entertaining: dining room, theater room, game room, wine cellar
- **FR-008**: Choosing a quick set **replaces** the current selection with its rooms (it does not add to it). Tick or untick rooms afterwards to adjust. The categories it touches open so the picks are visible.
- **FR-009**: A quick set shows as pressed only while the selection is exactly its rooms. Any change un-presses it.
- **FR-010**: Choosing a quick set follows the same rules as any room change: custom counts restart from an even split of the new rooms (see the room-mix spec, FR-004).

The set definitions live in `lib/roomPicker.ts` (`QUICK_SETS`). Room names that do not exist are dropped, and a set with fewer than two rooms is hidden.

## Not in this build

- Saving your own quick sets.
- Remembering which categories you left open between visits.

## Test plan

- Unit tests (`tests/room-picker.test.ts`): every quick set uses real room types with no repeats; unknown rooms are dropped; matching ignores order; which categories start open; the filter; counts and one-line summaries.
- Browser tests at 1200 px and 375 px: six rows with only the selected category open; the default layout is shorter than all open; Enter and Space; quick sets select, replace, press and un-press; custom counts restart evenly after a quick set; the filter opens and locks matching rows and restores state when cleared; All on a closed row; Select all and Clear all; no horizontal overflow; no clipped rows; no page errors; the request body for a quick set holds exactly its rooms.
