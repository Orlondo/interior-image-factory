/**
 * Wall art: what the art in a room shows, and how many pieces hang there. Both are optional. Nothing
 * selected changes nothing, so default prompts, seeds and saved batch details stay as they were.
 */

export const wallArtSubjects = [
  "landscapes",
  "botanicals",
  "abstract",
  "portraits",
  "still life",
  "architecture",
  "seascapes",
  "maps and prints",
  "black-and-white photography",
] as const;

/** Picking this alone (or with others) varies the subject from image to image across every subject. */
export const MIX_IT_UP = "mix it up";
export const WALL_ART_PIECES_MAX = 8;
/** Pieces per room: a fixed number, or "mix" to vary it between images. */
export const PIECES_MIX = "mix";
export type PiecesPerRoom = number | typeof PIECES_MIX | null;

const SUBJECT_TEXT: Record<(typeof wallArtSubjects)[number], string> = {
  landscapes: "landscape paintings or prints",
  botanicals: "botanical illustrations or pressed-plant prints",
  abstract: "abstract art",
  portraits: "portraits",
  "still life": "still life paintings",
  architecture: "architectural drawings or prints",
  seascapes: "seascapes",
  "maps and prints": "vintage maps and decorative prints",
  "black-and-white photography": "black-and-white photography",
};

export type WallArt = { subjects: string[]; pieces: PiecesPerRoom };
export const EMPTY_WALL_ART: WallArt = { subjects: [], pieces: null };

export function isWallArtSet(art: WallArt | null | undefined): boolean {
  return Boolean(art && (art.subjects.length > 0 || art.pieces !== null));
}

export function sanitizeWallArt(raw: unknown): WallArt {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const picked = new Set(Array.isArray(source.subjects) ? source.subjects : []);
  const subjects: string[] = picked.has(MIX_IT_UP) ? [MIX_IT_UP] : wallArtSubjects.filter((s) => picked.has(s));
  const p = source.pieces;
  const pieces: PiecesPerRoom =
    p === PIECES_MIX ? PIECES_MIX : typeof p === "number" && Number.isInteger(p) && p >= 1 && p <= WALL_ART_PIECES_MAX ? p : null;

  return { subjects, pieces };
}

function subjectFor(art: WallArt, slot: number): string | null {
  if (art.subjects.length === 0) return null;
  const list = art.subjects.includes(MIX_IT_UP) ? [...wallArtSubjects] : art.subjects;

  return SUBJECT_TEXT[list[slot % list.length] as keyof typeof SUBJECT_TEXT];
}

function piecesFor(art: WallArt, slot: number): number | null {
  if (art.pieces === null) return null;

  return art.pieces === PIECES_MIX ? [3, 1, 5, 2, 4][slot % 5] as number : art.pieces;
}

/** The lines added to an image's prompt, or "" when wall art is not set. `slot` counts earlier images. */
export function wallArtLines(art: WallArt | null | undefined, slot: number): string {
  if (!art || !isWallArtSet(art)) return "";

  const subject = subjectFor(art, slot);
  const count = piecesFor(art, slot);
  const lines = ["Wall art:"];

  if (subject) lines.push(`- The art on the walls is ${subject}, kept consistent in style within this room.`);
  if (count !== null) {
    lines.push(`- Show ${count === 1 ? "exactly one piece" : `exactly ${count} pieces`} of wall art in the room, each clearly visible.`);
  }

  return lines.join("\n");
}

export function describeWallArt(art: WallArt | null | undefined): string {
  if (!art || !isWallArtSet(art)) return "";

  return [art.subjects.join(", "), art.pieces !== null ? `${art.pieces} pieces` : ""].filter(Boolean).join(", ");
}
