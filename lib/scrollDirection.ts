/** Scrolling less than this many pixels is ignored, so a shaky thumb does not flicker the header. */
export const SCROLL_MOVE_THRESHOLD = 6;

/** Near the top of the page the extra header row is always shown. */
export const SCROLL_REVEAL_ABOVE = 24;

/**
 * Whether the extra header row should be hidden after a scroll move. Scrolling down hides it,
 * scrolling up (or being near the top) shows it, and a tiny move changes nothing.
 * `delta` is the new scroll position minus the last one that counted.
 */
export function nextHidden(hidden: boolean, scrollY: number, delta: number): boolean {
  if (scrollY < SCROLL_REVEAL_ABOVE) {
    return false;
  }

  if (delta > SCROLL_MOVE_THRESHOLD) {
    return true;
  }

  if (delta < -SCROLL_MOVE_THRESHOLD) {
    return false;
  }

  return hidden;
}
