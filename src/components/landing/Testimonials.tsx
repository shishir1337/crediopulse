import { BadgeCheck, Star } from "lucide-react";
import Reveal from "./Reveal";

type Review = {
  name: string;
  location: string;
  quote: string;
  initials: string;
};

const REVIEWS: Review[] = [
  {
    name: "Marcus T.",
    location: "Austin, TX",
    initials: "MT",
    quote:
      "Credio Pulse caught a credit application I never made within minutes. I froze everything from the app before any damage was done.",
  },
  {
    name: "Priya N.",
    location: "Seattle, WA",
    initials: "PN",
    quote:
      "I finally understand my score. The meter actually explains what's moving it instead of throwing numbers at me. Up 41 points already.",
  },
  {
    name: "Devon R.",
    location: "Atlanta, GA",
    initials: "DR",
    quote:
      "When my info showed up in a breach, a real U.S.-based specialist walked me through every step. Worth every penny for the peace of mind.",
  },
  {
    name: "Sara L.",
    location: "Denver, CO",
    initials: "SL",
    quote:
      "Setting up family protection for my parents and kids took five minutes. Child-SSN monitoring is something I didn't know I needed.",
  },
  {
    name: "James W.",
    location: "Chicago, IL",
    initials: "JW",
    quote:
      "Dark web alerts flagged an old password that leaked. Changed it the same day. The dashboard is genuinely the cleanest I've used.",
  },
  {
    name: "Elena G.",
    location: "Miami, FL",
    initials: "EG",
    quote:
      "Cancelled my old service the day I switched. Faster alerts, clearer reports, and the $1M coverage gives me real peace of mind.",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            4 million people trust us with their identity
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Real members, real results. Here&apos;s what protection feels like
            when it&apos;s built around you.
          </p>
        </Reveal>

        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {REVIEWS.map((r, i) => (
            <Reveal
              key={r.name}
              delay={(i % 3) * 90}
              className="card-hover mb-5 break-inside-avoid rounded-3xl border border-ink/8 bg-gradient-to-b from-white to-brand-50/30 p-6 shadow-[0_18px_50px_-40px_rgba(23,78,240,0.5)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_28px_60px_-40px_rgba(23,78,240,0.6)]"
            >
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="mt-4 text-[0.975rem] leading-relaxed text-ink">
                {r.quote}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {r.initials}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    {r.name}
                    <BadgeCheck className="h-4 w-4 text-brand-600" />
                  </p>
                  <p className="text-xs text-ink-soft">
                    {r.location} · Verified member
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
