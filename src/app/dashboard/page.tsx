import {
  Clock,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import CopyButton from "@/components/dash/CopyButton";
import { StatCard } from "@/components/dash/StatCard";
import TrafficChart from "@/components/dash/TrafficChart";
import { Badge, Card, EmptyState, StatusBadge } from "@/components/dash/ui";
import { getSummary, getTimeseries } from "@/lib/affiliate/stats";
import { requireAffiliate } from "@/lib/auth-helpers";
import { refLink } from "@/lib/base-url";
import { money, num, pct, timeAgo } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AffiliateOverview() {
  const { affiliate, user } = await requireAffiliate();
  const [summary, series, recent] = await Promise.all([
    getSummary(affiliate.id),
    getTimeseries(14, affiliate.id),
    prisma.conversion.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const link = await refLink(affiliate.refCode);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Your affiliate performance at a glance.
        </p>
      </div>

      {affiliate.status === "PENDING" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-meter-fair/40 bg-meter-fair/10 p-4">
          <Clock className="mt-0.5 h-5 w-5 text-[#b45309]" />
          <div>
            <p className="font-semibold text-ink">
              Your account is pending approval
            </p>
            <p className="text-sm text-ink-soft">
              You can share your link and accrue commissions now — payouts
              unlock once an admin approves your account.
            </p>
          </div>
        </div>
      )}

      {/* Referral link */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Your referral link
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-brand-700">
              {link}
            </p>
          </div>
          <CopyButton text={link} label="Copy link" />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Clicks"
          value={num(summary.clicks)}
          sub={`${num(summary.uniqueClicks)} unique`}
          icon={MousePointerClick}
        />
        <StatCard
          label="Conversions"
          value={num(summary.approved + summary.pending)}
          sub={`${num(summary.flagged)} under review`}
          icon={ShoppingCart}
          tone="green"
        />
        <StatCard
          label="Conv. rate"
          value={pct(summary.conversionRate)}
          sub={`EPC ${money(summary.epc)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Earnings (held)"
          value={money(summary.commissionHeld)}
          sub={`${money(summary.commissionAvailable)} available`}
          icon={Wallet}
          tone="amber"
        />
      </div>

      {/* Chart */}
      <Card className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Traffic — last 14 days
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

      {/* Recent conversions */}
      <Card className="mt-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          Recent conversions
        </h2>
        {recent.length === 0 ? (
          <EmptyState>
            No conversions yet. Share your link to start earning.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {recent.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-ink/8 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.plan ?? "Sale"}{" "}
                    <span className="font-normal text-ink-soft">
                      · {c.cycle ?? ""}
                    </span>
                  </p>
                  <p className="text-xs text-ink-soft">
                    {timeAgo(c.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-ink">
                    {money(c.amount)}
                  </span>
                  <StatusBadge status={c.status} />
                  {c.fraudScore > 0 && (
                    <Badge tone={c.fraudScore >= 40 ? "red" : "gray"}>
                      risk {c.fraudScore}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
