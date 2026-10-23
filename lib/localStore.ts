"use client";

export const LOCAL_STORE_EVENT = "iif:local-store-changed";

/** Subscribes to changes made in this tab (custom event) or another tab (storage event). */
export function subscribeToLocalStore(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_STORE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_STORE_EVENT, onChange);
  };
}

/** Holds values for this page view when localStorage is blocked or full. */
const memoryFallback = new Map<string, string>();

/** Reads a raw string from localStorage (or the in-memory fallback), or null when missing. */
export function readLocalStore(key: string): string | null {
  let stored: string | null = null;

  try {
    stored = window.localStorage.getItem(key);
  } catch {
    stored = null;
  }

  return stored ?? memoryFallback.get(key) ?? null;
}

/**
 * Writes to localStorage, falling back to memory for this page view if that fails.
 * Returns true when the value was stored permanently.
 */
export function writeLocalStore(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    memoryFallback.delete(key);
    return true;
  } catch {
    memoryFallback.set(key, value);
    return false;
  }
}

export function notifyLocalStoreChanged(): void {
  window.dispatchEvent(new Event(LOCAL_STORE_EVENT));
}
