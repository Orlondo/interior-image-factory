import assert from "node:assert/strict";
import test from "node:test";
import { conditions, rooms, styles } from "../lib/combinations";
import { buildPrompt } from "../lib/promptBuilder";
import { CAMERA_MODES, CINEMATIC_ANGLES, cameras, DRAMATIC_ANGLES, cameraAngleFor, dramaticAngleFor } from "../lib/promptBuilder/camera";
import { buildPromptPreview } from "../lib/promptPreview";
import { buildGeneratePayload, DEFAULT_SETUP, sanitizeSetup } from "../lib/setup";

type Patch = Partial<typeof DEFAULT_SETUP>;
const prompt = (patch: Patch) => buildPromptPreview({ ...DEFAULT_SETUP, ...patch });

const STANDARD_LINE = "Wide interior composition, straight verticals, professional framing";

test("the camera options are standard, dramatic and cinematic, and standard is the default", () => {
  assert.deepEqual([...cameras], ["standard", "dramatic", "cinematic"]);
  assert.equal(DEFAULT_SETUP.camera, "standard");
});

test("a standard camera changes nothing in the prompt", () => {
  const plain = prompt({});
  assert.equal(prompt({ camera: "standard" }), plain);
  assert.ok(plain.includes(STANDARD_LINE));
  assert.ok(plain.includes("no distortion"));
  assert.ok(!plain.includes("Camera angle"));
});

test("a dramatic camera swaps the level wide shot for a named angle and keeps rooms undistorted", () => {
  const text = prompt({ camera: "dramatic" });
  assert.ok(!text.includes(STANDARD_LINE));
  assert.ok(text.includes("Camera angle (critical): Dramatic low angle"));
  assert.ok(text.includes("no fisheye bulge"));
  assert.ok(text.includes("no fisheye or warped geometry"));
  assert.ok(!text.includes("no distortion"));
});

test("six distinct angles, and a batch cycles through them so neighbours never repeat", () => {
  assert.equal(DRAMATIC_ANGLES.length, 6);
  assert.equal(new Set(DRAMATIC_ANGLES.map((a) => a.id)).size, 6);
  for (const angle of DRAMATIC_ANGLES) {
    assert.ok(angle.direction.length > 40 && angle.composition.length > 10, angle.id);
  }

  const counts = new Map<string, number>();
  for (let i = 0; i < 12; i += 1) {
    const here = dramaticAngleFor(i).id;
    counts.set(here, (counts.get(here) ?? 0) + 1);
    assert.notEqual(here, dramaticAngleFor(i + 1).id);
  }
  assert.ok([...counts.values()].every((n) => n === 2), "12 images show each angle twice");
  assert.equal(dramaticAngleFor(-1).id, DRAMATIC_ANGLES[5].id);
  assert.equal(dramaticAngleFor(2.9).id, DRAMATIC_ANGLES[2].id);
});

test("the image's place in the batch picks its angle, so a batch has variety", () => {
  const forImage = (index: number) =>
    buildPrompt(
      rooms[0], DEFAULT_SETUP.roomSize, DEFAULT_SETUP.designStyle, DEFAULT_SETUP.colorMood,
      DEFAULT_SETUP.colorIntensity, DEFAULT_SETUP.colorStrategy, DEFAULT_SETUP.colorCoverage,
      DEFAULT_SETUP.heroColor, false, 0, 12, DEFAULT_SETUP.homeQuality, "", [DEFAULT_SETUP.colorProfiles[0]],
      DEFAULT_SETUP.views[0], DEFAULT_SETUP.windowStyles.slice(0, 1), [], [], [], [], "pristine", "dramatic", index
    );
  const lines = new Set(Array.from({ length: 6 }, (_, i) => forImage(i).match(/Camera angle \(critical\): [^\n]+/)?.[0]));
  assert.equal(lines.size, 6);
  assert.equal(forImage(0), forImage(6));
});

test("every style and condition still gets the angle, for both camera modes", () => {
  for (const camera of ["dramatic", "cinematic"] as const) {
    for (const style of styles) {
      for (const condition of conditions) {
        const text = prompt({ designStyle: style, condition, camera });
        assert.ok(text.includes("Camera angle (critical):"), `${camera} / ${style} / ${condition}`);
        assert.ok(!text.includes(STANDARD_LINE), `${camera} / ${style} / ${condition}`);
        assert.ok(text.includes("no fisheye"), `${camera} / ${style} / ${condition}`);
      }
    }
  }
});

test("cinematic gives every image a film-style camera position and changes nothing but the viewpoint", () => {
  assert.equal(CINEMATIC_ANGLES.length, 6);
  assert.equal(new Set(CINEMATIC_ANGLES.map((a) => a.id)).size, 6);
  assert.equal(new Set([...DRAMATIC_ANGLES, ...CINEMATIC_ANGLES].map((a) => a.direction)).size, 12);
  for (let i = 0; i < 12; i += 1) {
    assert.notEqual(cameraAngleFor("cinematic", i).id, cameraAngleFor("cinematic", i + 1).id);
  }
  assert.equal(cameraAngleFor("dramatic", 3).id, dramaticAngleFor(3).id);

  const text = prompt({ camera: "cinematic" });
  assert.ok(text.includes("Camera angle (critical): Cinematic establishing shot"));
  assert.ok(text.includes("widescreen framing"));
  assert.ok(text.includes("tack-sharp focus"), "the usual finish stays: only the angle changes");
  assert.ok(!/film grain|depth of field|anamorphic|color grad|graded/i.test(text), "no film look is added");
  // identical to the standard prompt apart from the camera lines
  const strip = (x: string) => x.replace(/Camera:[\s\S]*?\n\nView:/, "Camera:\n\nView:").replace(/no fisheye or warped geometry|no distortion/, "");
  assert.equal(strip(text), strip(prompt({})));
});

test("a style with its own camera finish (Liminal) keeps it, even with a cinematic camera", () => {
  const liminal = styles.find((s) => /liminal/i.test(s));
  if (!liminal) return;
  const text = prompt({ designStyle: liminal, camera: "cinematic" });
  assert.ok(text.includes("Camera angle (critical): Cinematic"));
  assert.ok(!text.includes("tack-sharp focus"));
});

test("the request body only mentions the camera when it is dramatic", () => {
  assert.ok(!("camera" in buildGeneratePayload(DEFAULT_SETUP)));
  assert.equal(buildGeneratePayload({ ...DEFAULT_SETUP, camera: "dramatic" }).camera, "dramatic");
  assert.equal(buildGeneratePayload({ ...DEFAULT_SETUP, camera: "cinematic" }).camera, "cinematic");
});

test("saved setups from before Camera, and bad values, load as standard", () => {
  assert.equal(sanitizeSetup({}).camera, "standard");
  assert.equal(sanitizeSetup({ camera: "fisheye" }).camera, "standard");
  assert.equal(sanitizeSetup({ camera: 3 }).camera, "standard");
  assert.equal(sanitizeSetup({ camera: "dramatic" }).camera, "dramatic");
  assert.equal(sanitizeSetup({ camera: "cinematic" }).camera, "cinematic");
});
