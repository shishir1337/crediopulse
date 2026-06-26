import type { ReactNode } from "react";
import DashShell, { type NavItem } from "@/components/dash/DashShell";
import { requireAdmin } from "@/lib/auth-helpers";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/affiliates", label: "Affiliates", icon: "affiliates" },
  { href: "/admin/conversions", label: "Conversions", icon: "conversions" },
  { href: "/admin/fraud", label: "Fraud", icon: "fraud" },
  { href: "/admin/payouts", label: "Payouts", icon: "payouts" },
  { href: "/admin/plans", label: "Plans / Stripe", icon: "plans" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/checkout-debug", label: "Checkout Debug", icon: "debug" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <DashShell
      nav={NAV}
      roleLabel="Admin"
      userName={session.user.name}
      email={session.user.email}
    >
      {children}
    </DashShell>
  );
}
