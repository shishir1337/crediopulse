import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-meter-excellent/12 text-meter-excellent",
  amber: "bg-meter-fair/15 text-[#b45309]",
  red: "bg-meter-poor/12 text-meter-poor",
  blue: "bg-brand-600/10 text-brand-700",
  gray: "bg-ink/8 text-ink-soft",
};

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES | string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        TONES[tone] ?? TONES.gray
      }`}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, string> = {
  VALID: "green",
  APPROVED: "green",
  ACTIVE: "green",
  PAID: "green",
  PENDING: "amber",
  FLAGGED: "amber",
  SUSPICIOUS: "amber",
  REQUESTED: "amber",
  REJECTED: "red",
  INVALID: "red",
  REVERSED: "red",
  REFUNDED: "red",
  BANNED: "red",
  SUSPENDED: "red",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "gray"}>{status}</Badge>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white px-6 py-12 text-center text-sm text-ink-soft">
      {children}
    </div>
  );
}

/** Simple table wrapper for consistent styling. */
export function Table({
  head,
  children,
}: {
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-ink/10 bg-brand-50/40 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {head}
        </thead>
        <tbody className="divide-y divide-ink/6">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3 ${className}`}>{children}</th>;
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
