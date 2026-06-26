import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { ATTR_COOKIE, decodeAttribution } from "@/lib/affiliate/attribution";
import { getPlan, normalizeCycle } from "@/lib/plans";
import { priceIdFor } from "@/lib/stripe/prices";
import { getStripe } from "@/lib/stripe/server";

/**
 * Creates (or reuses) a Stripe Customer and an incomplete Subscription, then
 * returns the client secret used to confirm the first payment with the embedded
 * Payment Element. Follows the "default_incomplete" subscription flow:
 * https://docs.stripe.com/billing/subscriptions/build-subscriptions
 */
export async function POST(request: NextRequest) {
  let stripe: Stripe;
  try {
    stripe = await getStripe();
  } catch {
    return NextResponse.json(
      { error: "Payments are not configured yet. Add your Stripe keys." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      planId?: string;
      cycle?: string;
      email?: string;
      name?: string;
      customerId?: string;
    };

    const plan = getPlan(body.planId);
    const cycle = normalizeCycle(body.cycle);
    const priceId = priceIdFor(plan.id, cycle);

    if (!priceId) {
      return NextResponse.json(
        {
          error: `No Stripe price is configured for "${plan.id}" (${cycle}). Set the matching STRIPE_PRICE_* env var.`,
        },
        { status: 400 },
      );
    }

    // Affiliate attribution: carry the referring click into Stripe metadata so
    // the webhook can credit the right affiliate when the invoice is paid.
    const attr = decodeAttribution(request.cookies.get(ATTR_COOKIE)?.value);
    const attributionMeta: Record<string, string> = attr
      ? { aff_clickId: attr.c, aff_affiliateId: attr.a, aff_visitorId: attr.v }
      : {};

    // Reuse an existing customer (e.g. when the user toggles billing cycle) or
    // create a new one.
    let customerId = body.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: body.email,
        name: body.name,
        metadata: { plan: plan.id, cycle, ...attributionMeta },
      });
      customerId = customer.id;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      billing_mode: { type: "flexible" },
      expand: [
        "latest_invoice.confirmation_secret",
        "latest_invoice.payment_intent",
      ],
      metadata: { plan: plan.id, cycle, ...attributionMeta },
    });

    // The client secret lives on the invoice's confirmation_secret in flexible
    // billing mode; fall back to the PaymentIntent for classic billing mode.
    // biome-ignore lint/suspicious/noExplicitAny: Stripe types lag these fields across API versions.
    const invoice = subscription.latest_invoice as any;
    const clientSecret: string | undefined =
      invoice?.confirmation_secret?.client_secret ??
      invoice?.payment_intent?.client_secret;

    if (!clientSecret) {
      return NextResponse.json(
        { error: "Could not obtain a payment client secret from Stripe." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret,
      customerId,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected Stripe error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
