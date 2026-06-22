"use client";

type SelectionCardProps = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function SelectionCard({
  title,
  subtitle,
  selected,
  onClick,
  disabled = false,
}: SelectionCardProps) {
  const selectedClass = selected
    ? "border-[#4F8CFF] bg-[#4F8CFF] text-[#F5F7FA]"
    : "border-[#262B36] bg-[#171A21] text-[#F5F7FA] hover:bg-[#1D2230]";

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-[16px] border px-4 py-3 text-left transition ${selectedClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <p className="text-sm font-semibold">{title}</p>
      {subtitle ? <p className="mt-2 text-xs text-[#98A2B3]">{subtitle}</p> : null}
    </button>
  );
}
