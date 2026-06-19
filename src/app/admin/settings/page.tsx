import { Card, PageHeader } from "@/components/dash/ui";
import { updateSettings } from "@/lib/actions/admin";
import { getSettings } from "@/lib/affiliate/settings";
import { requireAdmin } from "@/lib/auth-helpers";

function Num({
  name,
  label,
  value,
  hint,
}: {
  name: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        name={name}
        type="number"
        step="any"
        defaultValue={value}
        className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export default async function AdminSettings() {
  await requireAdmin();
  const s = await getSettings();

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Commission defaults, fraud thresholds, and payout rules."
      />
      <Card className="max-w-2xl">
        <form action={updateSettings} className="space-y-6">
          <div>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">
              Commission
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Default type
                </label>
                <select
                  name="defaultCommissionType"
                  defaultValue={s.defaultCommissionType}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="PERCENT">Percent of sale</option>
                  <option value="FLAT">Flat amount</option>
                </select>
              </div>
              <Num
                name="defaultCommissionRate"
                label="Default rate"
                value={Number(s.defaultCommissionRate)}
                hint="% if percent, $ if flat"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">
              Fraud thresholds
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Num
                name="flagThreshold"
                label="Flag at risk ≥"
                value={s.flagThreshold}
                hint="Conversions at/above are held for review"
              />
              <Num
                name="rejectThreshold"
                label="Auto-reject at risk ≥"
                value={s.rejectThreshold}
                hint="Conversions at/above are auto-rejected"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-base font-semibold text-ink">
              Attribution & payouts
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Num
                name="cookieWindowDays"
                label="Cookie window (days)"
                value={s.cookieWindowDays}
              />
              <Num
                name="holdDays"
                label="Commission hold (days)"
                value={s.holdDays}
              />
              <Num
                name="minPayout"
                label="Minimum payout ($)"
                value={Number(s.minPayout)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="press rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Save settings
          </button>
        </form>
      </Card>
    </div>
  );
}
