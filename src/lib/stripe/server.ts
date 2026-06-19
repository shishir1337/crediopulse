import Stripe from "stripe";

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
 * Looks up a Checkout Session by id and reports whether it has been paid.
 * Used when Stripe redirects the customer back with `?session_id=cs_...` so we
 * can confirm payment server-side before showing the confirmation page.
 * Returns null when the session can't be retrieved (bad/forged id, Stripe not
 * configured, etc.) so callers can fall back to the normal checkout flow.
 */
export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<ConfirmedCheckout | null> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    const email =
      session.customer_details?.email ?? session.customer_email ?? null;
    return { paid, email };
  } catch (error) {
    // Most common cause: a test-mode session id (cs_test_...) looked up with a
    // live secret key (or vice-versa) — Stripe returns "No such checkout
    // session". Log it so the fallback-to-form isn't a silent mystery.
    console.error(
      `[stripe] retrieveCheckoutSession(${sessionId}) failed:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
