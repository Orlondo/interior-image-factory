"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { notifyLocalStoreChanged, readLocalStore, subscribeToLocalStore } from "./localStore";
import { writeList, type SaveResult } from "./savedItems";

/**
 * Reads a list saved in localStorage without touching it during server render.
 * `parse` must be a stable function (declared outside the component).
 */
export function useSavedItems<T>(key: string, parse: (serialized: string | null) => T[]) {
  const raw = useSyncExternalStore(
    subscribeToLocalStore,
    () => readLocalStore(key),
    () => null
  );
  const items = useMemo(() => parse(raw), [parse, raw]);

  const save = useCallback(
    (next: T[]): SaveResult<T> => {
      try {
        const result = writeList(window.localStorage, key, next);

        if (result.ok) {
          notifyLocalStoreChanged();
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
