import { Fingerprint, Globe, ShieldAlert } from "lucide-react";
import Reveal from "./Reveal";

const ICONS = [Fingerprint, Globe, ShieldAlert];

const STATS = [
  {
    value: "$10.3B",
    label: "Lost to online fraud by U.S. consumers last year — a record high.",
  },
  {
    value: "1 in 3",
    label:
      "Americans have been hit by identity theft, more than any other country.",
  },
  {
    value: "60%",
    label:
      "Of identity-theft victims had no idea how their information was exposed.",
  },
];

export default function CrimeStats() {
  return (
    <section className="relative bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            The reality
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Online crime is surging
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            As the noise grows, blanket fear won&apos;t protect you — clarity
            will. Here&apos;s what you&apos;re up against, and why a real-time
            meter matters.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {STATS.map((stat, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal
                key={stat.value}
                delay={i * 90}
                className="card-hover group rounded-3xl border border-ink/8 bg-gradient-to-b from-brand-50/60 to-white p-7 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_24px_60px_-30px_rgba(23,78,240,0.35)]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform duration-500 ease-spring group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="mt-6 font-display text-5xl font-bold tracking-tight text-ink">
                  {stat.value}
                </p>
                <p className="mt-3 text-[0.975rem] leading-relaxed text-ink-soft">
                  {stat.label}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
