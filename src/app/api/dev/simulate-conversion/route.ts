import { type NextRequest, NextResponse } from "next/server";
import { ATTR_COOKIE, decodeAttribution } from "@/lib/affiliate/attribution";
import { recordConversion } from "@/lib/affiliate/conversion";
import { generateLinkCode } from "@/lib/ids";

/**
 * DEV ONLY — simulate a paid conversion for the current attribution cookie so the
 * affiliate pipeline (attribution → fraud scoring → commission) can be tested
 * without live Stripe keys. Disabled in production.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Disabled in production." },
      { status: 403 },
    );
  }

  const attr = decodeAttribution(request.cookies.get(ATTR_COOKIE)?.value);
  if (!attr) {
    return NextResponse.json(
      {
        error:
          "No attribution cookie. Visit an affiliate link (/r/<code>) first.",
      },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    amount?: number;
    plan?: string;
    cycle?: string;
    buyerEmail?: string;
  };

  const conversion = await recordConversion({
    clickId: attr.c,
    affiliateIdHint: attr.a,
    visitorId: attr.v,
    stripeSubscriptionId: `sim_${generateLinkCode()}`,
    stripeEventId: `sim_evt_${generateLinkCode()}`,
    stripeCustomerId: `sim_cus_${generateLinkCode()}`,
    plan: body.plan ?? "secure-pro",
    cycle: body.cycle ?? "yearly",
    amount: body.amount ?? 206.28,
    currency: "usd",
    buyerEmail: body.buyerEmail ?? null,
  });

  return NextResponse.json({
    ok: true,
    conversion: conversion
      ? {
          id: conversion.id,
          status: conversion.status,
          fraudScore: conversion.fraudScore,
          flags: conversion.flags,
          amount: conversion.amount,
        }
      : null,
  });
}
