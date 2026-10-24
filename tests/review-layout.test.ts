import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPACT_ABOVE,
  DENSITY_GRID,
  REVIEW_DENSITIES,
  effectiveDensity,
  newResultsLabel,
  parseReviewDensity,
  thumbnailAspect,
} from "../lib/reviewLayout";

test("a saved size is read back, and anything else is ignored", () => {
  for (const density of REVIEW_DENSITIES) {
    assert.equal(parseReviewDensity(density), density);
  }

  assert.equal(parseReviewDensity(null), null);
  assert.equal(parseReviewDensity(""), null);
  assert.equal(parseReviewDensity("huge"), null);
});

test("without a saved size, more than 8 images start compact and fewer start large", () => {
  assert.equal(COMPACT_ABOVE, 8);
  assert.equal(effectiveDensity(null, 1), "large");
  assert.equal(effectiveDensity(null, 8), "large");
  assert.equal(effectiveDensity(null, 9), "compact");
  assert.equal(effectiveDensity(null, 40), "compact");
});

test("a saved size always wins, whatever the batch size", () => {
  assert.equal(effectiveDensity("comfortable", 40), "comfortable");
  assert.equal(effectiveDensity("large", 40), "large");
  assert.equal(effectiveDensity("compact", 2), "compact");
});

test("each size has a grid, and large keeps the layout the page had before", () => {
  for (const density of REVIEW_DENSITIES) {
    assert.ok(DENSITY_GRID[density].includes("grid-cols-"), density);
  }

  assert.equal(DENSITY_GRID.large, "grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3");
});

test("thumbnail aspect follows the output ratio", () => {
  assert.equal(thumbnailAspect("16:9"), "16 / 9");
  assert.equal(thumbnailAspect("1:1"), "1 / 1");
  assert.equal(thumbnailAspect("4:5"), "4 / 5");
  assert.equal(thumbnailAspect("9:16"), "9 / 16");
});

test("the new-results label reads naturally for one image and many", () => {
  assert.equal(newResultsLabel(1), "1 new image");
  assert.equal(newResultsLabel(20), "20 new images");
});
