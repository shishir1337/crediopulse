"use client";

import { Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const NAV_LINKS = [
  { label: "Protection", href: "#protection" },
  { label: "Monitoring", href: "#monitoring" },
  { label: "Compare", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reviews", href: "#reviews" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className={`mt-3 flex items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 sm:px-5 ${
            scrolled
              ? "border-white/10 bg-navy-950/80 shadow-[0_8px_40px_-12px_rgba(6,11,28,0.6)] backdrop-blur-xl"
              : "border-white/5 bg-navy-950/40 backdrop-blur-md"
          }`}
        >
          <a href="#top" aria-label="Credio Pulse home">
            <Logo tone="light" />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="press rounded-lg px-3.5 py-2 text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 sm:flex">
            <a
              href="/login"
              className="press rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
            >
              Log in
            </a>
            <a
              href="/signup?plan=starter&cycle=monthly"
              className="press group inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(47,107,255,0.9)] hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-[0_12px_32px_-6px_rgba(47,107,255,1)]"
            >
              <ShieldCheck className="h-4 w-4" />
              Get Protected
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white sm:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile sheet */}
        {open && (
          <div className="animate-fade-up mt-2 rounded-2xl border border-white/10 bg-navy-950/95 p-3 backdrop-blur-xl sm:hidden">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href="/login"
                className="rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Log in
              </a>
              <a
                href="/signup?plan=starter&cycle=monthly"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Get Protected
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
