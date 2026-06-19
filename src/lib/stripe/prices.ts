import type { BillingCycle, PlanId } from "@/lib/plans";

/**
 * Maps each plan + billing cycle to a Stripe Price ID, read from environment
 * variables. Create one recurring Price per cell in the Stripe Dashboard
 * (monthly and yearly) and set the matching env vars — see docs/STRIPE_SETUP.md.
 *
 * This is server-only (reads non-public env vars).
 */
const PRICE_ENV: Record<PlanId, Record<BillingCycle, string | undefined>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  },
  "secure-basic": {
    monthly: process.env.STRIPE_PRICE_SECURE_BASIC_MONTHLY,
    yearly: process.env.STRIPE_PRICE_SECURE_BASIC_YEARLY,
  },
  "secure-plus": {
    monthly: process.env.STRIPE_PRICE_SECURE_PLUS_MONTHLY,
    yearly: process.env.STRIPE_PRICE_SECURE_PLUS_YEARLY,
  },
  "secure-pro": {
    monthly: process.env.STRIPE_PRICE_SECURE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_SECURE_PRO_YEARLY,
  },
};

export function priceIdFor(
  planId: PlanId,
  cycle: BillingCycle,
): string | undefined {
  return PRICE_ENV[planId]?.[cycle];
}
