"use client";

import { ArrowRight, Check, CircleAlert, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CreditScoreCard from "@/components/checkout/CreditScoreCard";
import Logo from "@/components/landing/Logo";
import { getStripeClient } from "@/lib/stripe/client";

type Status = "loading" | "succeeded" | "processing" | "failed";

export default function SuccessContent() {
  const params = useSearchParams();
  const clientSecret = params.get("payment_intent_client_secret");
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const redirectStatus = params.get("redirect_status");
    if (redirectStatus === "succeeded") return setStatus("succeeded");
    if (redirectStatus === "processing") return setStatus("processing");

    const promise = getStripeClient();
    if (!promise || !clientSecret) return setStatus("failed");

    promise
      .then((stripe) => stripe?.retrievePaymentIntent(clientSecret))
      .then((res) => {
        const pi = res?.paymentIntent;
        if (pi?.receipt_email) setEmail(pi.receipt_email);
        const s = pi?.status;
        if (s === "succeeded") setStatus("succeeded");
        else if (s === "processing") setStatus("processing");
        else setStatus("failed");
      })
      .catch(() => setStatus("failed"));
  }, [params, clientSecret]);

  // Stable seed for the credit score: the buyer's email when we have it, else
  // the payment-intent secret (unique per purchase, so it stays consistent).
  const scoreSeed = email || clientSecret || "guest";

  return (
    <div className="min-h-screen bg-brand-50/30">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
          <a href="/" aria-label="Credio Pulse home">
            <Logo tone="dark" />
          </a>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            <p className="mt-4 text-ink-soft">Confirming your payment…</p>
          </>
        )}

        {(status === "succeeded" || status === "processing") && (
          <>
            <span className="grid h-20 w-20 place-items-center rounded-full bg-meter-excellent text-white shadow-lg shadow-meter-excellent/30">
              <Check className="h-10 w-10" strokeWidth={3} />
            </span>
            <h1 className="mt-7 font-display text-3xl font-bold text-ink">
              {status === "succeeded"
                ? "You're protected!"
                : "Payment received"}
            </h1>
            <p className="mt-3 text-ink-soft">
              {status === "succeeded"
                ? "Your subscription is active and we've started monitoring your credit and identity."
                : "Your payment is processing. We'll email you as soon as it clears and your protection is live."}
            </p>

            {status === "succeeded" && (
              <div className="mt-8 w-full">
                <CreditScoreCard seed={scoreSeed} />
              </div>
            )}

            <a
              href="/dashboard"
              className="press group mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-brand-500"
            >
              Go to my dashboard
              <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
            </a>
          </>
        )}

        {status === "failed" && (
          <>
            <span className="grid h-20 w-20 place-items-center rounded-full bg-meter-poor/15 text-meter-poor">
              <CircleAlert className="h-10 w-10" />
            </span>
            <h1 className="mt-7 font-display text-3xl font-bold text-ink">
              Payment didn&apos;t go through
            </h1>
            <p className="mt-3 text-ink-soft">
              Your card wasn&apos;t charged. Please try again with a different
              payment method.
            </p>
            <a
              href="/signup"
              className="press mt-8 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-brand-500"
            >
              Back to checkout
            </a>
          </>
        )}
      </main>
    </div>
  );
}
