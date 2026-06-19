import { ArrowRight, ShieldCheck } from "lucide-react";
import Reveal from "./Reveal";

export default function CtaBanner() {
  return (
    <section className="bg-white px-4 pb-20 sm:px-6 sm:pb-24">
      <Reveal className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-glow/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protection in under 5 minutes
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Don&apos;t wait. Get protected now.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Join 4 million members who sleep better knowing Credio Pulse is
              watching their credit, identity, and finances around the clock.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/signup?plan=starter&cycle=monthly"
                className="press group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-brand-700 shadow-xl hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Get Protected
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
              </a>
              <a
                href="#features"
                className="press inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur hover:-translate-y-0.5 hover:bg-white/20"
              >
                Compare Plans
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
