import { Compass, Cpu, FileSearch, LineChart } from "lucide-react";
import Reveal from "./Reveal";

const FEATURES = [
  {
    icon: Cpu,
    title: "Always-On AI Engine",
    body: "Machine learning models watch millions of signals across the web and flag anomalies tied to your identity in real time.",
  },
  {
    icon: FileSearch,
    title: "Built by Experts",
    body: "Our fraud-investigation team understands how data criminals work — and engineers protection that stays a step ahead.",
  },
  {
    icon: LineChart,
    title: "Blueprints for Breakthroughs",
    body: "Personalized insights show exactly what's moving your score, so every action you take builds toward a better number.",
  },
  {
    icon: Compass,
    title: "Plan Flexibility",
    body: "Only pay for what you need. Scale coverage up or down anytime as your family and finances change.",
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Under the hood
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What fuels our features
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            At Credio Pulse it&apos;s about features — it&apos;s about people.
            Our team builds protection with purpose, so every layer earns its
            place on your dashboard.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 80}
              className="card-hover group relative overflow-hidden rounded-3xl border border-ink/8 bg-white p-7 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[0_28px_60px_-30px_rgba(23,78,240,0.4)]"
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-50 opacity-0 transition-opacity duration-500 ease-smooth group-hover:opacity-100" />
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 transition-transform duration-500 ease-spring group-hover:-translate-y-0.5 group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-6 font-display text-lg font-semibold text-ink">
                {f.title}
              </h3>
              <p className="relative mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                {f.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
