import { toNum } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type Summary = {
  clicks: number;
  uniqueClicks: number;
  validClicks: number;
  suspiciousClicks: number;
  invalidClicks: number;
  conversions: number;
  approved: number;
  pending: number;
  flagged: number;
  rejected: number;
  revenue: number;
  commissionHeld: number; // accrued but still within the hold window
  commissionAvailable: number; // matured, withdrawable
  commissionPaid: number;
  conversionRate: number; // approved / valid clicks
  epc: number; // earnings per click
};

function sumGroup<T extends { status: string }>(
  rows: Array<T & { _sum: { amount: unknown } }>,
  status: string,
): number {
  return toNum(rows.find((r) => r.status === status)?._sum.amount ?? 0);
}

function countGroup<T extends { status: string }>(
  rows: Array<T & { _count: { _all: number } }>,
  status: string,
): number {
  return rows.find((r) => r.status === status)?._count._all ?? 0;
}

export async function getSummary(affiliateId?: string): Promise<Summary> {
  const clickWhere = affiliateId ? { affiliateId } : {};
  const convWhere = affiliateId ? { affiliateId } : {};

  const now = new Date();
  const commWhere = affiliateId ? { affiliateId } : {};

  const [
    clicks,
    uniqueClicks,
    validClicks,
    suspiciousClicks,
    invalidClicks,
    convGroups,
    heldAgg,
    availableAgg,
    paidAgg,
  ] = await Promise.all([
    prisma.click.count({ where: clickWhere }),
    prisma.click.count({ where: { ...clickWhere, isUnique: true } }),
    prisma.click.count({ where: { ...clickWhere, status: "VALID" } }),
    prisma.click.count({ where: { ...clickWhere, status: "SUSPICIOUS" } }),
    prisma.click.count({ where: { ...clickWhere, status: "INVALID" } }),
    prisma.conversion.groupBy({
      by: ["status"],
      where: convWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: { ...commWhere, status: "PENDING", payableAt: { gt: now } },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: {
        ...commWhere,
        status: "PENDING",
        payableAt: { lte: now },
        payoutId: null,
      },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: { ...commWhere, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  const approved = countGroup(convGroups, "APPROVED");
  const pending = countGroup(convGroups, "PENDING");
  const flagged = countGroup(convGroups, "FLAGGED");
  const rejected = countGroup(convGroups, "REJECTED");
  const conversions = approved + pending + flagged;
  const revenue = sumGroup(convGroups, "APPROVED");

  const commissionHeld = toNum(heldAgg._sum.amount ?? 0);
  const commissionAvailable = toNum(availableAgg._sum.amount ?? 0);
  const commissionPaid = toNum(paidAgg._sum.amount ?? 0);

  const earnings = commissionHeld + commissionAvailable + commissionPaid;

  return {
    clicks,
    uniqueClicks,
    validClicks,
    suspiciousClicks,
    invalidClicks,
    conversions,
    approved,
    pending,
    flagged,
    rejected,
    revenue,
    commissionHeld,
    commissionAvailable,
    commissionPaid,
    conversionRate: validClicks > 0 ? approved / validClicks : 0,
    epc: clicks > 0 ? earnings / clicks : 0,
  };
}

export type SeriesPoint = { date: string; clicks: number; conversions: number };

async function dailyCounts(
  table: "Click" | "Conversion",
  start: Date,
  affiliateId?: string,
): Promise<Map<string, number>> {
  const where = affiliateId
    ? `WHERE "createdAt" >= $1 AND "affiliateId" = $2`
    : `WHERE "createdAt" >= $1`;
  const params = affiliateId ? [start, affiliateId] : [start];
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, count(*)::int AS n
     FROM "${table}" ${where} GROUP BY 1`,
    ...params,
  )) as Array<{ day: string; n: number }>;
  return new Map(rows.map((r) => [r.day, r.n]));
}

export async function getTimeseries(
  days: number,
  affiliateId?: string,
): Promise<SeriesPoint[]> {
  const start = new Date(Date.now() - (days - 1) * 86_400_000);
  start.setHours(0, 0, 0, 0);
  const [clicksByDay, convByDay] = await Promise.all([
    dailyCounts("Click", start, affiliateId),
    dailyCounts("Conversion", start, affiliateId),
  ]);

  const out: SeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      clicks: clicksByDay.get(key) ?? 0,
      conversions: convByDay.get(key) ?? 0,
    });
  }
  return out;
}

export async function getTopAffiliates(limit = 8) {
  const groups = await prisma.commission.groupBy({
    by: ["affiliateId"],
    where: { status: { in: ["PENDING", "APPROVED", "PAID"] } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  if (groups.length === 0) return [];

  const affiliates = await prisma.affiliate.findMany({
    where: { id: { in: groups.map((g) => g.affiliateId) } },
    include: {
      user: true,
      _count: { select: { clicks: true, conversions: true } },
    },
  });
  const byId = new Map(affiliates.map((a) => [a.id, a]));

  return groups
    .map((g) => {
      const a = byId.get(g.affiliateId);
      if (!a) return null;
      return {
        id: a.id,
        name: a.user.name,
        email: a.user.email,
        status: a.status,
        trustScore: a.trustScore,
        clicks: a._count.clicks,
        conversions: a._count.conversions,
        earnings: toNum(g._sum.amount ?? 0),
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    trustScore: number;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
}
