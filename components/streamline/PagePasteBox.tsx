"use client";

import { useEffect, useRef, useState } from "react";
import { CAPTURE_BOOKMARKLET } from "@/lib/pageCapture";

type PagePasteBoxProps = {
  busy: boolean;
  /** Called with the pasted product data. */
  onUse: (captured: string) => void;
};

/**
 * For a shop that turns away the app's own visits: a bookmark that copies the product data from the page
 * open in the person's own browser, and a box to paste it into.
 */
export function PagePasteBox({ busy, onUse }: PagePasteBoxProps) {
  const [text, setText] = useState("");
  const link = useRef<HTMLAnchorElement>(null);

  // React refuses a javascript: address given as a property, so the bookmark's address is set on the element.
  useEffect(() => {
    link.current?.setAttribute("href", CAPTURE_BOOKMARKLET);
  }, []);

  return (
    <details className="text-xs text-[#98A2B3]">
      <summary className="cursor-pointer">The shop blocks the app? Fill it from your own browser</summary>
      <div className="mt-2 space-y-2">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            One time: drag this to your bookmarks bar{" "}
            <a ref={link} className="rounded bg-[#1B2438] px-2 py-0.5 text-[#E6EBF5]" onClick={(event) => event.preventDefault()}>
              Copy product data
            </a>
          </li>
          <li>Open the product page in your browser and let it finish loading, then click that bookmark.</li>
          <li>Paste here (Cmd+V), then press the button.</li>
        </ol>
        <textarea
          className="h-16 w-full rounded bg-[#0F1522] px-2 py-1 text-sm text-[#E6EBF5]"
          value={text}
          placeholder="Paste the copied product data here"
          onChange={(event) => setText(event.target.value)}
        />
        <button type="button" disabled={!text.trim() || busy} onClick={() => onUse(text)}>
          {busy ? "Reading…" : "Fill from pasted data"}
        </button>
      </div>
    </details>
  );
}
