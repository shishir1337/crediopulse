import {
  type ConversionContext,
  conversionStatusFor,
  scoreConversion,
} from "@/lib/fraud/engine";
import { prisma } from "@/lib/prisma";
import { getSettings } from "./settings";

export type RecordConversionInput = {
  clickId?: string | null;
  affiliateIdHint?: string | null;
  visitorId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeEventId?: string | null;
  plan?: string | null;
  cycle?: string | null;
  amount: number;
  currency?: string;
  buyerEmail?: string | null;
};

function calcCommission(
  amount: number,
  type: "PERCENT" | "FLAT",
  rate: number,
): number {
  const value = type === "PERCENT" ? (amount * rate) / 100 : rate;
  return Math.round(value * 100) / 100;
}

/**
 * Records an affiliate conversion from a sale. Idempotent on the Stripe event /
 * subscription id. Resolves attribution from the click (source of truth), scores
 * fraud, sets the conversion status, and books a commission unless rejected.
 *
 * Returns the conversion, or null when the sale has no affiliate attribution.
 */
export async function recordConversion(input: RecordConversionInput) {
  // Idempotency — never double-credit a webhook retry.
  if (input.stripeEventId) {
    const dup = await prisma.conversion.findUnique({
      where: { stripeEventId: input.stripeEventId },
    });
    if (dup) return dup;
  }
  if (input.stripeSubscriptionId) {
    const dup = await prisma.conversion.findUnique({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
    });
    if (dup) return dup;
  }

  // Resolve the attributed click + affiliate. The click is authoritative.
  const click = input.clickId
    ? await prisma.click.findUnique({ where: { id: input.clickId } })
    : null;

  const affiliateId = click?.affiliateId ?? input.affiliateIdHint ?? null;
  if (!affiliateId) return null; // organic sale, no affiliate credit

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: { user: true },
  });
  if (!affiliate) return null;

  const settings = await getSettings();

  // Fraud context
  const secondsSinceClick = click
    ? (Date.now() - click.createdAt.getTime()) / 1000
    : null;
  const selfPurchase = Boolean(
    input.buyerEmail &&
      affiliate.user.email &&
      input.buyerEmail.toLowerCase() === affiliate.user.email.toLowerCase(),
  );
  const duplicateBuyer = input.stripeCustomerId
    ? (await prisma.conversion.count({
        where: { stripeCustomerId: input.stripeCustomerId },
      })) > 0
    : false;

  const ctx: ConversionContext = {
    hasClick: Boolean(click),
    clickStatus: click?.status,
    secondsSinceClick,
    selfPurchase,
    duplicateBuyer,
    affiliateTrustScore: affiliate.trustScore,
  };
  const { score, flags } = scoreConversion(ctx);
  const status = conversionStatusFor(
    score,
    settings.flagThreshold,
    settings.rejectThreshold,
  );

  const conversion = await prisma.conversion.create({
    data: {
      affiliateId,
      linkId: click?.linkId ?? null,
      clickId: click?.id ?? null,
      visitorId: input.visitorId ?? click?.visitorId ?? null,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      stripeEventId: input.stripeEventId ?? null,
      plan: input.plan ?? null,
      cycle: input.cycle ?? null,
      amount: input.amount,
      currency: input.currency ?? "usd",
      status,
      fraudScore: score,
      flags,
    },
  });

  // Audit log for the fraud queue.
  if (flags.length > 0) {
    await prisma.fraudEvent.create({
      data: {
        affiliateId,
        conversionId: conversion.id,
        scope: "CONVERSION",
        type: flags[0],
        severity: score,
        detail: flags.join(", "),
        meta: { flags, status },
      },
    });
  }

  // Book a commission unless the conversion was auto-rejected.
  if (status !== "REJECTED") {
    const type = affiliate.commissionType ?? settings.defaultCommissionType;
    const rate = Number(
      affiliate.commissionRate ?? settings.defaultCommissionRate,
    );
    const amount = calcCommission(input.amount, type, rate);
    const payableAt =
      status === "APPROVED"
        ? new Date(Date.now() + settings.holdDays * 86_400_000)
        : null;

    await prisma.commission.create({
      data: {
        affiliateId,
        conversionId: conversion.id,
        amount,
        type,
        rate,
        status: "PENDING",
        payableAt,
      },
    });
  }

  // Nudge the affiliate's trust score on bad outcomes (repeat offenders sink).
  if (status === "REJECTED" || status === "FLAGGED") {
    const delta = status === "REJECTED" ? 12 : 5;
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { trustScore: Math.max(0, affiliate.trustScore - delta) },
    });
  }

  return conversion;
}

/**
 * Reverses conversions (refund / chargeback / cancellation): marks them REFUNDED
 * and reverses any non-paid commission, clawing back trust. Idempotent.
 */
export async function reverseConversion(args: {
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  reason: string;
}) {
  const conversions = await prisma.conversion.findMany({
    where: {
      OR: [
        args.stripeSubscriptionId
          ? { stripeSubscriptionId: args.stripeSubscriptionId }
          : undefined,
        args.stripeCustomerId
          ? { stripeCustomerId: args.stripeCustomerId }
          : undefined,
      ].filter(Boolean) as object[],
      status: { not: "REFUNDED" },
    },
    include: { commission: true },
  });

  for (const conv of conversions) {
    await prisma.conversion.update({
      where: { id: conv.id },
      data: {
        status: "REFUNDED",
        reviewNote: `Auto-reversed: ${args.reason}`,
      },
    });
    if (conv.commission && conv.commission.status !== "PAID") {
      await prisma.commission.update({
        where: { id: conv.commission.id },
        data: { status: "REVERSED" },
      });
    }
    await prisma.fraudEvent.create({
      data: {
        affiliateId: conv.affiliateId,
        conversionId: conv.id,
        scope: "CONVERSION",
        type: args.reason,
        severity: 60,
        detail: `Conversion reversed (${args.reason})`,
      },
    });
    await prisma.affiliate.update({
      where: { id: conv.affiliateId },
      data: { trustScore: { decrement: 8 } },
    });
  }
}
