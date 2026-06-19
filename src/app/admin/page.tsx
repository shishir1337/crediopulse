import {
  AlertTriangle,
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dash/StatCard";
import TrafficChart from "@/components/dash/TrafficChart";
import {
  Badge,
  Card,
  EmptyState,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import {
  getSummary,
  getTimeseries,
  getTopAffiliates,
} from "@/lib/affiliate/stats";
import { requireAdmin } from "@/lib/auth-helpers";
import { money, num, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminOverview() {
  await requireAdmin();
  const [
    summary,
    series,
    top,
    affiliateCount,
    activeCount,
    pendingReview,
    payoutQueue,
  ] = await Promise.all([
    getSummary(),
    getTimeseries(30),
    getTopAffiliates(8),
    prisma.affiliate.count(),
    prisma.affiliate.count({ where: { status: "ACTIVE" } }),
    prisma.conversion.count({ where: { status: "FLAGGED" } }),
    prisma.payout.count({ where: { status: "REQUESTED" } }),
  ]);

  const fraudRate =
    summary.clicks > 0
      ? (summary.suspiciousClicks + summary.invalidClicks) / summary.clicks
      : 0;
  const commissionOwed = summary.commissionHeld + summary.commissionAvailable;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Affiliate performance, revenue, and fraud at a glance.
        </p>
      </div>

      {(pendingReview > 0 || payoutQueue > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {pendingReview > 0 && (
            <a
              href="/admin/conversions?filter=FLAGGED"
              className="press inline-flex items-center gap-2 rounded-xl border border-meter-fair/40 bg-meter-fair/10 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              <AlertTriangle className="h-4 w-4 text-[#b45309]" />
              {pendingReview} conversion{pendingReview > 1 ? "s" : ""} need
              review
            </a>
          )}
          {payoutQueue > 0 && (
            <a
              href="/admin/payouts"
              className="press inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700"
            >
              {payoutQueue} payout request{payoutQueue > 1 ? "s" : ""}
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Affiliates"
          value={num(affiliateCount)}
          sub={`${num(activeCount)} active`}
          icon={Users}
        />
        <StatCard
          label="Clicks"
          value={num(summary.clicks)}
          sub={`${pct(fraudRate)} flagged`}
          icon={MousePointerClick}
          tone={fraudRate > 0.3 ? "red" : "blue"}
        />
        <StatCard
          label="Conversions"
          value={num(summary.approved)}
          sub={`${num(summary.flagged)} under review`}
          icon={ShoppingCart}
          tone="green"
        />
        <StatCard
          label="Commission owed"
          value={money(commissionOwed)}
          sub={`${money(summary.revenue)} revenue`}
          icon={DollarSign}
          tone="amber"
        />
      </div>

      <Card className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Traffic — last 30 days
          </h2>
          <div className="flex items-center gap-4 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> Clicks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-meter-excellent" />{" "}
              Conversions
            </span>
          </div>
        </div>
        <TrafficChart data={series} />
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Top affiliates
        </h2>
        {top.length === 0 ? (
          <EmptyState>No affiliate earnings yet.</EmptyState>
        ) : (
          <Table
            head={
              <tr>
                <Th>Affiliate</Th>
                <Th>Status</Th>
                <Th>Trust</Th>
                <Th>Clicks</Th>
                <Th>Sales</Th>
                <Th>Earnings</Th>
              </tr>
            }
          >
            {top.map((a) => (
              <tr key={a.id}>
                <Td>
                  <a
                    href={`/admin/affiliates/${a.id}`}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {a.name}
                  </a>
                  <p className="text-xs text-ink-soft">{a.email}</p>
                </Td>
                <Td>
                  <StatusBadge status={a.status} />
                </Td>
                <Td>
                  <Badge
                    tone={
                      a.trustScore >= 70
                        ? "green"
                        : a.trustScore >= 40
                          ? "amber"
                          : "red"
                    }
                  >
                    {a.trustScore}
                  </Badge>
                </Td>
                <Td>{num(a.clicks)}</Td>
                <Td>{num(a.conversions)}</Td>
                <Td className="font-semibold text-ink">{money(a.earnings)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
