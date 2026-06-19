import {
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import { processPayout } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth-helpers";
import { dateTime, money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function ActionBtn({
  id,
  action,
  label,
  tone,
}: {
  id: string;
  action: string;
  label: string;
  tone: string;
}) {
  return (
    <form action={processPayout}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={`press rounded-lg px-2.5 py-1 text-xs font-semibold ${tone}`}
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminPayouts() {
  await requireAdmin();
  const payouts = await prisma.payout.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { affiliate: { include: { user: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Payouts"
        subtitle="Process affiliate withdrawal requests."
      />
      {payouts.length === 0 ? (
        <EmptyState>No payout requests.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <Th>Requested</Th>
              <Th>Affiliate</Th>
              <Th>Amount</Th>
              <Th>Method</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          }
        >
          {payouts.map((p) => (
            <tr key={p.id}>
              <Td className="text-ink-soft">{dateTime(p.createdAt)}</Td>
              <Td>
                <a
                  href={`/admin/affiliates/${p.affiliateId}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {p.affiliate.user.name}
                </a>
                <p className="text-xs text-ink-soft">
                  {p.affiliate.payoutDetails ?? p.affiliate.user.email}
                </p>
              </Td>
              <Td className="font-semibold text-ink">{money(p.amount)}</Td>
              <Td>{p.method ?? "—"}</Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td>
                {p.status === "REQUESTED" || p.status === "APPROVED" ? (
                  <div className="flex flex-wrap gap-1.5">
                    <ActionBtn
                      id={p.id}
                      action="PAID"
                      label="Mark paid"
                      tone="bg-meter-excellent/12 text-meter-excellent"
                    />
                    <ActionBtn
                      id={p.id}
                      action="REJECTED"
                      label="Reject"
                      tone="bg-meter-poor/12 text-meter-poor"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-ink-soft">
                    {p.processedAt ? dateTime(p.processedAt) : "—"}
                  </span>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
