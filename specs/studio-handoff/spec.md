# Spec: Image app to video studio handoff

**Status**: Approved (building image-app part first)
**Apps**: interior-image-factory (Next.js, `~/Repos/interior-image-factory`) and channel-studio (Python, `~/development/channel-studio`)

## Goal

Go from "generate a batch" to "a video project ready to review" without moving files by hand. You only make decisions: which images to keep, in what order, and what the captions say.

## What the code does today

**Image app**
- Every image is written to one flat `output/` folder as `generated-<runId>-<n>-0.png`. There are about 350 files now, 2 to 4 MB each.
- `output/responses.json` (33 MB, base64 copies of the images) is overwritten on every normal run and is never read by anything.
- Nothing records which room, look or settings made which image. The route knows (each image has a scenario: room, view, color profile, focal point, window, wall, ceiling, light, wall palette), but it throws that away.
- Batches over 24 images go through OpenAI batch mode. The separate result route saves the images later and has no access to the scenarios.

**Studio**
- One folder per video: `images/`, `music/`, `captions.csv`, `project.json`. Images are renamed `01.png`, `02.png`... in order.
- Captions are matched to images by list order, not by file name. The `filename` column is empty today.
- `aiImages` in `project.json` only adds the line "Some images in this video were created with AI tools." to the generated description file. It does not tell YouTube anything. The studio has no upload feature, so the "altered or synthetic content" answer is always a manual step in YouTube Studio, per video.
- The upload checklist already mentions that toggle, but only as one line among five, and it is in a metadata file you may not open before uploading.
- The studio is a local server on port 8765 with a small API: create a project, upload an image, reorder, render.

## Design

The studio reads from the image app. The image app never needs to know the studio exists, so either can change without breaking the other.

### 1. Image app saves each run as a batch folder (FR-001 to FR-005)

- **FR-001**: Each run writes to `output/batches/<runId>/` with the images named `01.png`, `02.png`... in generation order.
- **FR-002**: Each batch folder has a small `batch.json`: id, created time, image count, the shared settings (style, quality, intensity, strategy, coverage, aspect ratio), and one entry per image with its file name, room, view, color profile, focal point, window, wall, ceiling, light and wall palette. No prompts and no base64, so it stays a few KB.
- **FR-003**: Batch mode (over 24 images): save a `batch.json` with `status: "pending"` when the batch is submitted, keyed by the OpenAI batch id. The result route fills in the images and marks it complete. This is the one part that needs care, because the two requests are separate.
- **FR-004**: Stop writing `responses.json`. It is 33 MB of duplicate data nobody reads.
- **FR-005**: Existing flat `output/generated-*.png` files stay where they are and keep working. Old images simply have no batch folder.

### 2. Studio imports a batch (FR-006 to FR-010)

- **FR-006**: The studio is pointed at the image app's batches folder by a `--batches <path>` option, with the default `~/Repos/interior-image-factory/output/batches`.
- **FR-007**: New endpoints: list batches (id, date, count, first image as a thumbnail, rooms) and import a batch into a project.
- **FR-008**: New studio panel "Import from image app": pick a batch, see thumbnails with room and palette labels, tick the images you want (curation stays yours), choose a new or existing project, import.
- **FR-009**: Import copies the chosen images in the order shown (copy, never move), sets `aiImages: true`, and keeps the batch id in `project.json` so you can trace a video back to its batch.
- **FR-010**: Existing manual upload and drag-to-reorder keep working unchanged.

### 3. Captions (FR-011)

- **FR-011**: Under each imported image the studio shows its metadata as a hint ("living room, teal and cream, cove lighting"). Captions stay yours, matching how your first video was written. There is no auto-draft button.

### 4. AI disclosure built in (FR-012 to FR-014)

- **FR-012**: When `aiImages` is on, a visible banner on the Render panel says: "In YouTube Studio, answer Yes to 'Altered or synthetic content' when you upload." It stays until you tick "I answered it" for that render.
- **FR-013**: In the metadata file the checklist line for it moves to the top of the checklist and is only written when `aiImages` is on.
- **FR-014**: Batch imports turn `aiImages` on automatically. You can still turn it off for a video, for example one that uses stock photos.

## Not in this build

- Automatic upload to YouTube. If that is added later, the YouTube API has a field for this disclosure (`containsSyntheticMedia`, which I should confirm against YouTube's current documentation first), so the studio could set it for you. Until then the manual answer is the only way.
- A "Send to studio" button in the image app. It can be added later on top of this.
- Merging the two apps.

## Decisions

1. **Captions**: hints only, no draft button.
2. **Import default**: all images in a batch start ticked; untick the ones you do not want.

## Test plan

- Image app: unit tests for the manifest (one entry per image, room counts match, batch-mode pending then complete); a real route test with a fake OpenAI call that checks the folder contents.
- Studio: tests against a temporary folder for list, import (order, copy not move, `aiImages` set, project name collision) and the disclosure banner. A browser check of the import panel at desktop and phone width.
- Check that an existing project and the flat `output/` folder behave exactly as before.

## Rollout

Two commits in the image app (`feat(output): save each run as a batch folder with metadata`, `docs(spec): add studio-handoff spec`) and one in channel-studio (`feat(import): import image batches with AI disclosure reminder`). The image app part ships first and is useful alone.
