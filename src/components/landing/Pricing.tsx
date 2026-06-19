"use client";

import { Check, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";
import Reveal from "./Reveal";

export default function Pricing() {
  const cycle = "monthly";

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-[2.6rem]">
            Personalized protection for your lifestyle
          </h2>
          <p className="mt-4 text-lg text-white/65">
            Pick the plan that fits today — scale up or down anytime. Every plan
            includes the Credio Pulse app and U.S.-based support.
          </p>
        </Reveal>

        {/* Plans */}
        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {PLANS.map((plan, i) => {
            const price = plan.monthly;
            return (
              <Reveal
                key={plan.name}
                delay={i * 70}
                className={`card-hover relative flex flex-col rounded-3xl border p-7 backdrop-blur hover:-translate-y-1.5 ${
                  plan.popular
                    ? "border-brand-400/50 bg-gradient-to-b from-brand-600/25 to-white/[0.03] shadow-[0_30px_80px_-30px_rgba(47,107,255,0.7)] hover:border-brand-400/70 hover:shadow-[0_40px_90px_-30px_rgba(47,107,255,0.85)]"
                    : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-1 text-xs font-semibold text-white shadow-lg">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/55">{plan.tagline}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="font-display text-4xl font-bold">
                    ${price.toFixed(2)}
                  </span>
                  <span className="mb-1 text-sm text-white/55">/mo</span>
                </div>
                <p className="mt-1 text-xs text-white/45">billed monthly</p>

                <a
                  href={`/signup?plan=${plan.id}&cycle=${cycle}`}
                  className={`press mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold ${
                    plan.popular
                      ? "bg-brand-500 text-white hover:bg-brand-400"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  Get Protected
                </a>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-[0.875rem] text-white/75"
                    >
                      <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-brand-500/20 text-brand-300">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-8 text-center text-sm text-white/50">
          30-day money-back guarantee · Cancel anytime · No hidden fees
        </Reveal>
      </div>
    </section>
  );
}
