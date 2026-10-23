"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  notifyLocalStoreChanged,
  readLocalStore,
  subscribeToLocalStore,
  writeLocalStore,
} from "./localStore";
import {
  SECTIONS_KEY,
  parseSectionState,
  setAllSections,
  type SectionId,
  type SectionState,
} from "./sections";

/** Open/closed state of the four main sections, remembered in this browser. */
export function useSectionState() {
  const raw = useSyncExternalStore(
    subscribeToLocalStore,
    () => readLocalStore(SECTIONS_KEY),
    () => null
  );
  const state = useMemo(() => parseSectionState(raw), [raw]);

  const write = useCallback((next: SectionState) => {
    // If storage is unavailable the state is kept in memory and forgotten on reload.
    writeLocalStore(SECTIONS_KEY, JSON.stringify(next));
    notifyLocalStoreChanged();
  }, []);

  const toggle = useCallback(
    (id: SectionId) => write({ ...state, [id]: !state[id] }),
    [state, write]
  );
  const setAll = useCallback((open: boolean) => write(setAllSections(open)), [write]);

  return { state, toggle, setAll };
}
