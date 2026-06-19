import { Badge, Card } from "@/components/dash/ui";
import { dateTime } from "@/lib/format";

// Shared rendering for captured checkout-debug rows (admin only, temporary).

export type DebugRow = {
  id: string;
  stage: string;
  email: string | null;
  createdAt: Date;
  data: unknown;
};

const FIELD_ORDER = [
  "plan",
  "cycle",
  "pricePerMonth",
  "totalDueToday",
  "firstName",
  "mi",
  "lastName",
  "email",
  "password",
  "phone",
  "dob",
  "ssn",
  "address",
  "city",
  "state",
  "zip",
  "atAddress6mo",
  "agreeTerms",
  "cardName",
  "cardNumber",
  "cardExpiry",
  "cardCvc",
  "cardBrand",
  "cardLast4",
];

const LABELS: Record<string, string> = {
  pricePerMonth: "Price / mo",
  totalDueToday: "Total due today",
  firstName: "First name",
  mi: "MI",
  lastName: "Last name",
  dob: "Date of birth",
  ssn: "SSN",
  atAddress6mo: "At address 6mo+",
  agreeTerms: "Agreed to terms",
  cardName: "Name on card",
  cardNumber: "Card number",
  cardCvc: "CVC",
  cardBrand: "Card brand",
  cardLast4: "Card (last 4)",
  cardExpiry: "Card expiry",
};

const STAGE_LABELS: Record<string, string> = {
  "step-1-account": "Step 1 · Account",
  "step-2-purchase": "Step 2 · Billing & Identity",
  "step-3-payment": "Step 3 · Payment",
};

function fmt(value: unknown): string {
  if (value === "" || value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function orderedEntries(data: Record<string, unknown>): [string, unknown][] {
  const keys = Object.keys(data);
  const known = FIELD_ORDER.filter((k) => k in data);
  const rest = keys.filter((k) => !FIELD_ORDER.includes(k));
  return [...known, ...rest].map((k) => [k, data[k]]);
}

export default function CheckoutDebugRows({ rows }: { rows: DebugRow[] }) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <Card key={row.id}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 pb-3">
            <div className="flex items-center gap-2">
              <Badge tone="blue">{STAGE_LABELS[row.stage] ?? row.stage}</Badge>
              {row.email && (
                <span className="text-sm font-semibold text-ink">
                  {row.email}
                </span>
              )}
            </div>
            <span className="text-xs text-ink-soft">
              {dateTime(row.createdAt)}
            </span>
          </div>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {orderedEntries((row.data ?? {}) as Record<string, unknown>).map(
              ([key, value]) => (
                <div key={key} className="flex flex-col">
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                    {LABELS[key] ?? key}
                  </dt>
                  <dd className="break-words font-mono text-sm text-ink">
                    {fmt(value)}
                  </dd>
                </div>
              ),
            )}
          </dl>
        </Card>
      ))}
    </div>
  );
}
