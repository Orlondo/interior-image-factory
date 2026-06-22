# Feature Specification: UI Modernization

**Feature Branch**: `ui-modernization`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "Transform the app from a dense settings form into a sleek, minimal, premium AI image-generation interface"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Configure Core Inputs Quickly (Priority: P1)

As a user, I can see the main generation controls immediately and configure a generation without digging through dense form sections.

**Why this priority**: This is the highest-value flow and directly addresses the current cluttered first impression.

**Independent Test**: On first load, verify Room Type, Interior Design Style, Home Quality, Aspect Ratio, Max Images, and Generate are immediately visible and usable.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** the user views the interface, **Then** primary controls are visible without expanding optional sections.
2. **Given** the user selects primary controls, **When** they click Generate, **Then** generation starts with selected values.

---

### User Story 2 - Use Optional Details Without Clutter (Priority: P2)

As a user, I can access optional controls through collapsible sections so the interface stays clean while retaining full capability.

**Why this priority**: Advanced and secondary controls are still needed, but should not overwhelm first-time and repeat users.

**Independent Test**: Verify all optional groups are collapsed by default, can be expanded independently, and preserve current All selection behavior.

**Acceptance Scenarios**:

1. **Given** optional sections are collapsed, **When** a user expands one section, **Then** all existing options in that section are available.
2. **Given** a collapsed optional group, **When** selections exist, **Then** collapsed state shows selected count.

---

### User Story 3 - Manage Advanced Settings and Review Summary (Priority: P3)

As a user, I can open advanced settings when needed and review a clean summary before generation.

**Why this priority**: Keeps default experience minimal while preserving power-user control and improving confidence before generation.

**Independent Test**: Verify Advanced Settings is collapsed by default, includes File Size and Randomize Wall Color, and summary card reflects current selected values.

**Acceptance Scenarios**:

1. **Given** Advanced Settings is collapsed, **When** the user opens it, **Then** File Size and Randomize Wall Color are available.
2. **Given** current selected values, **When** user reaches generate area, **Then** summary card shows room/style/quality plus aspect ratio and image count.

---

### User Story 4 - Use Primary Controls Cleanly Across Screen Sizes (Priority: P1)

As a user, I can configure Interior Design Style and Home Quality with compact controls that stay readable and usable on desktop, tablet, and mobile.

**Why this priority**: These selectors are part of the primary flow and currently consume too much vertical space, especially on smaller screens.

**Independent Test**: Verify the page does not overflow horizontally, Interior Design Style and Home Quality each fit in a compact row, and the UI stacks cleanly on small screens without changing defaults or generation behavior.

**Acceptance Scenarios**:

1. **Given** the page is viewed on a mobile-width screen, **When** the user reaches the primary controls, **Then** the layout stacks cleanly without horizontal overflow.
2. **Given** the user configures Interior Design Style, **When** they open the control, **Then** all current style options remain available in a compact dropdown-style selector.
3. **Given** the user configures Home Quality on any screen size, **When** they open the control, **Then** all current quality options remain available in a compact selector that fits on one row.
4. **Given** the user reaches the generate area on a small screen, **When** they review the summary, **Then** the summary remains readable without breaking the layout.

---

### User Story 5 - Track Generation Progress Clearly (Priority: P1)

As a user, I can see what is happening after I click Generate so I know the app started working, is still active, and whether it completed, failed, or was cancelled.

**Why this priority**: Generation can take time, so clear status feedback is essential to trust and to prevent repeated clicks.

**Independent Test**: Verify a status area appears near Generate and the Generation Summary only while generation is active, displays human-readable states, disables Generate, keeps Cancel visible, and shows completion, error, or cancelled outcomes.

**Acceptance Scenarios**:

1. **Given** the user clicks Generate, **When** generation starts, **Then** a progress/status area appears near the Generate controls with a human-readable status message.
2. **Given** generation is active, **When** exact progress is unavailable, **Then** the UI shows an indeterminate loading indicator and keeps Cancel available.
3. **Given** generation finishes, fails, or is cancelled, **When** the process ends, **Then** the user sees a clear success, error, or cancelled status outcome.
4. **Given** generation is active, **When** the user looks at the Generate button, **Then** Generate is disabled and cannot be clicked repeatedly.

