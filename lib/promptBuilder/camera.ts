/**
 * Camera: how the room is photographed. Standard adds nothing, so prompts at standard are identical to
 * prompts before Camera existed (a wide, level, straight-verticals interior). Dramatic gives each image
 * in a batch its own bold angle from a fixed set, so a batch has real variety in viewpoint. Cinematic does
 * the same with film-style camera positions and framing. Both change only where the camera is and how it is
 * angled; lighting, color, focus and finish are left to the other settings. In both, every image gets an
 * angle, and the rooms stay believable: the lens is wide but never fisheye,
 * and walls, furniture and windows are not warped.
 */
export const cameras = ["standard", "dramatic", "cinematic"] as const;
export type CameraKey = (typeof cameras)[number];

export type DramaticAngle = {
  id: string;
  /** The first Camera line: where the camera is and what it looks at. */
  direction: string;
  /** Added to the composition target for this angle. */
  composition: string;
};

/**
 * The order is the order a batch cycles through them, so neighbouring images never repeat an angle and a
 * batch of any size shows each one about equally often.
 */
export const DRAMATIC_ANGLES: readonly DramaticAngle[] = [
  {
    id: "low-angle",
    direction:
      "Dramatic low angle: camera about knee height, tilted slightly up, so furniture rises over the lens and the ceiling plane and its lighting stretch overhead; verticals stay straight",
    composition: "the height of the room, strong vertical lines, ceiling treatment as a feature",
  },
  {
    id: "high-corner",
    direction:
      "Dramatic high corner view: camera near the ceiling in one corner, angled down across the whole room so the layout, rug and furniture grouping read like a plan in perspective",
    composition: "the furniture arrangement seen from above, floor pattern and rug as strong shapes",
  },
  {
    id: "one-point",
    direction:
      "Dramatic one-point perspective: camera centered at eye height at one end of the room, looking straight down its long axis so floor, ceiling and wall lines converge on a single vanishing point; symmetrical framing",
    composition: "deep symmetrical space with strong leading lines toward the far wall",
  },
  {
    id: "tight-corner",
    direction:
      "Dramatic corner perspective: camera pressed into one corner at chest height, looking diagonally into the room so two walls recede sharply and the space feels deep",
    composition: "strong diagonal depth, two walls receding, foreground furniture overlapping the middle ground",
  },
  {
    id: "doorway",
    direction:
      "Dramatic doorway view: camera just outside the room looking in through the door frame, so the frame, trim and a slice of wall form a dark foreground that leads the eye into the lit room",
    composition: "a framed view with a layered foreground, middle ground and far wall",
  },
  {
    id: "low-oblique-detail",
    direction:
      "Dramatic low oblique close view: camera close to the floor beside a key piece of furniture, looking along it at an angle with the room softly visible behind; shallow depth of field on the far side only",
    composition: "one hero furniture piece and its materials in sharp focus, the room as a soft backdrop",
  },
];

export const CINEMATIC_ANGLES: readonly DramaticAngle[] = [
  {
    id: "wide-establishing",
    direction:
      "Cinematic establishing shot: camera at doorway height, pulled back to show the whole room like the first frame of a film, with generous space around the furniture",
    composition: "a balanced widescreen frame with clear foreground, middle ground and background layers",
  },
  {
    id: "low-hero",
    direction:
      "Cinematic low hero shot: camera low and close to the floor, looking across the room toward the main furniture so it looms slightly, with the far wall behind it",
    composition: "a heroic low viewpoint, the key furniture as the subject of the frame",
  },
  {
    id: "symmetrical-center",
    direction:
      "Cinematic symmetrical frame: camera dead center at the end of the room at chest height, the room built as a precise, balanced tableau with the focal point on the central axis",
    composition: "exact symmetry, a centered focal point, evenly weighted left and right",
  },
  {
    id: "through-doorway",
    direction:
      "Cinematic frame within a frame: camera outside the room looking through a doorway or archway, so the door frame and trim surround the room beyond, as if a character is about to step in",
    composition: "a framing foreground of door trim, the room beyond, layered depth",
  },
  {
    id: "facing-window",
    direction:
      "Cinematic view toward the window: camera at eye height on the far side of the room, looking straight toward the window wall with the furniture arranged in the foreground and middle ground",
    composition: "the window wall as the background, furniture silhouettes layered in front of it",
  },
  {
    id: "high-wide",
    direction:
      "Cinematic high wide shot: camera above eye level in a corner, looking down and across the room as a crane shot would, so the layout and the path through the space read clearly",
    composition: "a graphic top-down feel of the layout with strong leading lines to the focal point",
  },
];

/** What a camera mode adds besides the angle itself. */
export const CAMERA_MODES = {
  dramatic: {
    angles: DRAMATIC_ANGLES,
    lens: "Lens: wide-angle, about 20-24mm full-frame, kept rectilinear; no fisheye bulge, no warped walls, furniture or windows",
    negative: "no fisheye or warped geometry",
    /** Replaces the "8k detail, tack-sharp focus" finish line. Null keeps the usual one: camera modes change only the viewpoint. */
    finish: null as string | null,
  },
  cinematic: {
    angles: CINEMATIC_ANGLES,
    lens: "Lens: wide-angle, about 24-35mm full-frame, widescreen framing, kept rectilinear; no fisheye bulge, no warped walls, furniture or windows",
    negative: "no fisheye or warped geometry",
    finish: null as string | null,
  },
} as const;

function pick(angles: readonly DramaticAngle[], index: number): DramaticAngle {
  const n = angles.length;
  return angles[((Math.trunc(index) % n) + n) % n];
}

/** The angle for image number `index` (0-based) in a batch, for a dramatic camera. */
export function dramaticAngleFor(index: number): DramaticAngle {
  return pick(DRAMATIC_ANGLES, index);
}

/** The angle for image number `index` in a batch for any non-standard camera. */
export function cameraAngleFor(camera: "dramatic" | "cinematic", index: number): DramaticAngle {
  return pick(CAMERA_MODES[camera].angles, index);
}
