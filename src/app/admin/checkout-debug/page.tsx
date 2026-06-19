import { AlertTriangle, Trash2 } from "lucide-react";
import CheckoutDebugRows from "@/components/admin/CheckoutDebugRows";
import { EmptyState, PageHeader } from "@/components/dash/ui";
import { clearCheckoutDebug } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function CheckoutDebugPage() {
  await requireAdmin();
  const rows = await prisma.checkoutDebug.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Checkout Debug"
        subtitle="Raw checkout submissions captured for debugging."
        action={
          rows.length > 0 ? (
            <form action={clearCheckoutDebug}>
              <button
                type="submit"
                className="press inline-flex items-center gap-1.5 rounded-xl border border-meter-poor/30 bg-meter-poor/10 px-3.5 py-2 text-sm font-semibold text-meter-poor hover:bg-meter-poor/15"
              >
                <Trash2 className="h-4 w-4" /> Clear all
              </button>
            </form>
          ) : undefined
        }
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-meter-fair/40 bg-meter-fair/10 px-4 py-3 text-sm text-ink">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b45309]" />
        <p>
          <span className="font-semibold">Debug only.</span> This captures raw
          PII (SSN, DOB, password) in plaintext and must be removed before
          production — see{" "}
          <span className="font-mono">docs/STRIPE_SETUP.md</span>.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState>
          No checkout submissions yet. Complete a checkout step to see data
          here.
        </EmptyState>
      ) : (
        <CheckoutDebugRows rows={rows} />
      )}
    </div>
  );
}
