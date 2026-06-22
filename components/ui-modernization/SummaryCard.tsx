"use client";

type SummaryCardProps = {
  title: string;
  lines: string[];
};

export function SummaryCard({ title, lines }: SummaryCardProps) {
  return (
    <section className="rounded-[20px] border border-[#262B36] bg-[#1D2230] p-4">
      <h3 className="text-sm font-semibold text-[#F5F7FA]">{title}</h3>
      <div className="mt-2 space-y-1">
        {lines.map((line) => (
          <p key={line} className="text-sm font-medium text-[#98A2B3]">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
