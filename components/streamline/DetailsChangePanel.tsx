"use client";

import { describeDetailChanges, type LookDetails } from "@/lib/looks";

export type DetailsChange = {
  lookName: string;
  before: LookDetails;
  after: LookDetails;
};

type DetailsChangePanelProps = {
  change: DetailsChange;
  onUndo: () => void;
  onDismiss: () => void;
};

const BUTTON_CLASS =
  "rounded-[10px] border border-[#3A4252] bg-[#262B36] px-3 py-1.5 text-xs font-medium text-[#F5F7FA] transition hover:border-[#4F8CFF] hover:bg-[#2D3342] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]";

const list = (options: string[]) => options.join(", ");

export function DetailsChangePanel({ change, onUndo, onDismiss }: DetailsChangePanelProps) {
  const rows = describeDetailChanges(change.before, change.after);
  const changedCount = rows.filter((row) => row.changed).length;

  return (
    <section
      role="status"
      aria-label="Details changed by this Look"
      className="mt-4 min-w-0 rounded-[16px] border border-[#2F3B55] bg-[#121722] p-3"
    >
      <p className="text-sm font-medium text-[#F5F7FA]">
        {changedCount > 0
          ? `Details set by ${change.lookName}`
          : `${change.lookName} kept your current details`}
      </p>

      {changedCount > 0 ? (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={row.key} className="min-w-0 text-xs">
              <span className="font-medium text-[#98A2B3]">{row.label}: </span>
              {row.changed ? (
                <span className="text-[#D6DAE3]">
                  <span className="text-[#98A2B3] line-through decoration-[#98A2B3]/60">
                    {list(row.before)}
                  </span>{" "}
                  <span aria-label="changed to">&rarr;</span>{" "}
                  <span className="font-medium text-[#F5F7FA]">{list(row.after)}</span>
                </span>
              ) : (
                <span className="text-[#98A2B3]">no change ({list(row.after)})</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-[#98A2B3]">
          Walls, ceilings and ceiling lights already matched this Look.
        </p>
      )}

      <p className="mt-2 text-xs text-[#98A2B3]">
        You can change any of these in the Details section. Your colors are not affected by Undo.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {changedCount > 0 ? (
          <button type="button" className={BUTTON_CLASS} onClick={onUndo}>
            Undo details
          </button>
        ) : null}
        <button type="button" className={BUTTON_CLASS} onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </section>
  );
}