---

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Multi-select room cards must preserve existing multi-select behavior.
- If style remains single-select, selecting a style must deselect the previously selected style.
- Collapsed optional groups must show accurate selected count even after selections change.
- Existing defaults must remain unchanged after modernization.
- Existing generation request behavior must remain unchanged after UI presentation changes.
- Primary controls must not cause horizontal page overflow on desktop, tablet, or mobile.
- Compact style and quality selectors must preserve all existing options and default selections.
- Progress UI must handle flows where exact completion percentage is unavailable.
- Cancelled and error states must be distinguishable from successful completion.
- Room Type category grouping must not change selected room values sent to generation.

## Requirements *(mandatory)*

## Responsive Control Update

### Problem

The current UI is not responsive enough and some selector groups take up too much vertical space.

### Requirements

- The layout must work on desktop, tablet, and mobile.
- The page must not overflow horizontally.
- Interior Design Style must use a compact selector instead of large chips.
- Home Quality must use a compact selector instead of large chips.
- Preserve all current options.
- Preserve current default values.
- Do not change generation logic.

### Preferred Controls

Interior Design Style:

- Use a searchable dropdown or standard dropdown.

Home Quality:

- Use a compact dropdown.
- A segmented control is acceptable on desktop only if it collapses cleanly on mobile.

### Acceptance Criteria

- Interior Design Style takes up one compact row.
- Home Quality takes up one compact row.
- The UI stacks cleanly on small screens.
- Generate Summary remains readable on mobile.

## Generation Progress Indicator

### Goal

Show users what is happening after they click Generate.

### Requirements

- Show a status/progress area only while generation is active.
- Place it near the Generate button and Generation Summary.
- Use clear human-readable status text.
- Do not change image-generation logic or API routes.

### Status States

The UI should support these states:

- Idle
- Preparing prompt
- Sending request
- Generating images
- Complete
- Error
- Cancelled

### Visual Behavior

- While active, show a subtle progress indicator.
- Use a progress bar if real progress is available.
- Use an indeterminate loading bar or spinner if exact progress is not available.
- Show the current status message.
- Disable Generate while generation is active.
- Keep Cancel visible while generation is active.

### Acceptance Criteria

- User can tell generation has started.
- User can tell the app is still working.
- User sees success, error, or cancelled status.
- Generate cannot be clicked repeatedly during active generation.
- Cancel remains available during active generation.

## Progressive Disclosure

### Optional Details

- Must be collapsible.
- Collapsed by default.
- Show selected count when collapsed.

Example:

Optional Details
4 customizations selected

### Layout Details

- Must be collapsible.
- Collapsed by default.
- Show current room size when collapsed.

### Advanced Settings

- Must be collapsible.
- Collapsed by default.
- Show active settings summary when collapsed.

### Acceptance Criteria

- First-time users can generate images without opening any advanced section.
- Advanced controls remain available.
- Page length is significantly reduced on first load.
- Generate button is visible without excessive scrolling.

## Room Type Categories

### Goal

Group room types into clear residential categories so the Room Type selector is easier to scan.

### Categories

Living Spaces:

- Living Room
- Sunken Living Room
- Family Room

Private Spaces:

- Bedroom
- Home Office

Service Spaces:

- Pantry
- Laundry Room
- Mud Room

Entertainment Spaces:

- Theater Room
- Game Room

Fitness Spaces:

- Home Gym

Utility Spaces:

- Basement

### Requirements

- Room Type options must be visually grouped by category.
- Category labels should be visible in the Room Type selector.
- Existing selected room behavior must remain unchanged.
- Multiple room selection must continue to work.
- Existing room types must remain available.
- Newly listed future room types may be added if not already present.

### Acceptance Criteria

- User can easily scan room types by category.
- Selecting a room type works the same as before.
- Batch generation and prompt generation still receive the selected room values.

## Room Type Selector Redesign

### Goal

Reduce visual clutter while supporting a growing number of room types.

### Problem

The current Room Type section displays all room categories and room types simultaneously. As additional room types are added, the interface becomes increasingly difficult to scan.

### New Design

Replace the current room type grid with a searchable multi-select room picker.

### Search Input

Display: "Search room types..."

Users should be able to search by:

- Room name
- Category name

Examples:

