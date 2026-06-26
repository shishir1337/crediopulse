import { cookies } from "next/headers";
import Stripe from "stripe";
import { ATTR_COOKIE, decodeAttribution } from "@/lib/affiliate/attribution";
import { getSettings } from "@/lib/affiliate/settings";
import { prisma } from "@/lib/prisma";

/**
 * Server-side Stripe client. Uses the SDK's pinned API version
 * (stripe@22 → 2026-05-27.dahlia), which supports flexible billing mode and
 * `latest_invoice.confirmation_secret`.
 *
 * The secret key is stored in the DB (Setting row) and managed from
 * /admin/plans — no env var or redeploy needed to change it. The client is
 * rebuilt only when the key actually changes.
 */
let cached: { key: string; client: Stripe } | null = null;

/**
 * Returns a Stripe client built from the secret key saved in the admin panel.
 * Throws when no key is set so callers can surface a friendly "not configured"
 * message instead of crashing.
 */
export async function getStripe(): Promise<Stripe> {
  const { stripeSecretKey } = await getSettings();
  if (!stripeSecretKey) {
    throw new Error(
      "Stripe is not configured. Add your secret key in Admin → Plans / Stripe.",
    );
  }
  if (!cached || cached.key !== stripeSecretKey) {
    cached = { key: stripeSecretKey, client: new Stripe(stripeSecretKey) };
  }
  return cached.client;
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
    session = await (await getStripe()).checkout.sessions.retrieve(sessionId);
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

  if (paid) {
    // Link the pre-payment checkout capture to the now-known customer, then
    // credit the affiliate. Both are best-effort and independent.
    await linkCheckoutDebug(session);
    await recordSessionConversion(session);
  }

  return { paid, email };
}

/** Stamps the now-known Stripe customer id onto this buyer's checkout-debug
 * rows. The debug logger captures form data at submit — before any Stripe
 * customer exists — so its rows have a null customer id and the admin
 * conversion page (which matches by customer id) can't find them. Matching the
 * buyer's email closes that gap. Best-effort; logged, never thrown. */
async function linkCheckoutDebug(session: Stripe.Checkout.Session) {
  try {
    const email = session.customer_details?.email ?? session.customer_email;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer?.id ?? null);
    if (!email || !customerId) return;

    await prisma.checkoutDebug.updateMany({
      where: {
        email: { equals: email, mode: "insensitive" },
        stripeCustomerId: null,
      },
      data: { stripeCustomerId: customerId },
    });
  } catch (error) {
    console.error(
      "[stripe] linkCheckoutDebug failed:",
      error instanceof Error ? error.message : error,
    );
  }
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
