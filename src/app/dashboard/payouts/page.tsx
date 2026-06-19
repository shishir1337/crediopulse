import RequestPayout from "@/components/dash/RequestPayout";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import { savePayoutDetails } from "@/lib/actions/affiliate";
import { getSettings } from "@/lib/affiliate/settings";
import { getSummary } from "@/lib/affiliate/stats";
import { requireAffiliate } from "@/lib/auth-helpers";
import { dateTime, money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function PayoutsPage() {
  const { affiliate } = await requireAffiliate();
  const [summary, settings, payouts] = await Promise.all([
    getSummary(affiliate.id),
    getSettings(),
    prisma.payout.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Payouts"
        subtitle={`Withdraw matured commissions. Minimum payout ${money(settings.minPayout)}.`}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Available to withdraw
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-ink">
            {money(summary.commissionAvailable)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {money(summary.commissionHeld)} still within the hold window.
          </p>
          <div className="mt-5">
            <RequestPayout
              available={summary.commissionAvailable}
              min={Number(settings.minPayout)}
              canRequest={affiliate.status === "ACTIVE"}
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">
            Payout method
          </h2>
          <form action={savePayoutDetails} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Method
              </label>
              <input
                name="method"
                defaultValue={affiliate.payoutMethod ?? ""}
                placeholder="PayPal, Bank transfer, Wise…"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Details
              </label>
              <input
                name="details"
                defaultValue={affiliate.payoutDetails ?? ""}
                placeholder="Account email / IBAN"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <button
              type="submit"
              className="press rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-50"
            >
              Save
            </button>
          </form>
        </Card>
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold text-ink">
        History
      </h2>
      {payouts.length === 0 ? (
        <EmptyState>No payout requests yet.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <Th>Requested</Th>
              <Th>Amount</Th>
              <Th>Method</Th>
              <Th>Status</Th>
              <Th>Processed</Th>
            </tr>
          }
        >
          {payouts.map((p) => (
            <tr key={p.id}>
              <Td className="text-ink-soft">{dateTime(p.createdAt)}</Td>
              <Td className="font-semibold text-ink">{money(p.amount)}</Td>
              <Td>{p.method ?? "—"}</Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td className="text-ink-soft">
                {p.processedAt ? dateTime(p.processedAt) : "—"}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
