import { notFound } from "next/navigation";
import ClicksTable from "@/components/dash/ClicksTable";
import { StatCard } from "@/components/dash/StatCard";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import {
  setAffiliateCommission,
  setAffiliateStatus,
  setUserRole,
} from "@/lib/actions/admin";
import { getSummary } from "@/lib/affiliate/stats";
import { requireAdmin } from "@/lib/auth-helpers";
import { getRequestOrigin } from "@/lib/base-url";
import { dateTime, money, num, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AffiliateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!affiliate) notFound();

  const origin = await getRequestOrigin();

  const [summary, recentConversions, recentClicks] = await Promise.all([
    getSummary(id),
    prisma.conversion.findMany({
      where: { affiliateId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.click.findMany({
      where: { affiliateId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div>
      <a
        href="/admin/affiliates"
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← All affiliates
      </a>
      <PageHeader
        title={affiliate.user.name}
        subtitle={affiliate.user.email}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={affiliate.status} />
            <Badge
              tone={
                affiliate.trustScore >= 70
                  ? "green"
                  : affiliate.trustScore >= 40
                    ? "amber"
                    : "red"
              }
            >
              trust {affiliate.trustScore}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Clicks"
          value={num(summary.clicks)}
          sub={`${num(summary.validClicks)} valid`}
        />
        <StatCard
          label="Conversions"
          value={num(summary.approved)}
          sub={`${num(summary.flagged)} flagged`}
          tone="green"
        />
        <StatCard
          label="Conv. rate"
          value={pct(summary.conversionRate)}
          sub={`EPC ${money(summary.epc)}`}
        />
        <StatCard
          label="Owed"
          value={money(summary.commissionHeld + summary.commissionAvailable)}
          sub={`${money(summary.commissionPaid)} paid`}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">
            Default link
          </h2>
          <p className="font-mono text-sm text-brand-700">
            {`${origin}/r/${affiliate.refCode}`}
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Payout: {affiliate.payoutMethod ?? "—"}{" "}
            {affiliate.payoutDetails ? `· ${affiliate.payoutDetails}` : ""}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["PENDING", "ACTIVE", "SUSPENDED", "BANNED"] as const).map(
              (st) => (
                <form key={st} action={setAffiliateStatus}>
                  <input type="hidden" name="id" value={affiliate.id} />
                  <input type="hidden" name="status" value={st} />
                  <button
                    type="submit"
                    disabled={affiliate.status === st}
                    className="press rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-brand-50 disabled:opacity-40"
                  >
                    {st}
                  </button>
                </form>
              ),
            )}
          </div>
          <div className="mt-3">
            <form action={setUserRole}>
              <input type="hidden" name="userId" value={affiliate.userId} />
              <input
                type="hidden"
                name="role"
                value={affiliate.user.role === "admin" ? "affiliate" : "admin"}
              />
              <button
                type="submit"
                className="press rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-brand-50"
              >
                {affiliate.user.role === "admin"
                  ? "Revoke admin"
                  : "Make admin"}
              </button>
            </form>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">
            Commission override
          </h2>
          <form action={setAffiliateCommission} className="space-y-3">
            <input type="hidden" name="id" value={affiliate.id} />
            <div className="grid grid-cols-2 gap-3">
              <select
                name="type"
                defaultValue={affiliate.commissionType ?? ""}
                className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Use default</option>
                <option value="PERCENT">Percent</option>
                <option value="FLAT">Flat</option>
              </select>
              <input
                name="rate"
                type="number"
                step="any"
                defaultValue={
                  affiliate.commissionRate
                    ? Number(affiliate.commissionRate)
                    : ""
                }
                placeholder="Rate"
                className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="press rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Save override
            </button>
            <p className="text-xs text-ink-soft">
              Leave type as “Use default” to fall back to the global rate.
            </p>
          </form>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">
          Recent conversions
        </h2>
        {recentConversions.length === 0 ? (
          <EmptyState>None yet.</EmptyState>
        ) : (
          <Table
            head={
              <tr>
                <Th>Time</Th>
                <Th>Sale</Th>
                <Th>Risk</Th>
                <Th>Status</Th>
              </tr>
            }
          >
            {recentConversions.map((c) => (
              <tr key={c.id}>
                <Td className="text-ink-soft">{dateTime(c.createdAt)}</Td>
                <Td className="font-semibold text-ink">{money(c.amount)}</Td>
                <Td>{c.fraudScore}</Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">
          Recent clicks
        </h2>
        <ClicksTable clicks={recentClicks} showFullIp />
      </div>
    </div>
  );
}
