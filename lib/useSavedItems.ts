"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { writeList, type SaveResult } from "./savedItems";

const CHANGE_EVENT = "iif:saved-items-changed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Reads a list saved in localStorage without touching it during server render.
 * `parse` must be a stable function (declared outside the component).
 */
export function useSavedItems<T>(key: string, parse: (serialized: string | null) => T[]) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null
  );
  const items = useMemo(() => parse(raw), [parse, raw]);

  const save = useCallback(
    (next: T[]): SaveResult<T> => {
      try {
        const result = writeList(window.localStorage, key, next);

        if (result.ok) {
          window.dispatchEvent(new Event(CHANGE_EVENT));
        }

        return result;
      } catch {
        return { ok: false, message: "Could not save. Browser storage is unavailable." };
      }
    },
    [key]
  );

  return { items, save };
}
