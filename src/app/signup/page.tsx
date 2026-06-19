import type { Metadata } from "next";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { getPlan } from "@/lib/plans";
import { confirmCheckoutSession } from "@/lib/stripe/server";

export const metadata: Metadata = {
  title: "Get Protected — Create Your Account",
  description:
    "Start your Credio Pulse protection in minutes. Create your account and complete secure checkout.",
  robots: { index: false, follow: false },
};

type SignupPageProps = {
  searchParams: Promise<{
    plan?: string;
    cycle?: string;
    session_id?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { plan, session_id } = await searchParams;

  // When Stripe redirects back with ?session_id=cs_..., confirm the payment
  // server-side (this also records the affiliate conversion from the attribution
  // cookie). Only a genuinely paid session unlocks the confirmation page.
  let confirmedEmail: string | null = null;
  if (session_id) {
    const session = await confirmCheckoutSession(session_id);
    if (session?.paid) confirmedEmail = session.email ?? "";
  }

  return <CheckoutFlow plan={getPlan(plan)} confirmedEmail={confirmedEmail} />;
}
