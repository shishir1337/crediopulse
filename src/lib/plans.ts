export type PlanId = "starter" | "secure-basic" | "secure-plus" | "secure-pro";

export type BillingCycle = "monthly" | "yearly";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Per-month price when billed monthly */
  monthly: number;
  /** Effective per-month price when billed yearly */
  yearly: number;
  popular?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Protection starter — just $1",
    monthly: 1,
    yearly: 0.8,
    features: [
      "1-bureau credit score",
      "Monthly credit report",
      "Dark web email scan",
      "Email identity alerts",
      "Mobile app access",
    ],
  },
  {
    id: "secure-basic",
    name: "Secure Basic",
    tagline: "Essential credit visibility",
    monthly: 8.49,
    yearly: 6.79,
    features: [
      "1-bureau credit monitoring",
      "Monthly credit score",
      "Dark web email scan",
      "$25K theft insurance",
      "Mobile app access",
    ],
  },
  {
    id: "secure-plus",
    name: "Secure Plus",
    tagline: "Smarter everyday protection",
    monthly: 11.49,
    yearly: 9.19,
    features: [
      "Everything in Basic",
      "Daily 1-bureau monitoring",
      "Full dark web surveillance",
      "SSN & alias monitoring",
      "$250K theft insurance",
    ],
  },
  {
    id: "secure-pro",
    name: "Secure Pro",
    tagline: "Complete 3-bureau coverage",
    monthly: 21.49,
    yearly: 17.19,
    popular: true,
    features: [
      "Everything in Plus",
      "Daily 3-bureau monitoring",
      "Real-time change alerts",
      "Bank & card account watch",
      "$1M theft insurance",
      "U.S.-based restoration team",
    ],
  },
];

export const DEFAULT_PLAN_ID: PlanId = "secure-pro";

export function getPlan(id: string | undefined | null): Plan {
  return PLANS.find((p) => p.id === id) ?? getPlanById(DEFAULT_PLAN_ID);
}

function getPlanById(id: PlanId): Plan {
  // PLANS always contains every PlanId, so this is non-null by construction.
  return PLANS.find((p) => p.id === id) as Plan;
}

export function normalizeCycle(value: string | undefined | null): BillingCycle {
  return value === "yearly" ? "yearly" : "monthly";
}

export function priceFor(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? plan.yearly : plan.monthly;
}

/** Amount actually charged at checkout for the chosen cycle. */
export function totalDue(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly"
    ? Number((plan.yearly * 12).toFixed(2))
    : plan.monthly;
}
