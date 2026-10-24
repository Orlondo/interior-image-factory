import type { AspectRatioOption } from "./setup";

/** How big the generated images are shown in the Results section. */
export const REVIEW_DENSITIES = ["compact", "comfortable", "large"] as const;
export type ReviewDensity = (typeof REVIEW_DENSITIES)[number];

export const REVIEW_DENSITY_KEY = "iif.review-density.v1";

/** More images than this start in Compact, so a big batch does not push the page down. */
export const COMPACT_ABOVE = 8;

export const DENSITY_LABELS: Record<ReviewDensity, string> = {
  compact: "Compact",
  comfortable: "Comfortable",
  large: "Large",
};

/** Grid columns per size. Large is the layout the page had before Results became a section. */
export const DENSITY_GRID: Record<ReviewDensity, string> = {
  compact: "grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6",
  comfortable: "grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4",
  large: "grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
};

/** The saved size, or null when nothing valid is saved. */
export function parseReviewDensity(raw: string | null): ReviewDensity | null {
  return (REVIEW_DENSITIES as readonly string[]).includes(raw ?? "") ? (raw as ReviewDensity) : null;
}

/** A saved choice wins. Without one, big batches start Compact and small ones start Large. */
export function effectiveDensity(saved: ReviewDensity | null, imageCount: number): ReviewDensity {
  return saved ?? (imageCount > COMPACT_ABOVE ? "compact" : "large");
}

/** CSS aspect-ratio for a thumbnail, matching the generated image so nothing is cropped. */
export function thumbnailAspect(aspectRatio: AspectRatioOption): string {
  const [width, height] = aspectRatio.split(":");

  return `${width} / ${height}`;
}

/** "1 new image" or "20 new images", for the Results alert. */
export function newResultsLabel(count: number): string {
  return `${count} new ${count === 1 ? "image" : "images"}`;
}