- `home` → Home Office, Home Gym
- `room` → Living Room, Family Room, Theater Room, Laundry Room

### Results

Results should remain grouped by category.

Example:

```
Living Spaces
- Living Room
- Family Room

Private Spaces
- Home Office
```

### Selection

Selecting a room adds it to the selected rooms area. Selected rooms should appear as removable chips.

Example:

```
Selected Rooms

[ Living Room ]
[ Home Office ]
[ Theater Room ]
```

### Removal

Users can remove selected rooms directly from chips.

### Categories

Categories remain part of the underlying data structure.

Current categories:

- Living Spaces
- Private Spaces
- Service Spaces
- Entertainment Spaces
- Fitness Spaces
- Utility Spaces

### Batch Generation

Multi-select behavior must continue to work. Selected room types must continue to participate in batch generation.

### Accessibility

- Fully keyboard navigable
- Search field receives focus correctly
- Enter selects highlighted option
- Escape closes results

### Select All Rooms

- User must be able to select all room types.
- Add a compact "Select all rooms" action near the Room Type search field.
- Add a "Clear all rooms" action when one or more rooms are selected.
- Selecting all rooms must select every room type across every category.
- Clearing all rooms must remove every selected room type.
- This must preserve batch generation behavior.

### Acceptance Criteria

- All room types are searchable.
- Selected rooms appear as chips.
- Room categories remain visible in search results.
- Multi-select continues to function.
- Batch generation continues to function.
- Room Type section occupies substantially less vertical space.

## Main Prompt Setup Order

### Goal

Arrange the primary controls in the same order a designer thinks through a room concept.

### Required Order

1. Room Type
2. Interior Design Style
3. Color Mood
4. Home Quality
5. Aspect Ratio
6. Max Images

### Rationale

This creates a natural decision flow:

- What room?
- What style?
- What color mood?
- How upscale?
- Generate

### Acceptance Criteria

- Color Mood appears directly under Interior Design Style.
- Home Quality appears directly under Color Mood.
- Aspect Ratio and Max Images remain below Home Quality.
- Existing selected values are preserved.
- No generation logic changes.

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The UI MUST present a modernized, minimal, premium-feeling layout that reduces first-load visual density.
- **FR-002**: Room Type MUST be presented as selection cards and support multi-select if current logic supports multi-select.
- **FR-003**: Interior Design Style MUST be presented as a compact selector that preserves all current options and current default values.
- **FR-004**: Home Quality MUST be presented as a compact selector that preserves the Everyday, Upscale, Luxury, and Ultra Luxury options and preserves the current default value.
- **FR-005**: Primary controls visible immediately MUST include Room Type, Interior Design Style, Home Quality, Aspect Ratio, Max Images, and Generate.
- **FR-006**: Optional Details MUST use collapsible groups with multi-select chip-based interaction patterns for Wall Type, Window Style, Color Profile, Focal Points, Outside View, Ceiling Type, and Ceiling Lights.
- **FR-007**: Each collapsed optional group MUST show selected count.
- **FR-008**: Advanced Settings MUST be collapsed by default and include File Size and Randomize Wall Color.
- **FR-008A**: Layout Details MUST be collapsible, collapsed by default, and show the current room size when collapsed.
- **FR-008B**: Advanced Settings MUST show an active settings summary when collapsed.
- **FR-009**: Generate area MUST include a clean summary card showing key selected values before generation.
- **FR-009A**: Generate area MUST include a progress/status region near the Generate button and Generation Summary that appears only while generation is active.
- **FR-009B**: The progress/status region MUST support Idle, Preparing prompt, Sending request, Generating images, Complete, Error, and Cancelled states.
- **FR-009C**: The progress/status region MUST use clear human-readable status text.
- **FR-009D**: The progress/status region MUST show a subtle progress indicator, using a determinate progress bar when real progress is available and an indeterminate indicator when it is not.
- **FR-009E**: Generate MUST be disabled while generation is active, and Cancel MUST remain visible while generation is active.
- **FR-010**: Existing functionality MUST NOT be removed.
- **FR-011**: API routes MUST NOT be changed.
- **FR-012**: Image-generation logic MUST NOT be changed.
- **FR-013**: Existing defaults and selected values MUST be preserved.
- **FR-014**: All current options MUST remain available.
- **FR-015**: Existing "All" checkbox behavior MUST be preserved for groups that use All behavior.
- **FR-016**: UI changes MUST be limited to presentation and interaction patterns.
- **FR-017**: Visual style MUST be minimal, sleek, spacious, premium, with soft rounded corners, subtle borders, clean typography, and generous whitespace, without visual clutter or emoji icons.
- **FR-018**: The layout MUST remain usable on desktop, tablet, and mobile and MUST not overflow horizontally.
- **FR-019**: Interior Design Style MUST fit within one compact row in the primary controls area.
- **FR-020**: Home Quality MUST fit within one compact row in the primary controls area.
- **FR-021**: Generate Summary MUST remain readable on mobile screen sizes.
- **FR-022**: First-time users MUST be able to generate images without opening Optional Details, Layout Details, or Advanced Settings.
- **FR-023**: The initial page length MUST be reduced through progressive disclosure so the Generate button is visible without excessive scrolling on standard viewport sizes.
- **FR-024**: Room Type options MUST be visually grouped by category, and category labels MUST be visible in the Room Type selector.
- **FR-025**: Room Type category grouping MUST preserve existing room-selection behavior, including multiple selection and existing selected values.
- **FR-026**: Existing room types MUST remain available, and newly listed future room types MAY be added without changing existing room value semantics.
- **FR-027**: Batch generation and prompt generation MUST continue to receive the selected room values exactly as selected.

