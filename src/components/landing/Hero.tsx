import { ArrowRight, Lock, ShieldCheck, Star, TrendingUp } from "lucide-react";
import CreditGauge from "./CreditGauge";
import Reveal from "./Reveal";

const MEDIA = ["CBS", "ABC", "NBC", "FOX", "Forbes", "USA TODAY"];

const BUREAUS = [
  { name: "Experian", score: 687, delta: "+12" },
  { name: "Equifax", score: 701, delta: "+8" },
  { name: "TransUnion", score: 644, delta: "+21" },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-navy-950 pt-32 pb-20 text-white sm:pt-36 lg:pb-28"
    >
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-[30rem] w-[30rem] rounded-full bg-cyan-glow/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-navy-950" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* Left: copy */}
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-200 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trusted by 4M+ members · U.S.-based specialists
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.1rem]">
              Identity Protection
              <br />
              Built <span className="text-gradient-brand">Around You.</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Credio Pulse watches your credit, identity, and finances in real
              time — so the moment something changes, you know first. 3-bureau
              scores, dark-web alerts, and a $1M protection plan in one
              dashboard.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup?plan=starter&cycle=monthly"
                className="press group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_40px_-12px_rgba(47,107,255,0.95)] hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-[0_20px_50px_-12px_rgba(47,107,255,1)]"
              >
                Get Protected
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
              </a>
              <a
                href="#pricing"
                className="press inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur hover:border-white/25 hover:bg-white/10"
              >
                See All Plans
              </a>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-9 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-sm text-white/60">
                <span className="font-semibold text-white">4.8/5</span> from
                12,400+ reviews
              </p>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mask-fade-x mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 opacity-70">
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                As seen on
              </span>
              {MEDIA.map((m) => (
                <span
                  key={m}
                  className="font-display text-lg font-bold tracking-tight text-white/80"
                >
                  {m}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right: dashboard mock */}
        <Reveal delay={200} className="relative">
          <div className="relative mx-auto max-w-md">
            {/* floating chips — sit above/below the card so they never cover its text */}
            <div className="absolute -top-9 -left-7 z-20 hidden animate-float-slow items-center gap-2 rounded-2xl border border-white/10 bg-navy-800/95 px-3.5 py-2.5 shadow-2xl backdrop-blur md:flex">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-meter-excellent/15 text-meter-excellent">
                <TrendingUp className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs text-white/50">Score this month</p>
                <p className="text-sm font-semibold text-white">+41 points</p>
              </div>
            </div>

            <div className="absolute -bottom-9 -right-7 z-20 hidden animate-float items-center gap-2 rounded-2xl border border-white/10 bg-navy-800/95 px-3.5 py-2.5 shadow-2xl backdrop-blur md:flex">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs text-white/50">Dark web scan</p>
                <p className="text-sm font-semibold text-white">All clear</p>
              </div>
            </div>

            {/* main card */}
            <div className="relative z-10 rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/55">
                    Your Credit Pulse
                  </p>
                  <p className="font-display text-lg font-semibold">
                    Overall Health
                  </p>
                </div>
                <span className="rounded-full bg-meter-excellent/15 px-3 py-1 text-xs font-semibold text-meter-excellent">
                  Protected
                </span>
              </div>

              <div className="my-4 flex justify-center">
                <CreditGauge score={711} size={200} className="text-white" />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {BUREAUS.map((b) => (
                  <div
                    key={b.name}
                    className="card-hover rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <p className="text-[0.7rem] font-medium text-white/50">
                      {b.name}
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-white">
                      {b.score}
                    </p>
                    <p className="text-[0.7rem] font-semibold text-meter-excellent">
                      {b.delta}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
