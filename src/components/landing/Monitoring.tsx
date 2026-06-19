"use client";

import {
  AppWindow,
  Check,
  Gauge,
  Globe,
  Home,
  IdCard,
  Landmark,
} from "lucide-react";
import { useState } from "react";
import Reveal from "./Reveal";

const TABS = [
  {
    id: "app",
    label: "App Monitoring",
    icon: AppWindow,
    title: "Application monitoring",
    body: "We watch for new credit, loan, and account applications opened in your name across the country — and surface them instantly so you can shut down fraud before it grows.",
    points: [
      "New-account application alerts",
      "Payday & online lender coverage",
      "One-tap fraud confirmation",
    ],
    stat: { k: "Avg. alert speed", v: "< 60 sec" },
  },
  {
    id: "ssn",
    label: "SSN Monitoring",
    icon: IdCard,
    title: "Social Security number monitoring",
    body: "Your SSN is the master key to your identity. We track its use against names, aliases, and addresses to catch synthetic-identity fraud early.",
    points: [
      "Name & alias tracking",
      "Synthetic-ID detection",
      "Address-of-record changes",
    ],
    stat: { k: "Identities watched", v: "Up to 10" },
  },
  {
    id: "dark",
    label: "Dark Web",
    icon: Globe,
    title: "Dark web surveillance",
    body: "We continuously scan breach corpora, paste sites, and underground markets for your personal data — from emails and passwords to full card numbers.",
    points: [
      "Breach & paste-site scans",
      "Credential exposure alerts",
      "Guided remediation steps",
    ],
    stat: { k: "Records scanned", v: "20B+" },
  },
  {
    id: "address",
    label: "Change of Address",
    icon: Home,
    title: "Change-of-address monitoring",
    body: "Address hijacking lets thieves reroute your mail and statements. We flag USPS and account address changes the moment they're filed.",
    points: [
      "USPS redirect alerts",
      "Statement reroute detection",
      "Verify-it-was-you prompts",
    ],
    stat: { k: "Coverage", v: "All 50 states" },
  },
  {
    id: "financial",
    label: "Financial Accounts",
    icon: Landmark,
    title: "Financial account monitoring",
    body: "Link your bank and card accounts for unified transaction alerts, balance-spike detection, and high-risk activity warnings in one feed.",
    points: [
      "Suspicious transaction alerts",
      "Large-purchase warnings",
      "401(k) & investment watch",
    ],
    stat: { k: "Institutions", v: "10,000+" },
  },
  {
    id: "credit",
    label: "Credit Monitoring",
    icon: Gauge,
    title: "3-bureau credit monitoring",
    body: "Daily monitoring across Experian, Equifax, and TransUnion with real-time change alerts and a clear breakdown of what moved your meter.",
    points: [
      "Daily 3-bureau refresh",
      "Score-change explanations",
      "Inquiry & new-account alerts",
    ],
    stat: { k: "Bureaus", v: "All 3" },
  },
];

export default function Monitoring() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section id="monitoring" className="bg-brand-50/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Always watching
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            We monitor so you don&apos;t have to
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Identity threats move across dozens of channels. Credio Pulse
            watches every one — and translates the noise into clear,
            plain-English alerts.
          </p>
        </Reveal>

        {/* Tabs */}
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
          {TABS.map((t) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                aria-pressed={selected}
                className={`press inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                  selected
                    ? "border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                    : "border-ink/10 bg-white text-ink-soft hover:-translate-y-0.5 hover:border-brand-300 hover:text-ink"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[2rem] border border-ink/8 bg-white shadow-[0_30px_80px_-40px_rgba(23,78,240,0.35)]">
          <div className="grid gap-0 md:grid-cols-2">
            <div key={tab.id} className="animate-fade-up p-8 sm:p-10">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600/10 text-brand-700">
                <tab.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-ink">
                {tab.title}
              </h3>
              <p className="mt-3 text-[0.975rem] leading-relaxed text-ink-soft">
                {tab.body}
              </p>
              <ul className="mt-6 space-y-3">
                {tab.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-3 text-[0.95rem] text-ink"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-meter-excellent/15 text-meter-excellent">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex items-center justify-center overflow-hidden bg-navy-950 p-8 sm:p-10">
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/30 blur-3xl" />
              <div
                key={tab.id}
                className="animate-fade-up relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-meter-excellent/15 px-3 py-1 text-xs font-semibold text-meter-excellent">
                    <span className="h-2 w-2 rounded-full bg-meter-excellent" />
                    Active
                  </span>
                  <tab.icon className="h-5 w-5 text-white/40" />
                </div>
                <p className="mt-6 text-sm text-white/50">{tab.stat.k}</p>
                <p className="font-display text-4xl font-bold text-white">
                  {tab.stat.v}
                </p>
                <div className="mt-6 space-y-2.5">
                  {tab.points.map((p, i) => (
                    <div
                      key={p}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          i === 0 ? "bg-meter-fair" : "bg-meter-excellent"
                        }`}
                      />
                      <span className="text-[0.82rem] text-white/75">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
