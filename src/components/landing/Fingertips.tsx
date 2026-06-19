import {
  ArrowUpRight,
  BadgeDollarSign,
  CreditCard,
  Eye,
  Smartphone,
  Users,
} from "lucide-react";
import CreditGauge from "./CreditGauge";
import Reveal from "./Reveal";

export default function Fingertips() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">
            One dashboard
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-[2.6rem]">
            Protection at your fingertips
          </h2>
          <p className="mt-4 text-lg text-white/65">
            Seven layers of identity, credit, and device protection — all from
            one place you can actually understand.
          </p>
        </Reveal>

        {/* Bento */}
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {/* Large: credit scores */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <div className="card-hover flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-7 backdrop-blur hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_40px_90px_-40px_rgba(47,107,255,0.6)]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
                    <CreditCard className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-semibold">
                    Credit scores &amp; personal finance
                  </h3>
                  <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-white/60">
                    Track all three bureau scores, get plain-English reasons
                    behind every change, and simulate moves before you make
                    them.
                  </p>
                </div>
                <ArrowUpRight className="hidden h-6 w-6 text-white/30 sm:block" />
              </div>

              <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
                <CreditGauge
                  score={756}
                  size={170}
                  className="mx-auto text-white"
                />
                <div className="space-y-3">
                  {[
                    {
                      label: "Credit utilization",
                      val: "12%",
                      w: "12%",
                      c: "var(--color-meter-excellent)",
                    },
                    {
                      label: "Payment history",
                      val: "100%",
                      w: "100%",
                      c: "var(--color-meter-excellent)",
                    },
                    {
                      label: "Credit age",
                      val: "8 yrs",
                      w: "68%",
                      c: "var(--color-meter-great)",
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs text-white/60">
                        <span>{row.label}</span>
                        <span className="font-semibold text-white">
                          {row.val}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width: row.w, background: row.c }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Dark web alerts */}
          <Reveal delay={80}>
            <div className="card-hover h-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.07]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-meter-poor/15 text-meter-poor">
                <Eye className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                Dark web alerts
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-white/60">
                We scan breach dumps and dark-web markets for your SSN, logins,
                and cards — and alert you the instant they appear.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-meter-poor/10 px-3 py-1.5 text-xs font-semibold text-meter-poor">
                <span className="h-2 w-2 animate-pulse rounded-full bg-meter-poor" />
                2 exposures resolved
              </div>
            </div>
          </Reveal>

          {/* $1M insurance */}
          <Reveal delay={140}>
            <div className="card-hover relative h-full overflow-hidden rounded-3xl border border-brand-400/30 bg-gradient-to-br from-brand-600/30 to-cyan-glow/10 p-7 backdrop-blur hover:-translate-y-1.5 hover:border-brand-400/60 hover:shadow-[0_30px_70px_-30px_rgba(47,107,255,0.8)]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white">
                <BadgeDollarSign className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                Identity restoration
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-white/70">
                U.S.-based specialists handle the paperwork and calls if
                you&apos;re hit, backed by real coverage.
              </p>
              <p className="mt-4 font-display text-3xl font-bold text-white">
                $1M
                <span className="ml-2 align-middle text-sm font-medium text-white/70">
                  theft insurance
                </span>
              </p>
            </div>
          </Reveal>

          {/* Family protection */}
          <Reveal delay={80}>
            <div className="card-hover h-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.07]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-meter-great/15 text-meter-great">
                <Users className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                Family protection
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-white/60">
                Extend monitoring to your partner and kids, including child-SSN
                protection against the fastest-growing fraud.
              </p>
            </div>
          </Reveal>

          {/* Device security */}
          <Reveal delay={140}>
            <div className="card-hover h-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.07]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
                <Smartphone className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                Device security
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-white/60">
                Bank-grade VPN, safe-browsing, and password tools keep your
                phones and laptops locked down on any network.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
