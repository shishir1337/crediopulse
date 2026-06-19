import { Clock, Wallet } from "lucide-react";
import { StatCard } from "@/components/dash/StatCard";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import { getSummary } from "@/lib/affiliate/stats";
import { requireAffiliate } from "@/lib/auth-helpers";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function commissionState(c: {
  status: string;
  payableAt: Date | null;
  payoutId: string | null;
}): { label: string; tone: string } {
  if (c.status === "PAID") return { label: "Paid", tone: "green" };
  if (c.status === "REVERSED") return { label: "Reversed", tone: "red" };
  if (c.payoutId) return { label: "In payout", tone: "blue" };
  if (c.payableAt && c.payableAt <= new Date())
    return { label: "Available", tone: "green" };
  return { label: "Held", tone: "amber" };
}

export default async function EarningsPage() {
  const { affiliate } = await requireAffiliate();
  const [summary, commissions] = await Promise.all([
    getSummary(affiliate.id),
    prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { conversion: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Earnings"
        subtitle="Commissions accrue per approved sale and mature after the hold window."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="On hold"
          value={money(summary.commissionHeld)}
          sub="Within hold window"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Available"
          value={money(summary.commissionAvailable)}
          sub="Ready to withdraw"
          icon={Wallet}
          tone="green"
        />
        <StatCard
          label="Paid out"
          value={money(summary.commissionPaid)}
          sub="Lifetime"
          icon={Wallet}
        />
      </div>

      {commissions.length === 0 ? (
        <EmptyState>No commissions yet.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <Th>Date</Th>
              <Th>Sale</Th>
              <Th>Rate</Th>
              <Th>Commission</Th>
              <Th>Matures</Th>
              <Th>State</Th>
            </tr>
          }
        >
          {commissions.map((c) => {
            const st = commissionState(c);
            return (
              <tr key={c.id}>
                <Td className="whitespace-nowrap text-ink-soft">
                  {shortDate(c.createdAt)}
                </Td>
                <Td className="capitalize">
                  {c.conversion.plan ?? "Sale"} · {money(c.conversion.amount)}
                </Td>
                <Td>
                  {c.type === "PERCENT" ? `${Number(c.rate)}%` : money(c.rate)}
                </Td>
                <Td className="font-semibold text-ink">{money(c.amount)}</Td>
                <Td className="text-ink-soft">
                  {c.payableAt ? shortDate(c.payableAt) : "—"}
                </Td>
                <Td>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
