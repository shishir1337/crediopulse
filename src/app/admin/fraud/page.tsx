import { ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/dash/StatCard";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import { requireAdmin } from "@/lib/auth-helpers";
import { dateTime } from "@/lib/format";
import { FRAUD_LABELS } from "@/lib/fraud/engine";
import { prisma } from "@/lib/prisma";

export default async function AdminFraud() {
  await requireAdmin();
  const [events, byType, invalidClicks, totalClicks] = await Promise.all([
    prisma.fraudEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { affiliate: { include: { user: true } } },
    }),
    prisma.fraudEvent.groupBy({
      by: ["type"],
      _count: { _all: true },
      orderBy: { _count: { type: "desc" } },
      take: 6,
    }),
    prisma.click.count({
      where: { status: { in: ["SUSPICIOUS", "INVALID"] } },
    }),
    prisma.click.count(),
  ]);

  const fraudRate = totalClicks > 0 ? (invalidClicks / totalClicks) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Fraud monitor"
        subtitle="Every detection signal across clicks and conversions."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Flagged clicks"
          value={invalidClicks.toLocaleString()}
          sub={`${fraudRate.toFixed(1)}% of traffic`}
          icon={ShieldAlert}
          tone={fraudRate > 30 ? "red" : "amber"}
        />
        {byType.slice(0, 3).map((t) => (
          <StatCard
            key={t.type}
            label={FRAUD_LABELS[t.type] ?? t.type}
            value={t._count._all.toLocaleString()}
            sub="events"
          />
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState>No fraud signals recorded yet.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <Th>Time</Th>
              <Th>Affiliate</Th>
              <Th>Scope</Th>
              <Th>Signal</Th>
              <Th>Severity</Th>
            </tr>
          }
        >
          {events.map((e) => (
            <tr key={e.id}>
              <Td className="whitespace-nowrap text-ink-soft">
                {dateTime(e.createdAt)}
              </Td>
              <Td>{e.affiliate ? e.affiliate.user.name : "—"}</Td>
              <Td>
                <Badge tone="gray">{e.scope}</Badge>
              </Td>
              <Td>
                <span className="font-medium text-ink">
                  {FRAUD_LABELS[e.type] ?? e.type}
                </span>
                {e.detail && (
                  <p className="text-xs text-ink-soft">{e.detail}</p>
                )}
              </Td>
              <Td>
                <Badge
                  tone={
                    e.severity >= 60
                      ? "red"
                      : e.severity >= 30
                        ? "amber"
                        : "gray"
                  }
                >
                  {e.severity}
                </Badge>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
