"use server";

import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/affiliate/settings";
import { requireAffiliate } from "@/lib/auth-helpers";
import { generateLinkCode } from "@/lib/ids";
import { prisma } from "@/lib/prisma";

function cleanDestination(raw: string): string {
  const v = (raw || "/").trim();
  if (!v.startsWith("/")) return "/";
  // strip any protocol/host injection
  return v.replace(/[\r\n]/g, "").slice(0, 200);
}

export async function createLink(formData: FormData) {
  const { affiliate } = await requireAffiliate();
  const label =
    String(formData.get("label") ?? "")
      .trim()
      .slice(0, 80) || null;
  const destination = cleanDestination(
    String(formData.get("destination") ?? "/"),
  );

  await prisma.affiliateLink.create({
    data: {
      affiliateId: affiliate.id,
      code: generateLinkCode(),
      label,
      destination,
    },
  });
  revalidatePath("/dashboard/links");
}

export async function toggleLink(formData: FormData) {
  const { affiliate } = await requireAffiliate();
  const id = String(formData.get("id") ?? "");
  const link = await prisma.affiliateLink.findUnique({ where: { id } });
  if (!link || link.affiliateId !== affiliate.id) return;
  await prisma.affiliateLink.update({
    where: { id },
    data: { isActive: !link.isActive },
  });
  revalidatePath("/dashboard/links");
}

export async function savePayoutDetails(formData: FormData) {
  const { affiliate } = await requireAffiliate();
  const method =
    String(formData.get("method") ?? "")
      .trim()
      .slice(0, 40) || null;
  const details =
    String(formData.get("details") ?? "")
      .trim()
      .slice(0, 200) || null;
  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { payoutMethod: method, payoutDetails: details },
  });
  revalidatePath("/dashboard/payouts");
}

export async function requestPayout() {
  const { affiliate } = await requireAffiliate();
  const settings = await getSettings();

  if (affiliate.status !== "ACTIVE") {
    return {
      error: "Your account must be approved before requesting a payout.",
    };
  }

  const available = await prisma.commission.findMany({
    where: {
      affiliateId: affiliate.id,
      status: "PENDING",
      payableAt: { lte: new Date() },
      payoutId: null,
    },
    select: { id: true, amount: true },
  });

  const total = available.reduce((sum, c) => sum + Number(c.amount), 0);
  const min = Number(settings.minPayout);
  if (total < min) {
    return {
      error: `Minimum payout is $${min.toFixed(2)}. You have $${total.toFixed(2)} available.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    const payout = await tx.payout.create({
      data: {
        affiliateId: affiliate.id,
        amount: total,
        method: affiliate.payoutMethod,
        status: "REQUESTED",
      },
    });
    await tx.commission.updateMany({
      where: { id: { in: available.map((c) => c.id) } },
      data: { payoutId: payout.id },
    });
  });

  revalidatePath("/dashboard/payouts");
  return { ok: true };
}
