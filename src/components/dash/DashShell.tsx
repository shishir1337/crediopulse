"use client";

import {
  Banknote,
  Bug,
  CreditCard,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MousePointerClick,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import Logo from "@/components/landing/Logo";
import { signOut } from "@/lib/auth-client";

// Server components can't pass icon components across the client boundary, so
// nav items carry a string key resolved here.
const ICONS = {
  dashboard: LayoutDashboard,
  links: Link2,
  clicks: MousePointerClick,
  conversions: ShoppingCart,
  earnings: Wallet,
  payouts: Banknote,
  affiliates: Users,
  fraud: ShieldAlert,
  plans: CreditCard,
  settings: SlidersHorizontal,
  debug: Bug,
} as const;

export type IconKey = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconKey };

export default function DashShell({
  nav,
  roleLabel,
  userName,
  email,
  children,
}: {
  nav: NavItem[];
  roleLabel: string;
  userName: string;
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await signOut();
    window.location.href = "/login";
  }

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <Logo tone="light" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = isActive(item.href);
          const Icon = ICONS[item.icon];
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-500/15 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 ${active ? "text-brand-300" : ""}`}
              />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="truncate text-sm font-semibold text-white">
            {userName}
          </p>
          <p className="truncate text-xs text-white/50">{email}</p>
          <button
            type="button"
            onClick={logout}
            className="press mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-50/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-navy-950 lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-navy-950 lg:hidden">
            {sidebar}
          </aside>
        </>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-semibold text-brand-700">
              {roleLabel}
            </span>
          </div>
          <a
            href="/"
            className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
          >
            View site →
          </a>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close"
          className="sr-only"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
      )}
    </div>
  );
}
