# Feature Specification: Room Picker and Room Mix

**Feature Branch**: `room-mix`

**Created**: 2026-10-22

**Status**: Implemented

**Input**: "When I choose several room types I want an equal number of each by default, with
an option to set exact counts (for example 20 images with only 5 kitchens). I also want to see
and click all the room types instead of typing to search."

## Context (verified in the code)

- **Picker today**: a search box. Room types appear only after you type, in a dropdown. The
  22 room types and their six categories exist in code but are hidden until searched.
- **Mix today is random.** `app/generate/route.ts` builds every combination for every selected
  room, interleaves them, shuffles them together, and takes the first Max images. Every room
  has the same number of combinations (the other settings do not depend on the room), so the
  expected share is equal, but the actual split is luck. With 20 images and two rooms you can
  get 13 and 7.
- The request already sends `rooms` and `maxImages`. There is no per-room count.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See and Click Every Room Type (Priority: P1)

As a user, I see all room types grouped by category and select any number of them by clicking,
and I can still type to filter.

**Independent Test**: Load the page. All 22 room types are visible without typing. Clicking one
toggles it. Typing "kit" shows only matching room types.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** I view Room, **Then** every room type is visible as a chip,
   grouped under Living, Private, Service, Entertainment, Fitness and Utility spaces.
2. **Given** a chip, **When** I click it, **Then** it toggles and shows a clear selected state.
3. **Given** I type in the search box, **When** text matches, **Then** only matching chips (and
   categories) are shown; clearing the box shows all again.
4. **Given** I press Enter in the search box with matches, **Then** the first match toggles.
5. **Given** Select all and Clear all, **Then** they behave as today.
6. **Given** each category, **Then** it has its own All toggle for that category.

### User Story 2 - Even Split by Default (Priority: P1)

As a user who selects several room types, I get an equal number of images for each by default.

**Independent Test**: Select kitchen and living room with Max images 20. The server generates
10 kitchens and 10 living rooms.

**Acceptance Scenarios**:

1. **Given** two or more rooms, **When** I generate with no other changes, **Then** images are
   split evenly across the selected rooms.
2. **Given** a split that does not divide evenly (20 images, 3 rooms), **Then** the rooms
   earlier in the selection order get one extra (7, 7, 6), and the page shows this split
   before I generate.
3. **Given** more rooms than images (12 images, 22 rooms), **Then** the page warns that some
   rooms would get no image, and tells me to select fewer rooms or raise Max images.
4. **Given** one room, **Then** no split controls are shown and behavior is unchanged.

### User Story 3 - Set Exact Counts per Room (Priority: P1)

As a user, I can choose exact counts, such as 5 kitchens and 15 living rooms out of 20.

**Independent Test**: Choose "Set counts", enter 5 and 15 with Max images 20, generate. The
server generates exactly 5 kitchens and 15 living rooms.

**Acceptance Scenarios**:

1. **Given** two or more rooms, **When** I choose "Set counts", **Then** a number field appears
   for each selected room, prefilled with the even split.
2. **Given** custom counts, **When** they do not add up to Max images, **Then** the page shows
   "Assigned X of N" and Generate is disabled with a clear message.
3. **Given** custom counts, **When** I change Max images, **Then** the counts rescale to keep
   their ratios and still add up.
4. **Given** I select or deselect a room while in custom mode, **Then** the counts reset to the
   even split for the new set of rooms.
5. **Given** a count of 0 for a room, **Then** that room generates no images.
6. **Given** I switch back to "Split evenly", **Then** custom counts are discarded.

### User Story 4 - Summary Says What Will Happen (Priority: P2)

As a user, the Output summary and Generation Summary state the split.

**Acceptance Scenarios**:

1. The Output line reads like "20 images: kitchen 10, living room 10".
2. With a single room, the summary is unchanged.

### Edge Cases

- A room's own combination pool is smaller than its count: images repeat with different color
  variations, as today.
- A room's pool is very large (over 5,000): the server samples directly, as today.
- Saved setups from before this change load with the even split (no counts).
- A request without `roomCounts` (old clients, saved payloads) still works and gets the even
  split, not a random mix.
- Invalid `roomCounts` (rooms not selected, negative or non-integer counts, wrong total) is
  rejected with a clear 400 error rather than silently changed.
- Keyboard and screen reader use: chips are buttons with `aria-pressed`; count fields have labels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Room section MUST show every room type as a toggle chip grouped by category.
- **FR-002**: The search box MUST filter the visible chips instead of opening a dropdown.
- **FR-003**: Each category MUST have an All toggle; Select all and Clear all MUST remain.
- **FR-004**: With two or more rooms selected, the page MUST offer "Split evenly" (default) and
  "Set counts".
- **FR-005**: The even split MUST be computed by one shared function used by both the page and
  the server, so what the page shows is what the server does (`lib/roomMix.ts`).
- **FR-006**: The request MUST add an optional `roomCounts` object (room name to count) only
  in "Set counts" mode. For the default even split the request is unchanged.
- **FR-007**: The server MUST generate exactly `roomCounts[room]` images per room when valid,
  and the even split when `roomCounts` is absent.
- **FR-008**: The server MUST reject `roomCounts` whose rooms are not all selected, whose counts
  are not whole numbers of at least 0, or whose total differs from `maxImages`.
- **FR-009**: Within a room, scenarios are chosen as today: a random sample without repeats when
  the room's pool is large enough, otherwise cycling with color variation.
- **FR-010**: The final list MUST still be shuffled so rooms are mixed in the results.
- **FR-011**: Generate MUST be disabled while custom counts do not add up, with an explanation.
- **FR-012**: Saved setups MUST store the split mode and counts, and old setups MUST still load.
- **FR-013**: Styling MUST follow `ui-modernization/design-system.md`, including the raised
  button and chip fills from Build A.

### Key Entities

- **Room split**: `{ mode: "even" | "custom", counts: Record<room, number> }` held in the page
  setup. Only `counts` for the selected rooms matter.
- **Even split**: `base = floor(total / rooms)`; the first `total mod rooms` rooms in selection
  order get one extra.

### Constitution Alignment *(mandatory)*

- **CA-001 (Clean Code)**: Split logic lives in one pure module with tests; new components stay
  under 400 lines.
- **CA-002 (Simple UI)**: Split controls appear only when two or more rooms are selected.
- **CA-003 (Responsive)**: Chips wrap; count fields stack on mobile; no horizontal scroll.
- **CA-004 (Minimal Dependencies)**: No new dependency.

## Success Criteria *(mandatory)*

- **SC-001**: With kitchen and living room selected and Max images 20, the server produces
  exactly 10 and 10; with custom 5 and 15 it produces exactly 5 and 15 (verified by running the
  real route handler with a fake image client).
- **SC-002**: All 22 room types are visible and clickable on first load without typing.
- **SC-003**: The default request for a single room is identical to today's.
- **SC-004**: The page's displayed split always equals the server's split (same function).
- **SC-005**: No horizontal scroll at 375px with the picker and count fields shown.

## Assumptions and Open Questions

- **Decided here, change if you disagree**: uneven splits give the extra image to rooms earlier
  in the selection order, so the result is predictable and visible before generating.
- **Open 1 - total in custom mode**: keep Max images as the fixed total and require the counts
  to add up (recommended), or let the total come from the counts and hide Max images.
- **Open 2 - rooms outnumber images**: only warn (recommended), or block Generate.
- A correction to an earlier remark: every room has the same number of combinations, so rooms
  are not weighted differently today; the split is simply unpredictable.
