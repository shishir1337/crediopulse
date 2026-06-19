"use client";

import { Check, ChevronDown, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { type BillingCycle, type Plan, priceFor, totalDue } from "@/lib/plans";

type OrderSummaryProps = {
  plan: Plan;
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
};

const money = (n: number) => `$${n.toFixed(2)}`;

export default function OrderSummary({
  plan,
  cycle,
  onCycleChange,
}: OrderSummaryProps) {
  const [expanded, setExpanded] = useState(true);
  const perMonth = priceFor(plan, cycle);
  const due = totalDue(plan, cycle);

  return (
    <aside className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(23,78,240,0.45)]">
      <h2 className="font-display text-lg font-bold text-ink">Order Summary</h2>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-brand-600">
            {plan.name}
          </p>
          <p className="text-sm text-ink-soft">{plan.tagline}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-ink">
            {money(perMonth)}
          </p>
          <p className="text-xs text-ink-soft">/mo</p>
        </div>
      </div>

      {/* Billing cycle toggle */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-brand-50 p-1">
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCycleChange(c)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-colors ${
              cycle === c
                ? "bg-white text-brand-700 shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {c}
            {c === "yearly" && (
              <span className="ml-1.5 text-[0.7rem] font-bold text-meter-excellent">
                -20%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Features */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-ink"
          aria-expanded={expanded}
        >
          Features
          <ChevronDown
            className={`h-4 w-4 text-ink-soft transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
        {expanded && (
          <ul className="mt-3 space-y-2.5">
            {plan.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-[0.85rem] text-ink-soft"
              >
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-meter-excellent/15 text-meter-excellent">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="my-5 border-t border-dashed border-ink/10" />

      <div className="flex items-center justify-between">
        <span className="font-display text-base font-bold text-ink">
          Total due today
        </span>
        <span className="font-display text-2xl font-bold text-ink">
          {money(due)}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        {cycle === "yearly"
          ? `Billed annually at ${money(due)}. Renews yearly until cancelled.`
          : `Billed monthly at ${money(due)}. Cancel anytime.`}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
          30-day money-back
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-brand-600" />
          SSL secured
        </span>
      </div>
    </aside>
  );
}
