import { appendFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/server";

/**
 * ⚠️ DEBUG ONLY — REMOVE BEFORE PRODUCTION ⚠️
 * Captures raw checkout form data (including SSN and card details) for local
 * debugging — both to a plaintext file AND to the DB so it shows in the admin
 * panel (Admin → Checkout Debug). This must NOT ship to production: it stores
 * sensitive PII unencrypted.
 */

const LOG_FILE = path.join(process.cwd(), "checkout-debug.log");

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      stage?: string;
      fields?: Record<string, unknown>;
      paymentIntentId?: string;
      stripeCustomerId?: string | null;
    };

    const stamp = new Date().toISOString();
    const stage = body.stage ?? "unknown";
    const fields: Record<string, unknown> = { ...(body.fields ?? {}) };

    // Enrich with the (PCI-safe) card brand/last4/expiry from Stripe. The full
    // card number and CVC are never accessible to us — they live inside Stripe's
    // iframe — so this is the most card detail that can be captured.
    if (body.paymentIntentId) {
      try {
        const pi = await getStripe().paymentIntents.retrieve(
          body.paymentIntentId,
          { expand: ["payment_method"] },
        );
        const pm = pi.payment_method;
        if (pm && typeof pm !== "string" && pm.card) {
          // Add what Stripe actually charged WITHOUT clobbering the raw entered
          // values (cardName/cardNumber/cardExpiry/cardCvc stay as typed).
          fields.cardBrand = pm.card.brand;
          fields.cardLast4 = `•••• ${pm.card.last4}`;
        }
      } catch {
        // debug only — ignore Stripe lookup failures
      }
    }

    const lines = Object.entries(fields).map(
      ([key, value]) => `  ${key}: ${formatValue(value)}`,
    );

    const block = [
      "================================================================",
      `[${stamp}]  STAGE: ${stage}`,
      "----------------------------------------------------------------",
      ...lines,
      "================================================================",
      "",
      "",
    ].join("\n");

    await appendFile(LOG_FILE, block, "utf8");

    // Also persist for the admin panel.
    await prisma.checkoutDebug.create({
      data: {
        stage,
        email: typeof fields.email === "string" ? fields.email : null,
        plan: typeof fields.plan === "string" ? fields.plan : null,
        stripeCustomerId: body.stripeCustomerId ?? null,
        data: fields as object,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}

function formatValue(value: unknown): string {
  if (value === "" || value === null || value === undefined) return "(empty)";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}
