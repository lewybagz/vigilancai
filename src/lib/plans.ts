import type { PlanTier } from "./types";

export interface Plan {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  blurb: string;
  features: string[];
  maxSources: number;
  maxRecipients: number;
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    priceMonthly: 49,
    blurb: "One crew, one service area.",
    features: [
      "Up to 6 watched sources",
      "Weekly or daily briefing",
      "Critical alerts to you and 2 crew emails",
      "History and weekly summary",
    ],
    maxSources: 6,
    maxRecipients: 2,
  },
  {
    tier: "pro",
    name: "Pro",
    priceMonthly: 149,
    blurb: "Multiple jurisdictions and suppliers.",
    features: [
      "Up to 25 watched sources",
      "Per-source cadence (hourly, daily, weekly)",
      "Critical alerts to unlimited crew emails",
      "Trade-specific recommended actions",
      "Priority source requests",
    ],
    maxSources: 25,
    maxRecipients: 100,
    highlighted: true,
  },
];

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function getPlanLimits(plan: PlanTier | null, status: string) {
  if (plan && ACTIVE.has(status)) {
    const p = PLANS.find((x) => x.tier === plan)!;
    return { maxSources: p.maxSources, maxRecipients: p.maxRecipients, plan: p };
  }
  // No subscription: a small free allowance so the product is usable before checkout.
  return { maxSources: 3, maxRecipients: 1, plan: null };
}
