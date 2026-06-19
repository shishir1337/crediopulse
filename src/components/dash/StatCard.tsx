import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-brand-600/10 text-brand-700",
    green: "bg-meter-excellent/12 text-meter-excellent",
    amber: "bg-meter-fair/15 text-[#b45309]",
    red: "bg-meter-poor/12 text-meter-poor",
  };
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </p>
        {Icon && (
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}
