import {
  Badge,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import { requireAffiliate } from "@/lib/auth-helpers";
import { dateTime, money } from "@/lib/format";
import { FRAUD_LABELS } from "@/lib/fraud/engine";
import { prisma } from "@/lib/prisma";

export default async function ConversionsPage() {
  const { affiliate } = await requireAffiliate();
  const conversions = await prisma.conversion.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { commission: true },
  });

  return (
    <div>
      <PageHeader
        title="Conversions"
        subtitle="Sales credited to your links, with fraud review status."
      />
      {conversions.length === 0 ? (
        <EmptyState>No conversions yet.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <Th>Time</Th>
              <Th>Plan</Th>
              <Th>Sale</Th>
              <Th>Commission</Th>
              <Th>Status</Th>
              <Th>Signals</Th>
            </tr>
          }
        >
          {conversions.map((c) => (
            <tr key={c.id}>
              <Td className="whitespace-nowrap text-ink-soft">
                {dateTime(c.createdAt)}
              </Td>
              <Td className="capitalize">
                {c.plan ?? "—"}
                <span className="text-ink-soft"> · {c.cycle ?? ""}</span>
              </Td>
              <Td className="font-semibold text-ink">{money(c.amount)}</Td>
              <Td className="font-semibold text-ink">
                {c.commission ? money(c.commission.amount) : "—"}
              </Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={c.status} />
                  {c.fraudScore > 0 && (
                    <Badge tone={c.fraudScore >= 40 ? "red" : "gray"}>
                      risk {c.fraudScore}
                    </Badge>
                  )}
                </div>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {c.flags.length === 0 ? (
                    <span className="text-xs text-ink-soft">clean</span>
                  ) : (
                    c.flags.map((f) => (
                      <Badge key={f} tone="amber">
                        {FRAUD_LABELS[f] ?? f}
                      </Badge>
                    ))
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
