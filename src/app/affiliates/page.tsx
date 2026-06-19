import { redirect } from "next/navigation";

// Affiliate signup is admin-only now; point the old public link at login.
export default function AffiliatesRedirect() {
  redirect("/login");
}
