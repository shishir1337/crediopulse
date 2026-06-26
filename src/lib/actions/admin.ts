"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/affiliate/settings";
import { requireAdmin } from "@/lib/auth-helpers";
import { getRequestOrigin } from "@/lib/base-url";
import { generateRefCode } from "@/lib/ids";
import { PLANS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const AFFILIATE_STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "BANNED",
] as const;

/**
 * Admin-only: create an affiliate account directly (public signup never makes
 * affiliates). Creates the auth user via a server-side call to the sign-up
 * endpoint — done with fetch, NOT auth.api, so the new user's session cookie is
 * not applied to the admin's browser — then promotes them to an active
 * affiliate. If the email already exists, it's promoted in place.
 */
export async function createAffiliateAccount(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    !name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8
  ) {
    redirect("/admin/affiliates?error=invalid");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const origin = await getRequestOrigin();
    const res = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Better Auth's CSRF guard rejects requests whose Origin isn't a
        // trusted origin. A server-side fetch sends no Origin by default, which
        // it treats as a forgery (403 MISSING_OR_NULL_ORIGIN). Send our own
        // origin explicitly — it matches trustedOrigins (BETTER_AUTH_URL).
        Origin: origin,
      },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      // Surface the real reason instead of always blaming a duplicate email.
      const code = await res
        .json()
        .then((b) => (b as { code?: string }).code)
        .catch(() => undefined);
      const reason = code === "USER_ALREADY_EXISTS" ? "exists" : "signup";
      redirect(`/admin/affiliates?error=${reason}`);
    }
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/admin/affiliates?error=exists");

  // Promote to an active affiliate (don't demote an existing admin).
  if (user.role !== "admin") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "affiliate" },
    });
  }
  await prisma.affiliate.upsert({
    where: { userId: user.id },
    update: { status: "ACTIVE" },
    create: {
      userId: user.id,
      refCode: generateRefCode(),
      status: "ACTIVE",
    },
  });

  revalidatePath("/admin/affiliates");
  redirect("/admin/affiliates?created=1");
}

/** DEBUG ONLY — wipe captured checkout debug rows. */
export async function clearCheckoutDebug() {
  await requireAdmin();
  await prisma.checkoutDebug.deleteMany({});
  revalidatePath("/admin/checkout-debug");
}

