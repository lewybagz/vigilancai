"use client";

import { useTransition } from "react";
import { PLANS } from "@/lib/plans";
import type { PlanTier, Subscription } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/time";

export function BillingCard({ subscription }: { subscription: Subscription | null }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const active = subscription?.plan && ["active", "trialing", "past_due"].includes(subscription.status);
  const plan = active ? PLANS.find((p) => p.tier === subscription!.plan) : null;

  async function go(path: string, body?: unknown) {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json();
    if (!res.ok || !json.url) throw new Error(json.error ?? "Stripe is not configured yet");
    window.location.href = json.url;
  }

  function checkout(tier: PlanTier) {
    start(async () => {
      try {
        await go("/api/stripe/checkout", { tier });
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not start checkout");
      }
    });
  }

  function portal() {
    start(async () => {
      try {
        await go("/api/stripe/portal");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not open billing");
      }
    });
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5">
      {plan ? (
        <>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[15px] font-semibold text-ink">{plan.name}</div>
              <div className="text-[13px] text-slate">${plan.priceMonthly}/month</div>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wide text-fog">{subscription!.status}</span>
          </div>
          {subscription!.current_period_end && (
            <p className="mt-2 text-[13px] text-fog">
              {subscription!.cancel_at_period_end ? "Ends" : "Renews"} {formatDate(subscription!.current_period_end)}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" disabled={pending} onClick={portal}>
              Manage billing
            </Button>
            {plan.tier === "starter" && (
              <Button size="sm" disabled={pending} onClick={() => checkout("pro")}>
                Upgrade to Pro
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="text-[15px] font-semibold text-ink">No plan yet</div>
          <p className="mt-1 text-[13px] text-slate">You can watch up to 3 sources for free. Pick a plan to watch more and add crew recipients.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PLANS.map((p) => (
              <Button key={p.tier} size="sm" variant={p.highlighted ? "primary" : "secondary"} disabled={pending} onClick={() => checkout(p.tier)}>
                {p.name} · ${p.priceMonthly}/mo
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
