"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Lazily loads Stripe.js on the client using the publishable key.
 * Returns null when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set so the
 * checkout can render a "payments unavailable" notice instead of breaking.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