export async function setAffiliateStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!(AFFILIATE_STATUSES as readonly string[]).includes(status)) return;
  await prisma.affiliate.update({
    where: { id },
    data: { status: status as (typeof AFFILIATE_STATUSES)[number] },
  });
  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/affiliates/${id}`);
}

export async function setAffiliateCommission(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  const rateRaw = String(formData.get("rate") ?? "").trim();

  const type = typeRaw === "PERCENT" || typeRaw === "FLAT" ? typeRaw : null;
  const rate = rateRaw === "" ? null : Number(rateRaw);

  await prisma.affiliate.update({
    where: { id },
    data: {
      commissionType: type,
      commissionRate: rate != null && !Number.isNaN(rate) ? rate : null,
    },
  });
  revalidatePath(`/admin/affiliates/${id}`);
}

export async function reviewConversion(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note =
    String(formData.get("note") ?? "")
      .trim()
      .slice(0, 300) || null;

  const conversion = await prisma.conversion.findUnique({
    where: { id },
    include: { commission: true },
  });
  if (!conversion) return;

  if (decision === "APPROVE") {
    const settings = await getSettings();
    await prisma.conversion.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });
    if (conversion.commission) {
      await prisma.commission.update({
        where: { id: conversion.commission.id },
        data: {
          status: "PENDING",
          payableAt: new Date(Date.now() + settings.holdDays * 86_400_000),
        },
      });
    }
  } else if (decision === "REJECT") {
    await prisma.conversion.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });
    if (conversion.commission) {
      await prisma.commission.update({
        where: { id: conversion.commission.id },
        data: { status: "REVERSED" },
      });
    }
    await prisma.affiliate.update({
      where: { id: conversion.affiliateId },
      data: { trustScore: { decrement: 6 } },
    });
  }

  revalidatePath("/admin/conversions");
}

export async function processPayout(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");

  const payout = await prisma.payout.findUnique({ where: { id } });
  if (!payout) return;

  if (action === "PAID") {
    await prisma.$transaction([
      prisma.payout.update({
        where: { id },
        data: { status: "PAID", processedAt: new Date() },
      }),
      prisma.commission.updateMany({
        where: { payoutId: id },
        data: { status: "PAID" },
      }),
    ]);
  } else if (action === "REJECTED") {
    // Release the commissions back to "available".
    await prisma.$transaction([
      prisma.payout.update({
        where: { id },
        data: { status: "REJECTED", processedAt: new Date() },
      }),
      prisma.commission.updateMany({
        where: { payoutId: id },
        data: { payoutId: null },
      }),
    ]);
  } else if (action === "APPROVED") {
    await prisma.payout.update({ where: { id }, data: { status: "APPROVED" } });
  }

  revalidatePath("/admin/payouts");
}

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const numField = (k: string, fallback: number) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) ? v : fallback;
  };
  const current = await getSettings();
  const typeRaw = String(formData.get("defaultCommissionType") ?? "");
  await prisma.setting.update({
    where: { id: "global" },
    data: {
      defaultCommissionType: typeRaw === "FLAT" ? "FLAT" : "PERCENT",
      defaultCommissionRate: numField(
        "defaultCommissionRate",
        Number(current.defaultCommissionRate),
      ),
      cookieWindowDays: numField("cookieWindowDays", current.cookieWindowDays),
      flagThreshold: numField("flagThreshold", current.flagThreshold),
      rejectThreshold: numField("rejectThreshold", current.rejectThreshold),
      minPayout: numField("minPayout", Number(current.minPayout)),
      holdDays: numField("holdDays", current.holdDays),
    },
  });
  revalidatePath("/admin/settings");
}

/**
 * Admin-only: set each plan's hosted Stripe payment-link URL. A blank value is
 * allowed and means "no link yet" — checkout treats that plan as unbuyable
 * rather than opening a broken tab. Non-blank values must be https URLs.
 */
export async function updatePlanPaymentUrls(formData: FormData) {
  await requireAdmin();

  const updates = PLANS.map((plan) => ({
    planId: plan.id,
    paymentUrl: String(formData.get(`url_${plan.id}`) ?? "").trim(),
  }));

  // Validate before writing anything — reject the whole submit on a bad URL so
  // the admin doesn't end up with a half-saved form.
  for (const u of updates) {
    if (u.paymentUrl && !/^https:\/\/\S+$/i.test(u.paymentUrl)) {
      redirect("/admin/plans?error=invalid");
    }
  }

  await Promise.all(
    updates.map((u) =>
      prisma.planStripeConfig.upsert({
        where: { planId: u.planId },
        update: { paymentUrl: u.paymentUrl },
        create: u,
      }),
    ),
  );

  revalidatePath("/admin/plans");
  revalidatePath("/signup");
  redirect("/admin/plans?saved=1");
}

/**
 * Admin-only: set the Stripe secret key + webhook secret used at runtime.
 * Stored in the Setting row (no env / redeploy needed). A blank field is left
 * unchanged so an accidental empty submit can't wipe a live credential — use
 * the explicit clear checkbox to remove one.
 */
export async function updateStripeCredentials(formData: FormData) {
  await requireAdmin();
  const current = await getSettings();

  const secretIn = String(formData.get("stripeSecretKey") ?? "").trim();
  const webhookIn = String(formData.get("stripeWebhookSecret") ?? "").trim();
  const clearSecret = formData.get("clearStripeSecretKey") === "on";
  const clearWebhook = formData.get("clearStripeWebhookSecret") === "on";

  const stripeSecretKey = clearSecret
    ? ""
    : secretIn || current.stripeSecretKey;
  const stripeWebhookSecret = clearWebhook
    ? ""
    : webhookIn || current.stripeWebhookSecret;

  await prisma.setting.update({
    where: { id: "global" },
    data: { stripeSecretKey, stripeWebhookSecret },
  });

  revalidatePath("/admin/plans");
  redirect("/admin/plans?saved=creds");
}

export async function setUserRole(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "admin" && role !== "affiliate") return;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/affiliates");
}
