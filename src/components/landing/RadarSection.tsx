import { Check, Radar, Scale, Shield } from "lucide-react";
import CreditGauge from "./CreditGauge";
import Reveal from "./Reveal";

const PILLARS = [
  {
    icon: Radar,
    title: "Radar",
    body: "Always-on monitoring across credit, the dark web, and your accounts catches threats the moment they surface.",
  },
  {
    icon: Shield,
    title: "Defender",
    body: "Instant lock controls and fraud alerts let you shut down suspicious activity before it spreads.",
  },
  {
    icon: Scale,
    title: "Advocate",
    body: "If the worst happens, dedicated U.S.-based restoration specialists do the heavy lifting to make you whole.",
  },
];

const CHECKS = [
  "AI-powered threat detection across 3 bureaus",
  "Real-time alerts the instant something changes",
  "Award-winning fraud restoration team",
  "Up to $1M in identity theft insurance coverage",
];

const ROWS = [
  { name: "Experian", score: 687, color: "var(--color-meter-good)" },
  { name: "Equifax", score: 701, color: "var(--color-meter-great)" },
  { name: "TransUnion", score: 644, color: "var(--color-meter-fair)" },
];

export default function RadarSection() {
  return (
    <section
      id="protection"
      className="relative overflow-hidden bg-brand-50/40 py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-50" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        {/* Left copy */}
        <div>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              All in one
            </p>
            <h2 className="mt-3 max-w-md font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
              Think of us as your radar, defender, and advocate.
            </h2>
          </Reveal>

          <div className="mt-8 space-y-4">
            {PILLARS.map((p, i) => (
              <Reveal
                key={p.title}
                delay={i * 90}
                className="card-hover group flex gap-4 rounded-2xl border border-ink/8 bg-white/80 p-4 backdrop-blur hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-[0_18px_44px_-30px_rgba(23,78,240,0.5)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-700 transition-all duration-500 ease-spring group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                  <p.icon className="h-5.5 w-5.5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-0.5 text-[0.95rem] leading-relaxed text-ink-soft">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {CHECKS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-2.5 text-[0.95rem] text-ink"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-meter-excellent/15 text-meter-excellent">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Right: phone mock */}
        <Reveal delay={150} className="flex justify-center">
          <div className="relative w-full max-w-[20rem]">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-tr from-brand-500/20 to-cyan-glow/20 blur-2xl" />
            <div className="relative rounded-[2.6rem] border-[10px] border-navy-950 bg-navy-950 shadow-2xl">
              <div className="overflow-hidden rounded-[2rem] bg-white">
                {/* status bar */}
                <div className="flex items-center justify-between bg-navy-950 px-5 py-2 text-[0.7rem] font-medium text-white/70">
                  <span>9:41</span>
                  <span className="h-1.5 w-16 rounded-full bg-white/20" />
                  <span>5G</span>
                </div>
                {/* app header */}
                <div className="bg-navy-950 px-5 pb-6 pt-2 text-white">
                  <p className="text-xs text-white/55">Good morning, Jordan</p>
                  <p className="font-display text-lg font-semibold">
                    Your Credit Pulse
                  </p>
                  <div className="mt-3 flex justify-center">
                    <CreditGauge
                      score={677}
                      size={150}
                      className="text-white"
                    />
                  </div>
                </div>
                {/* bureau list */}
                <div className="space-y-2.5 p-4">
                  {ROWS.map((r) => (
                    <div
                      key={r.name}
                      className="flex items-center justify-between rounded-2xl border border-ink/8 bg-brand-50/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: r.color }}
                        />
                        <span className="text-sm font-medium text-ink">
                          {r.name}
                        </span>
                      </div>
                      <span className="font-display text-lg font-bold text-ink">
                        {r.score}
                      </span>
                    </div>
                  ))}
                  <div className="rounded-2xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white">
                    View full report
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
