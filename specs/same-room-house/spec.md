# Spec: Same room from several angles, and rooms that look like one house

**Status**: Implemented (not yet tried against the live image service)
**App**: interior-image-factory
**Builds on**: `specs/room-mix/spec.md` (images per room), `specs/dramatic-angles/spec.md` (camera angles)

## Goal

Every image used to be its own design: ten "living room" images were ten different living rooms, and a
batch with a kitchen and a bedroom was two unrelated homes. Two options make images belong together, for
room-tour videos and listings:

1. **Angles per room**: one room shown from several camera positions, with the same furniture, colors
   and light.
2. **Same house**: the rooms share one design language (style, palette, floors, trim, windows, lights).

## Behavior

### Angles per room (FR-001 to FR-005)

- **FR-001**: Room section > "Angles per room", 1 to 6. 1 is today's behavior and sends nothing new.
- **FR-002**: Each room's image count (even split or your counts) is cut into sets of that many images. 7
  kitchens at 3 angles are sets of 3, 3 and 1. The total is always exactly Max images.
- **FR-003**: The first image of a set is made from the room's normal prompt. Every other image of the set
  is made from that first image as a reference, with a prompt that keeps the room and changes only the camera
  position. The angles, in order: opposite corner, low eye-level, closer furniture group, from the doorway,
  high corner, window and wall. With Camera set to dramatic or cinematic, that camera's own angles are used
  instead.
- **FR-004**: One scenario (view, windows, walls, ceiling, lights, palette) is chosen per set, not per image.
- **FR-005**: The images of a set are saved next to each other, and the batch details name the set.

### Same house (FR-006 to FR-009)

- **FR-006**: Room section > "Same house" checkbox. Off sends nothing new.
- **FR-007**: The first room's scenario (view, windows, walls, ceiling, lights, wall color, color variation)
  is shared by every room. Only the room, and its own focal points, differ.
- **FR-008**: The first image of every later room is made from the house's first image as a style reference,
  with a prompt that says it is a different room of the same house: match the design language, do not copy
  the layout, furniture or camera position.
- **FR-009**: With a single set there is nothing to match, and the page says so.

### Both together

Angles are built from their own room's first image, and the first image of each later room is built from the
house's first image. The house's first image is made before everything else; then each later room's first image
and the angles of the first room run together; then the remaining angles.

### Limits and failure (FR-010 to FR-012)

- **FR-010**: These runs are made live, one stage after another, because each image needs an earlier one. The
  OpenAI batch route cannot do that, so they are limited to 24 images (the point where the app switches to
  batches). The page disables Generate with a message above that, and the server refuses it.
- **FR-011**: If an image's reference does not come back, that image is made from its prompt alone instead.
  An error from the image service stops the run, as it always has.
- **FR-012**: If the newer image model rejects a reference-image request, the older model is tried.

## Not in this build

- Choosing which angle each image gets, or a name for each set.
- Keeping a room's look between runs (a saved room to come back to).
- Batch-mode (more than 24 images) support.
- Using the sets in the channel studio (it only reads the extra `set` field in `batch.json`).

## Test plan

- Unit tests (`tests/room-sets.test.ts`): set sizes and totals, clamping, page text, the 24-image limit,
  the order and references of a run (with and without Same house), waves and the concurrency limit, a
  missing reference, an error stopping the run, the prompt wording, an unchanged default request, old saved
  setups, and the `set` field in the saved details.
- Existing tests (all prompts unchanged for the defaults).
- Not tested here: a real run against the image service. Check that (a) the angles really look like one
  room, (b) the rooms look like one house, (c) the newer model accepts a reference image.
