import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/marketing/CtaBand";
import { Eyebrow, Heading, Lede, Section } from "@/components/marketing/Section";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Two plans, one job: Starter for one crew and one service area, Pro for multiple jurisdictions and suppliers.",
};

const FAQ = [
  {
    q: "What counts as a source?",
    a: "One page we check: a supplier's price sheet, a manufacturer's bulletin page, a county or city permit fee schedule, a licensing board's notices. Each source is fetched on its own schedule and diffed against its last known version. A supplier with three relevant pages is three sources.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, from Settings, at any time. Your briefings stop at the end of the billing period and your history stays readable. There is no minimum term and no call to cancel.",
  },
  {
    q: "What happens when the classifiers disagree?",
    a: "Every change is read twice: by a fast decision model and by Claude, independently. If they land on different severities, the change is held for review instead of sent. You see it in the app marked \"Needs review\" with both opinions and the signals behind them, and you decide whether it goes out.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Section width="default" className="pt-16 md:pt-24" aria-labelledby="pricing-h">
        <Eyebrow>Pricing</Eyebrow>
        <Heading as="h1" size="lg" className="max-w-[700px]">
          <span id="pricing-h">Priced like a tool, not a seat.</span>
        </Heading>
        <Lede className="mt-6 max-w-[560px]">
          One flat monthly price per business. Crew emails on critical alerts are included on both plans.
        </Lede>
      </Section>

      <Section width="default" className="pt-0 md:pt-0">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {PLANS.map((plan) => {
            const hl = Boolean(plan.highlighted);
            return (
              <article
                key={plan.tier}
                aria-labelledby={`plan-${plan.tier}`}
                className={`flex flex-col rounded-[var(--radius-card)] border bg-surface p-6 md:p-8 ${
                  hl ? "border-accent" : "border-hairline"
                }`}
                style={hl ? { boxShadow: "0 0 0 1px var(--accent)" } : undefined}
              >
                <div className="flex items-center justify-between">
                  <h2 id={`plan-${plan.tier}`} className="text-[20px] font-semibold text-ink">
                    {plan.name}
                  </h2>
                  {hl && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">Most crews</span>
                  )}
                </div>
                <p className="mt-1 text-[14px] text-slate">{plan.blurb}</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[40px] font-semibold leading-none tracking-[-0.02em] text-ink">
                    ${plan.priceMonthly}
                  </span>
                  <span className="font-mono text-[12px] text-fog">/ month</span>
                </div>
                <ul className="mt-8 space-y-3 text-[15px] text-ink">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border-t border-hairline pt-6 font-mono text-[12px] text-fog">
                  {plan.maxSources} sources · {plan.maxRecipients >= 100 ? "unlimited" : plan.maxRecipients} crew emails
                </div>
                <div className="mt-6">
                  <ButtonLink href="/signup" variant={hl ? "primary" : "secondary"} className="w-full" size="lg">
                    Get started
                  </ButtonLink>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-[14px] text-slate">
          Before you subscribe, every account can watch 3 sources with 1 recipient, free, so the first briefing is real.
        </p>
      </Section>

      <Section width="narrow" className="border-t border-hairline" aria-labelledby="faq-h">
        <Eyebrow>Questions</Eyebrow>
        <Heading size="sm">
          <span id="faq-h">The three we get most.</span>
        </Heading>
        <dl className="mt-10 divide-y divide-hairline">
          {FAQ.map((item) => (
            <div key={item.q} className="py-7 first:pt-0 last:pb-0">
              <dt className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{item.q}</dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-slate md:text-[16px]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBand />
    </>
  );
}
