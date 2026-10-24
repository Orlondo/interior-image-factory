"use client";

import { useEffect, useState } from "react";
import { SCROLL_MOVE_THRESHOLD, nextHidden } from "./scrollDirection";

/**
 * True while the page is being scrolled down. Does nothing when `enabled` is false. When
 * `shouldStayVisible()` is true at the time of a scroll (for example a field in the row has focus),
 * the row is shown instead.
 */
export function useHideOnScroll(enabled: boolean, shouldStayVisible?: () => boolean): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let lastY = window.scrollY;
    let frame = 0;

    function onScroll() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;

        const y = Math.max(0, window.scrollY);
        const delta = y - lastY;

        if (shouldStayVisible?.()) {
          lastY = y;
          setHidden(false);
          return;
        }

        if (Math.abs(delta) < SCROLL_MOVE_THRESHOLD && y >= 24) {
          return;
        }

        lastY = y;
        setHidden((previous) => nextHidden(previous, y, delta));
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [enabled, shouldStayVisible]);

  // When it is not enabled the row is simply shown, whatever the last scroll was.
  return enabled && hidden;
}