### Key Entities *(include if feature involves data)*

- **Primary Control Set**: Room Type, Style, Quality, Aspect Ratio, Max Images, and Generate controls visible by default.
- **Optional Detail Group**: Collapsible setting group with selected count display and existing group behavior.
- **Advanced Settings Group**: Collapsible group for less frequently changed controls.
- **Generation Summary Card**: Compact preview of key selected values before generation.
- **Generation Progress Indicator**: Status area near generation controls that communicates current generation state and visual progress feedback.

### Constitution Alignment *(mandatory)*

- **CA-001 (Clean Code)**: Modernization should use reusable UI building blocks for cards, compact selectors, and collapsible sections.
- **CA-002 (Simple UI)**: Primary flow is immediately visible; optional and advanced controls are progressively disclosed.
- **CA-003 (Responsive Design)**: Layout and interaction patterns remain usable on mobile, tablet, and desktop without horizontal overflow.
- **CA-004 (Minimal Dependencies)**: No new dependencies unless strictly justified.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Primary controls are fully visible and actionable on first load without expansion.
- **SC-002**: Optional and Advanced sections are collapsed by default and expand on demand.
- **SC-003**: All previously available options remain accessible after modernization.
- **SC-004**: Existing defaults and selected values remain unchanged after modernization.
- **SC-005**: Existing generation behavior and route interactions remain unchanged in validation tests.
- **SC-006**: Summary card reflects current selected values before generation.
- **SC-007**: Interior Design Style and Home Quality each occupy a compact single-row control area in the primary controls section.
- **SC-008**: The page remains free of horizontal overflow on desktop, tablet, and mobile validation sizes.
- **SC-009**: Generate Summary remains readable on mobile validation sizes.
- **SC-010**: During active generation, users can identify that work has started and is still in progress from the status region alone.
- **SC-011**: Users receive a clear Complete, Error, or Cancelled outcome at the end of a generation attempt.
- **SC-012**: Generate cannot be triggered repeatedly while generation is active, and Cancel remains available throughout the active state.
- **SC-013**: First-time users can complete a generation without opening any advanced section.
- **SC-014**: Optional Details, Layout Details, and Advanced Settings remain available while collapsed by default on first load.
- **SC-015**: Initial page length is reduced enough that the Generate button is visible without excessive scrolling on validation viewport sizes.
- **SC-016**: Users can scan Room Type options by visible category labels and select room types with unchanged behavior.
- **SC-017**: Batch generation and prompt generation inputs remain consistent with selected room values after Room Type category grouping.

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- Users benefit from a creative-tool-style interface with progressive disclosure.
- Existing backend and generation pipeline remain stable and in use.
- Current options and defaults are considered correct and should be preserved.
- Modernization scope is limited to UI presentation and interaction design.
- Exact numeric progress may not always be available from the existing generation flow, so indeterminate progress feedback is an acceptable fallback.
