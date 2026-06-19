import { BadgeCheck, FileText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import SignOutButton from "@/components/account/SignOutButton";
import CreditScoreCard from "@/components/checkout/CreditScoreCard";
import Logo from "@/components/landing/Logo";
import { requireCustomer } from "@/lib/auth-helpers";
import { getPlan, normalizeCycle, priceFor, totalDue } from "@/lib/plans";

export const metadata: Metadata = {
  title: "My Dashboard",
  robots: { index: false, follow: false },
};

const PROTECTIONS = [
  "3-bureau credit monitoring",
  "Real-time change alerts",
  "Dark-web surveillance",
  "$1M identity theft insurance",
];

export default async function AccountPage() {
  const { user } = await requireCustomer();

  const hasPlan = Boolean(user.planId);
  const plan = getPlan(user.planId);
  const cycle = normalizeCycle(user.planCycle);
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-brand-50/30">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" aria-label="Credio Pulse home">
            <Logo tone="dark" />
          </a>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Here&apos;s your credit and identity protection at a glance.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Left: status + plan */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-ink/10 bg-white p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-meter-excellent/12 text-meter-excellent">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base font-bold text-ink">
                    Protection active
                  </p>
                  <p className="text-xs text-ink-soft">
                    We&apos;re monitoring your credit and identity 24/7.
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {PROTECTIONS.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-ink"
                  >
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Your plan
              </p>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="font-display text-xl font-bold text-brand-600">
                    {plan.name}
                  </p>
                  <p className="text-sm text-ink-soft">{plan.tagline}</p>
                </div>
                {hasPlan && (
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-ink">
                      ${totalDue(plan, cycle).toFixed(2)}
                    </p>
                    <p className="text-xs text-ink-soft">
                      billed {cycle} · ${priceFor(plan, cycle).toFixed(2)}/mo
                    </p>
                  </div>
                )}
              </div>
              <a
                href="/#pricing"
                className="press mt-5 inline-flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-50"
              >
                <FileText className="h-4 w-4" />
                Manage plan
              </a>
            </div>
          </div>

          {/* Right: credit score card */}
          <div className="lg:sticky lg:top-10">
            <CreditScoreCard seed={user.email} />
          </div>
        </div>
      </main>
    </div>
  );
}
