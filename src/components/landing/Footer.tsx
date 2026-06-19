import { Apple, Play } from "lucide-react";
import Logo from "./Logo";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const COLUMNS = [
  {
    heading: "Product",
    links: [
      "Credit Monitoring",
      "Dark Web Alerts",
      "Identity Restoration",
      "Family Protection",
      "Device Security",
    ],
  },
  {
    heading: "Company",
    links: ["About Us", "Careers", "Press", "Affiliates", "Contact"],
  },
  {
    heading: "Resources",
    links: [
      "Help Center",
      "Credit Education",
      "Blog",
      "Security",
      "System Status",
    ],
  },
  {
    heading: "Legal",
    links: [
      "Privacy Policy",
      "Terms of Service",
      "CCPA Notice",
      "Accessibility",
      "Disclosures",
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand + apps */}
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Real-time credit and identity protection built around you.
              Watching your score, your identity, and your finances — so you
              never have to wonder.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/download/ios"
                className="press inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
              >
                <Apple className="h-6 w-6" />
                <span className="text-left leading-tight">
                  <span className="block text-[0.65rem] text-white/55">
                    Download on the
                  </span>
                  <span className="block text-sm font-semibold">App Store</span>
                </span>
              </a>
              <a
                href="/download/android"
                className="press inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
              >
                <Play className="h-6 w-6" />
                <span className="text-left leading-tight">
                  <span className="block text-[0.65rem] text-white/55">
                    Get it on
                  </span>
                  <span className="block text-sm font-semibold">
                    Google Play
                  </span>
                </span>
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-semibold text-white">
                  {col.heading}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href={`/${slugify(link)}`}
                        className="press inline-block text-sm text-white/55 hover:translate-x-0.5 hover:text-white"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="text-xs leading-relaxed text-white/40">
            Credio Pulse provides credit and identity monitoring services.
            Credit scores are for educational purposes and may differ from
            scores used by lenders. Identity theft insurance is underwritten by
            a licensed insurer; coverage terms and exclusions apply. Credio
            Pulse is not a credit repair organization and does not provide
            credit repair services.
          </p>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-sm text-white/50">
              © {2026} Credio Pulse. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-white/50">
              <a
                href="/privacy-policy"
                className="transition-colors duration-300 hover:text-white"
              >
                Privacy
              </a>
              <a
                href="/terms-of-service"
                className="transition-colors duration-300 hover:text-white"
              >
                Terms
              </a>
              <a
                href="/cookies"
                className="transition-colors duration-300 hover:text-white"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
