"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestPayout } from "@/lib/actions/affiliate";

export default function RequestPayout({
  available,
  min,
  canRequest,
}: {
  available: number;
  min: number;
  canRequest: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    setMsg(null);
    startTransition(async () => {
      const res = await requestPayout();
      if (res?.error) setMsg(res.error);
      else router.refresh();
    });
  }

  const disabled = !canRequest || available < min || pending;

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="press inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Request payout (${available.toFixed(2)})
      </button>
      {msg && <p className="mt-2 text-sm text-meter-poor">{msg}</p>}
      {!canRequest && (
        <p className="mt-2 text-xs text-ink-soft">
          Payouts unlock once your account is approved.
        </p>
      )}
    </div>
  );
}
