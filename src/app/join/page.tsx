import { redirect } from "next/navigation";

// Public affiliate signup is disabled — affiliate accounts are created by an
// admin (Admin → Affiliates → Create affiliate). Send anyone who lands here to
// the login page.
export default function JoinPage() {
  redirect("/login");
}
