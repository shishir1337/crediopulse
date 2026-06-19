import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
};

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-50/30" />}>
      <SuccessContent />
    </Suspense>
  );
}
