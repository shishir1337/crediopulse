import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

/**
 * Stripe webhook receiver. Verifies the signature and acknowledges events.
 *
 * Provisioning (grant/revoke access, store subscription status) should happen
 * here once a database exists — webhooks are the reliable source of truth, since
 * the browser can close before client-side confirmation finishes. Configure the
 * endpoint URL and STRIPE_WEBHOOK_SECRET as described in docs/STRIPE_SETUP.md.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 503 },
    );
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "invoice.paid":
      await handleInvoicePaid(stripe, event);
      break;
    case "invoice.payment_failed":
      // TODO: notify the customer / flag the account.
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCancelled(event);
      break;
    case "charge.refunded":
      await handleRefund(event);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

/** On a paid invoice, credit the attributed affiliate (idempotent on event id). */
async function handleInvoicePaid(stripe: Stripe, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  // biome-ignore lint/suspicious/noExplicitAny: subscription location varies by API version
  const inv = invoice as any;
  const subId: string | undefined =
    typeof inv.subscription === "string"
      ? inv.subscription
      : inv.parent?.subscription_details?.subscription;

  let metadata: Record<string, string> = {};
  if (subId) {
    const sub = await stripe.subscriptions.retrieve(subId);
    metadata = (sub.metadata ?? {}) as Record<string, string>;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer?.id ?? null);

  const { recordConversion } = await import("@/lib/affiliate/conversion");
  await recordConversion({
    stripeEventId: event.id,
    stripeSubscriptionId: subId ?? null,
    stripeCustomerId: customerId,
    plan: metadata.plan ?? null,
    cycle: metadata.cycle ?? null,
    amount: (invoice.amount_paid ?? 0) / 100,
    currency: invoice.currency ?? "usd",
    buyerEmail: invoice.customer_email ?? null,
    clickId: metadata.aff_clickId ?? null,
    affiliateIdHint: metadata.aff_affiliateId ?? null,
    visitorId: metadata.aff_visitorId ?? null,
  });
}

/** Reverse commissions when a subscription is cancelled before any payment. */
async function handleSubscriptionCancelled(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const { reverseConversion } = await import("@/lib/affiliate/conversion");
  await reverseConversion({
    stripeSubscriptionId: sub.id,
    reason: "SUBSCRIPTION_CANCELLED",
  });
}

/** Reverse commissions on a refund/chargeback. */
async function handleRefund(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const customerId =
    typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) return;
  const { reverseConversion } = await import("@/lib/affiliate/conversion");
  await reverseConversion({ stripeCustomerId: customerId, reason: "REFUND" });
}
