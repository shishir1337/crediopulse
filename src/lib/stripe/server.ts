import { cookies } from "next/headers";
import Stripe from "stripe";
import { ATTR_COOKIE, decodeAttribution } from "@/lib/affiliate/attribution";

/**
 * Server-side Stripe client. Uses the SDK's pinned API version
 * (stripe@22 → 2026-05-27.dahlia), which supports flexible billing mode and
 * `latest_invoice.confirmation_secret`.
 *
 * Returns null when STRIPE_SECRET_KEY is not configured so callers can surface a
 * friendly "not configured" message instead of crashing.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = secretKey ? new Stripe(secretKey) : null;

export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.",
    );
  }
  return stripe;
}

export type ConfirmedCheckout = {
  paid: boolean;
  email: string | null;
};

/**
 * Confirms a Checkout Session when Stripe redirects the customer back with
 * `?session_id=cs_...`, and — for a genuinely paid session — records the
 * affiliate conversion from the first-party attribution cookie carried on this
 * request. (The Stripe webhook can't do this: it never sees the `cp_attr`
 * cookie, and Payment Links don't carry affiliate metadata.) Recording is
 * idempotent, so refreshing the success page never double-credits.
 *
 * Returns null when the session can't be retrieved (bad/forged id, Stripe not
 * configured, etc.) so callers can fall back to the normal checkout flow.
 */
export async function confirmCheckoutSession(
  sessionId: string,
): Promise<ConfirmedCheckout | null> {
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (error) {
    // Most common cause: a test-mode session id (cs_test_...) looked up with a
    // live secret key (or vice-versa) — Stripe returns "No such checkout
    // session". Log it so the fallback-to-form isn't a silent mystery.
    console.error(
      `[stripe] confirmCheckoutSession(${sessionId}) failed:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }

  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  const email =
    session.customer_details?.email ?? session.customer_email ?? null;

  if (paid) await recordSessionConversion(session);

  return { paid, email };
}

/** Credits the attributed affiliate for a paid checkout session. No-op for an
 * organic sale (no attribution cookie). Failures are logged, never thrown — a
 * bookkeeping miss must not break the customer's confirmation page. */
async function recordSessionConversion(session: Stripe.Checkout.Session) {
  try {
    const cookieStore = await cookies();
    const attr = decodeAttribution(cookieStore.get(ATTR_COOKIE)?.value);
    if (!attr) return; // organic sale — no affiliate to credit

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer?.id ?? null);
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? null);

    const { recordConversion } = await import("@/lib/affiliate/conversion");
    await recordConversion({
      // The clickId is authoritative — recordConversion re-loads it and trusts
      // the click's affiliateId, so a tampered cookie can't steal a sale.
      clickId: attr.c,
      affiliateIdHint: attr.a,
      visitorId: attr.v,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      // Stable idempotency key: re-confirming the same session is a no-op, and
      // a later invoice.paid webhook dedups on the subscription id.
      stripeEventId: session.id,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? "usd",
      buyerEmail: session.customer_details?.email ?? session.customer_email,
      plan: session.metadata?.plan ?? null,
      cycle: session.metadata?.cycle ?? null,
    });
  } catch (error) {
    console.error(
      "[stripe] recordSessionConversion failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
