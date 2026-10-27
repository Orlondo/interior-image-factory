# Spec: Dramatic and cinematic camera angles

**Status**: Implemented
**App**: interior-image-factory
**Related**: `specs/image-variety/spec.md` (camera variation), `specs/condition-and-rooms/spec.md` (same method: an option that adds nothing at its default)

## Goal

Let a batch use bold, varied camera angles, or film-still framing, instead of the same wide, level shot every time, while the rooms stay believable.

## Behavior

- **Camera** is a choice in the Room section: `standard` (default), `dramatic` or `cinematic`.
- **Standard** adds nothing. The prompt, the request body and the batch seed are identical to before Camera existed.
- **Dramatic** replaces the Camera line "Wide interior composition, straight verticals, professional framing" with a named angle, adds a rectilinear 20-24mm lens line, adds an emphasis to the composition target, and changes the "no distortion" cue to "no fisheye or warped geometry" so the angle is not cancelled.
- **Every image** in the batch gets an angle; none stays standard. Six angles, cycled by the image's place in the batch so neighbouring images never repeat and a batch shows each about equally: low angle, high corner, one-point down the long axis, tight corner, doorway view, low oblique close view.
- **Cinematic** works the same way with its own six film-style camera positions (establishing, low hero, symmetrical, through a doorway, facing the window, high wide) and a 24-35mm widescreen lens line. Like Dramatic, it changes only where the camera is and how it is angled: lighting, color, focus and the usual "8k detail, tack-sharp focus" finish are untouched. Walls and furniture are still not warped.
- The request body carries `camera` only when it is not `standard`; the batch seed includes it only then; saved batch settings record it.
- Old saved setups and unknown values load as `standard`.

## Files

`lib/promptBuilder/camera.ts` (options, angles), `lib/promptBuilder.ts` (Camera block), `lib/setup.ts`, `app/generate/route.ts`, `components/streamline/RoomSection.tsx`, `tests/camera.test.ts`.

## Known limits

Styles or conditions that set their own composition target (Liminal, neglected and below) keep it; the angle and its emphasis are added after it. The image model may follow a named angle loosely, so judge the result on a few images before a large batch.
