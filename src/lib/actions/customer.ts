"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProvisionInput = {
  email: string;
  password: string;
  name: string;
  stripeCustomerId?: string | null;
  planId: string;
  cycle: string;
  subscriptionId?: string | null;
};

type ProvisionResult = { ok: boolean; loggedIn: boolean; error?: string };

/**
 * Called right after a successful checkout payment. Creates the customer's
 * Better Auth account (or signs them in if it already exists), tags them as a
 * "customer", and stores their subscription details. Because Better Auth runs
 * inside a Server Action here, the session cookie is set automatically — so the
 * buyer lands on their dashboard already logged in.
 *
 * Never throws: the payment already went through, so a provisioning hiccup must
 * not blow up the success screen.
 */
export async function provisionCustomerAccount(
  input: ProvisionInput,
): Promise<ProvisionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, loggedIn: false, error: "Missing account details." };
  }

  const reqHeaders = await headers();
  const existing = await prisma.user.findUnique({ where: { email } });

  let loggedIn = false;
  const isNew = !existing;

  try {
    if (isNew) {
      await auth.api.signUpEmail({
        body: { email, password: input.password, name: input.name || email },
        headers: reqHeaders,
      });
      loggedIn = true;
    } else {
      // Account already exists — sign them in with the supplied password.
      try {
        await auth.api.signInEmail({
          body: { email, password: input.password },
          headers: reqHeaders,
        });
        loggedIn = true;
      } catch {
        // Wrong password for an existing account — they'll log in manually.
        loggedIn = false;
      }
    }
  } catch (err) {
    return {
      ok: false,
      loggedIn: false,
      error:
        err instanceof Error ? err.message : "Could not set up your account.",
    };
  }

  // Persist subscription details. A completed purchase makes the buyer a
  // customer — promote anyone who isn't an admin (so they land on /account, not
  // the affiliate dashboard). Admins keep their role.
  const promoteToCustomer = existing?.role !== "admin";
  try {
    await prisma.user.update({
      where: { email },
      data: {
        ...(promoteToCustomer ? { role: "customer" } : {}),
        stripeCustomerId: input.stripeCustomerId ?? undefined,
        planId: input.planId,
        planCycle: input.cycle,
        subscriptionId: input.subscriptionId ?? undefined,
        subscriptionStatus: "active",
        subscribedAt: new Date(),
      },
    });
  } catch {
    // Non-fatal — payment succeeded regardless.
  }

  return { ok: true, loggedIn };
}
