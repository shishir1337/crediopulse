import { redirect } from "next/navigation";
import { getSession, homeForRole, roleOf } from "@/lib/auth-helpers";

/**
 * Sends a freshly-authenticated user to the right home for their role:
 * admins → /admin, customers → /account, affiliates → /dashboard.
 */
export default async function PostLogin() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(homeForRole(roleOf(session.user)));
}
