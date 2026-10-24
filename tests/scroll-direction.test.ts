import assert from "node:assert/strict";
import test from "node:test";
import { SCROLL_MOVE_THRESHOLD, SCROLL_REVEAL_ABOVE, nextHidden } from "../lib/scrollDirection";

test("scrolling down past the top hides the row", () => {
  assert.equal(nextHidden(false, 300, SCROLL_MOVE_THRESHOLD + 1), true);
  assert.equal(nextHidden(true, 400, 50), true);
});

test("scrolling up shows the row again", () => {
  assert.equal(nextHidden(true, 300, -(SCROLL_MOVE_THRESHOLD + 1)), false);
  assert.equal(nextHidden(false, 300, -40), false);
});

test("near the top the row is always shown, even while scrolling down", () => {
  assert.equal(nextHidden(true, 0, 0), false);
  assert.equal(nextHidden(false, SCROLL_REVEAL_ABOVE - 1, 30), false);
  assert.equal(nextHidden(false, SCROLL_REVEAL_ABOVE, 30), true);
});

test("a tiny move changes nothing", () => {
  assert.equal(nextHidden(true, 300, SCROLL_MOVE_THRESHOLD), true);
  assert.equal(nextHidden(false, 300, -SCROLL_MOVE_THRESHOLD), false);
  assert.equal(nextHidden(false, 300, 2), false);
  assert.equal(nextHidden(true, 300, -2), true);
});
