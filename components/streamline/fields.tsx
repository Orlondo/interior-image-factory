"use client";

import type { ReactNode } from "react";

export const SELECT_CLASS =
  "h-[42px] w-full rounded-[10px] border border-[#3A4252] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]";

/** Raised fill and a clear border so buttons stand out from the card behind them. */
export const SECONDARY_BUTTON_CLASS =
  "min-h-[42px] rounded-[10px] border border-[#3A4252] bg-[#262B36] px-3 py-2 text-sm font-medium text-[#F5F7FA] transition hover:border-[#4F8CFF] hover:bg-[#2D3342] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] disabled:cursor-not-allowed disabled:opacity-40";

type SelectFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
  hint?: string;
};

export function SelectField({ label, value, onChange, children, hint }: SelectFieldProps) {
  return (
    <div className="min-w-0">
      <label className="flex min-w-0 flex-col gap-2">
        <span className="text-sm font-medium text-[#98A2B3]">{label}</span>
        <select
          aria-label={label}
          className={SELECT_CLASS}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
      </label>
      {hint ? <p className="mt-2 text-xs text-[#98A2B3]">{hint}</p> : null}
    </div>
  );
}

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="inline-flex min-h-[42px] w-full items-center gap-2 rounded-[10px] border border-[#3A4252] bg-[#1D2230] px-3 py-2 text-sm text-[#F5F7FA]">
      <input
        type="checkbox"
        className="h-4 w-4 accent-[#4F8CFF]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
