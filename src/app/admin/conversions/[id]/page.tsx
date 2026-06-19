import { notFound } from "next/navigation";
import CheckoutDebugRows from "@/components/admin/CheckoutDebugRows";
import { StatCard } from "@/components/dash/StatCard";
import { Badge, Card, EmptyState, StatusBadge } from "@/components/dash/ui";
import { requireAdmin } from "@/lib/auth-helpers";
import { dateTime, money } from "@/lib/format";
import { FRAUD_LABELS } from "@/lib/fraud/engine";
import { prisma } from "@/lib/prisma";

export default async function ConversionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const conversion = await prisma.conversion.findUnique({
    where: { id },
    include: { affiliate: { include: { user: true } }, commission: true },
  });
  if (!conversion) notFound();

  // Captured checkout data for this buyer (matched by Stripe customer).
  const debugRows = conversion.stripeCustomerId
    ? await prisma.checkoutDebug.findMany({
        where: { stripeCustomerId: conversion.stripeCustomerId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div>
      <a
        href="/admin/conversions"
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← All conversions
      </a>

      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Conversion detail
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {dateTime(conversion.createdAt)} ·{" "}
            <a
              href={`/admin/affiliates/${conversion.affiliateId}`}
              className="font-semibold text-brand-700 hover:underline"
            >
              {conversion.affiliate.user.name}
            </a>
          </p>
        </div>
        <StatusBadge status={conversion.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sale" value={money(conversion.amount)} />
        <StatCard
          label="Commission"
          value={
            conversion.commission ? money(conversion.commission.amount) : "—"
          }
          tone="amber"
        />
        <StatCard
          label="Plan"
          value={conversion.plan ?? "—"}
          sub={conversion.cycle ?? ""}
        />
        <StatCard
          label="Risk"
          value={String(conversion.fraudScore)}
          tone={conversion.fraudScore >= 40 ? "red" : "green"}
        />
      </div>

      {conversion.flags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {conversion.flags.map((f) => (
            <Badge key={f} tone="red">
              {FRAUD_LABELS[f] ?? f}
            </Badge>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <h2 className="mb-2 font-display text-base font-semibold text-ink">
          Stripe references
        </h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-soft">
              Customer
            </dt>
            <dd className="break-all font-mono text-ink">
              {conversion.stripeCustomerId ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-soft">
              Subscription
            </dt>
            <dd className="break-all font-mono text-ink">
              {conversion.stripeSubscriptionId ?? "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <h2 className="mt-8 mb-3 font-display text-lg font-semibold text-ink">
        Checkout data
      </h2>
      {debugRows.length === 0 ? (
        <EmptyState>
          No checkout data captured for this sale. (The debug logger may have
          been off, or this conversion predates it.)
        </EmptyState>
      ) : (
        <CheckoutDebugRows rows={debugRows} />
      )}
    </div>
  );
}
