import { PLANS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

/**
 * Per-plan Stripe payment-link URLs, editable from /admin/plans. Stored in the
 * DB (PlanStripeConfig) so links can change without a code change or redeploy.
 */

/**
 * Returns a map of planId → payment URL, seeding empty rows for any plan in
 * PLANS that doesn't have one yet (so the admin page always lists every plan).
 */
export async function getPlanPaymentUrls(): Promise<Record<string, string>> {
  const rows = await prisma.planStripeConfig.findMany();
  const byId = new Map(rows.map((r) => [r.planId, r.paymentUrl]));

  const missing = PLANS.filter((p) => !byId.has(p.id));
  if (missing.length) {
    await prisma.planStripeConfig.createMany({
      data: missing.map((p) => ({ planId: p.id, paymentUrl: "" })),
      skipDuplicates: true,
    });
    for (const p of missing) byId.set(p.id, "");
  }

  return Object.fromEntries(byId);
}

/** Returns the payment URL for a single plan, or "" if none is set. */
export async function getPlanPaymentUrl(planId: string): Promise<string> {
  const row = await prisma.planStripeConfig.findUnique({ where: { planId } });
  return row?.paymentUrl ?? "";
}
