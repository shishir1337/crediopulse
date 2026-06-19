import type { ReactNode } from "react";
import DashShell, { type NavItem } from "@/components/dash/DashShell";
import { requireAffiliate } from "@/lib/auth-helpers";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/dashboard/links", label: "My Links", icon: "links" },
  { href: "/dashboard/clicks", label: "Clicks", icon: "clicks" },
  { href: "/dashboard/conversions", label: "Conversions", icon: "conversions" },
  { href: "/dashboard/earnings", label: "Earnings", icon: "earnings" },
  { href: "/dashboard/payouts", label: "Payouts", icon: "payouts" },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAffiliate();
  return (
    <DashShell
      nav={NAV}
      roleLabel="Affiliate"
      userName={user.name}
      email={user.email}
    >
      {children}
    </DashShell>
  );
}
