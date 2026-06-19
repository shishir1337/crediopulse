import { Check, Eye, X } from "lucide-react";
import {
  Badge,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import { reviewConversion } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth-helpers";
import { dateTime, money } from "@/lib/format";
import { FRAUD_LABELS } from "@/lib/fraud/engine";
import { prisma } from "@/lib/prisma";

const FILTERS = [
  { key: "FLAGGED", label: "Needs review" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

export default async function AdminConversions({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const { filter = "FLAGGED" } = await searchParams;
  const where = filter === "ALL" ? {} : { status: filter as never };

  const conversions = await prisma.conversion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { affiliate: { include: { user: true } }, commission: true },
  });

  return (
    <div>
      <PageHeader
        title="Conversions"
        subtitle="Review flagged sales before commissions mature."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <a
            key={f.key}
            href={`/admin/conversions?filter=${f.key}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              filter === f.key
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink/15 bg-white text-ink-soft hover:text-ink"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {conversions.length === 0 ? (
        <EmptyState>Nothing here.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <Th>Time</Th>
              <Th>Affiliate</Th>
              <Th>Sale</Th>
              <Th>Commission</Th>
              <Th>Risk</Th>
              <Th>Status</Th>
              <Th>Review</Th>
              <Th>Data</Th>
            </tr>
          }
        >
          {conversions.map((c) => (
            <tr key={c.id}>
              <Td className="whitespace-nowrap text-ink-soft">
                {dateTime(c.createdAt)}
              </Td>
              <Td>
                <a
                  href={`/admin/affiliates/${c.affiliateId}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {c.affiliate.user.name}
                </a>
                <p className="text-xs text-ink-soft capitalize">
                  {c.plan ?? ""} · {c.cycle ?? ""}
                </p>
              </Td>
              <Td className="font-semibold text-ink">{money(c.amount)}</Td>
              <Td>{c.commission ? money(c.commission.amount) : "—"}</Td>
              <Td>
                <div className="flex flex-col gap-1">
                  <Badge
                    tone={
                      c.fraudScore >= 40
                        ? "red"
                        : c.fraudScore > 0
                          ? "amber"
                          : "green"
                    }
                  >
                    {c.fraudScore}
                  </Badge>
                  <div className="flex flex-wrap gap-1">
                    {c.flags.slice(0, 3).map((f) => (
                      <span key={f} className="text-[0.65rem] text-ink-soft">
                        {FRAUD_LABELS[f] ?? f}
                      </span>
                    ))}
                  </div>
                </div>
              </Td>
              <Td>
                <StatusBadge status={c.status} />
              </Td>
              <Td>
                {c.status === "FLAGGED" || c.status === "PENDING" ? (
                  <div className="flex gap-1.5">
                    <form action={reviewConversion}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="decision" value="APPROVE" />
                      <button
                        type="submit"
                        className="press inline-flex items-center gap-1 rounded-lg bg-meter-excellent/12 px-2.5 py-1 text-xs font-semibold text-meter-excellent"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    </form>
                    <form action={reviewConversion}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="decision" value="REJECT" />
                      <button
                        type="submit"
                        className="press inline-flex items-center gap-1 rounded-lg bg-meter-poor/12 px-2.5 py-1 text-xs font-semibold text-meter-poor"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-ink-soft">—</span>
                )}
              </Td>
              <Td>
                <a
                  href={`/admin/conversions/${c.id}`}
                  className="press inline-flex items-center gap-1 rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-brand-50"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </a>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
