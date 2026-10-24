# Image Review

## Goal

Define the image review experience and criteria for evaluating generated interiors.

## Problem

A structured review flow is needed to assess image quality, style fidelity, and concept suitability consistently.

## Requirements

### Review Scope

- Support reviewing generated interior images from a batch.
- Preserve room type, design style, and quality context during review.
- Enable side-by-side or sequential evaluation of multiple outputs.

### Evaluation Criteria

- Style consistency
- Room type correctness
- Composition quality
- Lighting realism
- Material realism
- Palette suitability

### Decision Outcomes

- Approve
- Reject
- Needs revision

## Rapid Image Review

### Goal

Allow users to quickly review large batches of generated images.

### Requirements

- Clicking an image opens a review modal.
- Modal displays a large version of the image.
- Previous and Next navigation.
- Keyboard navigation support.
- Current image position indicator.

Example:

3 of 12

### Acceptance Criteria

- Users can review an entire batch without returning to the grid.
- Arrow keys navigate between images.
- Esc closes the modal.

## Acceptance Criteria

- Reviewers can evaluate all images in a generated batch.
- Review outcomes are consistent and repeatable.
- Image selection decisions can be made without ambiguity.

## Update: Results section with adjustable thumbnails

Generated images used to sit below the page in a 1, 2 or 3 column grid of full-size pictures, with no way to fold them away. Twenty images took about seven rows of large pictures.

- **Results is a section.** It appears after the first batch is generated, titled "Results" with the image count, and collapses like Room, Look, Details and Output. Expand all and Collapse all include it. Its state is remembered in the browser. Older saved section state loads with Results open.
- **Three sizes.** Compact (2 columns on a phone up to 6 on a wide screen), Comfortable (2 up to 4), and Large (the previous 1, 2 or 3 column layout). A segmented control in the section switches between them.
- **Default by batch size.** With no saved choice, a batch of more than 8 images starts in Compact and a smaller one in Large. A choice you make is remembered in the browser and wins from then on.
- **Thumbnails are not cropped.** Compact and Comfortable tiles use the aspect ratio of the output (16:9, 1:1, 4:5 or 9:16) and fill it. If you change the aspect ratio after generating, existing thumbnails keep the new ratio and may crop slightly until you generate again.
- **Speed.** Tiles load lazily and off-screen tiles are not rendered until they scroll near, so batches of 20 or more stay responsive.
- **Fullscreen is unchanged.** Selecting a tile opens the viewer with arrows, swipe down and Esc.
- Measured in a browser with 20 images at 1200 px wide: Compact is 4 rows, about 630 px tall, against 10 rows and about 3,270 px for Large.
- Not in this build: numbers on tiles, a thumbnail strip in the viewer, approve and reject marks, and downsized thumbnails (the images are still held at full size in the page).
- Test coverage: `tests/review-layout.test.ts` (size parsing, defaults, aspect), `tests/sections.test.ts`, and a browser run at 1200 px and 375 px with 3, 20 and 40 images (defaults, switching, remembered choice, no horizontal overflow, tile ratio, fullscreen, collapse, Expand all and Collapse all, portrait ratio).

### New results alert

Generation takes a while, and results can land while you are looking at another part of the page or another tab. A batch counts as **new** until Results is open and at least a quarter on screen, or you open it yourself.

- **"New" marker** on the Results header, shown whether the section is open or collapsed.
- **Floating button** at the bottom of the screen, "20 new images ↓", shown only while new results are off screen. Selecting it opens Results if it is collapsed and scrolls to it. It disappears once you can see the results.
- **Tab title** shows "(20 new) Interior Image Factory" while the tab is in the background, and goes back to normal when you return.
- **Screen readers** hear "20 new images generated. See the Results section."
- If Results is already open and on screen when the images arrive, nothing flashes: you are already looking at them.
- Test coverage: `tests/review-layout.test.ts` (the label), and a browser run at 1200 px and 375 px (button when results land off screen, marker, tab title while hidden and visible, clearing by scrolling and by opening, collapsed case).
