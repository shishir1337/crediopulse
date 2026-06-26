import { Badge, Card, PageHeader } from "@/components/dash/ui";
import {
  updatePlanPaymentUrls,
  updateStripeCredentials,
} from "@/lib/actions/admin";
import { getSettings } from "@/lib/affiliate/settings";
import { requireAdmin } from "@/lib/auth-helpers";
import { PLANS } from "@/lib/plans";
import { getPlanPaymentUrls } from "@/lib/stripe/plan-config";

type PageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

/** Masked hint for a stored secret — never renders the full value. */
function maskHint(value: string): string {
  if (!value) return "Not set";
  const tail = value.slice(-4);
  return `Configured ····${tail}`;
}

export default async function AdminPlans({ searchParams }: PageProps) {
  await requireAdmin();
  const { saved, error } = await searchParams;
  const urls = await getPlanPaymentUrls();
  const settings = await getSettings();

  return (
    <div>
      <PageHeader
        title="Plans / Stripe"
        subtitle="Set the hosted Stripe payment link each plan sends buyers to. Changes apply immediately — no redeploy needed."
      />

      {saved === "1" && (
        <div className="mb-4 rounded-xl border border-meter-excellent/30 bg-meter-excellent/10 px-4 py-3 text-sm font-medium text-meter-excellent">
          Payment links saved.
        </div>
      )}
      {saved === "creds" && (
        <div className="mb-4 rounded-xl border border-meter-excellent/30 bg-meter-excellent/10 px-4 py-3 text-sm font-medium text-meter-excellent">
          Stripe credentials saved.
        </div>
      )}
      {error === "invalid" && (
        <div className="mb-4 rounded-xl border border-meter-poor/30 bg-meter-poor/10 px-4 py-3 text-sm font-medium text-meter-poor">
          Nothing saved — a payment link wasn’t a valid https:// URL.
        </div>
      )}

      <Card className="max-w-3xl">
        <form action={updatePlanPaymentUrls} className="space-y-6">
          {PLANS.map((plan) => {
            const url = urls[plan.id] ?? "";
            return (
              <div key={plan.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor={`url_${plan.id}`}
                    className="text-sm font-semibold text-ink"
                  >
                    {plan.name}{" "}
                    <span className="font-normal text-ink-soft">
                      ${plan.monthly.toFixed(2)}/mo
                    </span>
                  </label>
                  {url ? (
                    <Badge tone="green">Live</Badge>
                  ) : (
                    <Badge tone="amber">Not set</Badge>
                  )}
                </div>
                <input
                  id={`url_${plan.id}`}
                  name={`url_${plan.id}`}
                  type="url"
                  inputMode="url"
                  defaultValue={url}
                  placeholder="https://buy.stripe.com/…"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            );
          })}

          <p className="text-xs text-ink-soft">
            Leave a field blank to mark that plan as not yet purchasable — its
            checkout button stays disabled until a link is added.
          </p>

          <button
            type="submit"
            className="press rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Save payment links
          </button>
        </form>
      </Card>

      <Card className="mt-6 max-w-3xl">
        <h2 className="font-display text-base font-semibold text-ink">
          Stripe credentials
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Used to confirm payments on redirect and verify webhooks. Stored in
          the database — changes take effect immediately, no redeploy.
        </p>

        <form action={updateStripeCredentials} className="mt-5 space-y-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label
                htmlFor="stripeSecretKey"
                className="text-sm font-semibold text-ink"
              >
                Secret key{" "}
                <span className="font-normal text-ink-soft">
                  (sk_test_… / sk_live_…)
                </span>
              </label>
              {settings.stripeSecretKey ? (
                <Badge tone="green">{maskHint(settings.stripeSecretKey)}</Badge>
              ) : (
                <Badge tone="amber">Not set</Badge>
              )}
            </div>
            <input
              id="stripeSecretKey"
              name="stripeSecretKey"
              type="password"
              autoComplete="off"
              placeholder={
                settings.stripeSecretKey
                  ? "Enter a new key to replace"
                  : "sk_test_…"
              }
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <label className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
              <input type="checkbox" name="clearStripeSecretKey" /> Clear this
              key
            </label>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label
                htmlFor="stripeWebhookSecret"
                className="text-sm font-semibold text-ink"
              >
                Webhook secret{" "}
                <span className="font-normal text-ink-soft">(whsec_…)</span>
              </label>
              {settings.stripeWebhookSecret ? (
                <Badge tone="green">
                  {maskHint(settings.stripeWebhookSecret)}
                </Badge>
              ) : (
                <Badge tone="amber">Not set</Badge>
              )}
            </div>
            <input
              id="stripeWebhookSecret"
              name="stripeWebhookSecret"
              type="password"
              autoComplete="off"
              placeholder={
                settings.stripeWebhookSecret
                  ? "Enter a new secret to replace"
                  : "whsec_…"
              }
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <label className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
              <input type="checkbox" name="clearStripeWebhookSecret" /> Clear
              this secret
            </label>
          </div>

          <p className="text-xs text-ink-soft">
            Leave a field blank to keep the current value. Use test keys with
            test-mode payment links, live keys with live links.
          </p>

          <button
            type="submit"
            className="press rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Save credentials
          </button>
        </form>
      </Card>
    </div>
  );
}
