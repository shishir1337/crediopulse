import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { generateRefCode } from "./ids";
import { prisma } from "./prisma";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Role lives on the Better Auth user via additionalFields. */
export function roleOf(
  user: { role?: string | null } | undefined | null,
): string {
  return user?.role ?? "customer";
}

/** The landing area for a given role after login. */
export function homeForRole(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "customer") return "/account";
  return "/dashboard";
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (roleOf(session.user) !== "admin")
    redirect(homeForRole(roleOf(session.user)));
  return session;
}

/** Ensures a logged-in customer and returns their full user record. */
export async function requireCustomer() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  const role = roleOf(session.user);
  // Affiliates/admins have their own areas — send them there.
  if (role === "affiliate") redirect("/dashboard");
  if (role === "admin") redirect("/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login?next=/account");
  return { session, user };
}

/** Ensures an affiliate session and returns the affiliate profile (lazy-created). */
export async function requireAffiliate() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  // Customers must never get an affiliate profile.
  if (roleOf(session.user) === "customer") redirect("/account");

  let affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
  });
  if (!affiliate) {
    try {
      affiliate = await prisma.affiliate.create({
        data: {
          userId: session.user.id,
          refCode: generateRefCode(),
          status: "PENDING",
        },
      });
    } catch {
      // Race: a concurrent first-load request already created it — re-read.
      affiliate = await prisma.affiliate.findUnique({
        where: { userId: session.user.id },
      });
    }
  }
  if (!affiliate) redirect("/login?next=/dashboard");

  return { session, user: session.user, affiliate };
}
