import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { getSession, roleOf } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await getSession();
  if (session)
    redirect(roleOf(session.user) === "admin" ? "/admin" : "/dashboard");
  return <AuthForm mode="login" />;
}
