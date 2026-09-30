import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { BriefingMockup } from "@/components/marketing/BriefingMockup";
import { CtaBand } from "@/components/marketing/CtaBand";
import { DemoCardList } from "@/components/marketing/DemoCard";
import { Eyebrow, Heading, Lede, Section } from "@/components/marketing/Section";
import { Steps } from "@/components/marketing/Steps";
import { PLANS } from "@/lib/plans";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — Know what changed before it's on your next bid` },
  description: SITE.tagline,
};

const fromPrice = Math.min(...PLANS.map((p) => p.priceMonthly));

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <Section width="wide" className="pt-16 md:pt-24" aria-labelledby="hero-h">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Heading as="h1" size="lg" className="max-w-[640px]">
              <span id="hero-h">Know what changed before it&rsquo;s on your next bid.</span>
            </Heading>
            <Lede className="mt-6 max-w-[540px]">
              For roofing, HVAC, and GC crews who can&rsquo;t afford to find out about a price hike from a customer.
            </Lede>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Get started
              </ButtonLink>
              <ButtonLink href="/how-it-works" variant="secondary" size="lg">
                See how it works
              </ButtonLink>
            </div>
            <p className="mt-5 font-mono text-[12px] text-fog">Sources checked overnight. One briefing each morning.</p>
          </div>
          <div className="lg:justify-self-end">
            <BriefingMockup />
          </div>
        </div>
      </Section>

      {/* 2. Proof, pre-launch honest */}
      <Section tight width="narrow" className="border-t border-hairline" aria-labelledby="proof-h">
        <h2 id="proof-h" className="text-[17px] font-medium leading-relaxed text-ink md:text-[19px]">
          Built by a developer running service businesses in {SITE.founder.city}.
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate md:text-[16px]">
          {SITE.founder.name} runs {SITE.founder.businesses[0]}, a residential bin service, and builds{" "}
          {SITE.founder.businesses[1]}, software for trade businesses. {SITE.name} is the tool he wished those
          contractors already had.
        </p>
      </Section>

      {/* 3. What changed example */}
      <Section width="narrow" className="border-t border-hairline" aria-labelledby="example-h">
        <Eyebrow>What a briefing looks like</Eyebrow>
        <Heading>
          <span id="example-h">Three things changed. Here is what to do about each.</span>
        </Heading>
        <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-slate md:text-[17px]">
          Every card is one change from one source: the number, when it takes effect, and the action. Ranked by
          severity, never grouped by date.
        </p>
        <div className="mt-10">
          <DemoCardList />
        </div>
      </Section>

      {/* 4. How it works */}
      <Section width="wide" className="border-t border-hairline" aria-labelledby="how-h">
        <Eyebrow>How it works</Eyebrow>
        <Heading className="max-w-[640px]">
          <span id="how-h">Watch the sources. Rank the changes. Send one briefing.</span>
        </Heading>
        <div className="mt-12 md:mt-16">
          <Steps />
        </div>
        <div className="mt-10">
          <Link href="/how-it-works" className="text-[15px] font-medium text-accent underline underline-offset-4">
            Read the full walkthrough
          </Link>
        </div>
      </Section>

      {/* 5. Pricing teaser */}
      <Section tight width="narrow" className="border-t border-hairline" aria-labelledby="pricing-h">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="pricing-h" className="text-[22px] font-semibold tracking-[-0.01em] text-ink md:text-[24px]">
              From ${fromPrice}/month
            </h2>
            <p className="mt-1.5 text-[15px] text-slate md:text-[16px]">
              One crew and one service area on Starter; more jurisdictions and suppliers on Pro. Cancel anytime.
            </p>
          </div>
          <ButtonLink href="/pricing" variant="secondary" className="shrink-0">
            See pricing
          </ButtonLink>
        </div>
      </Section>

      {/* 6. Founder */}
      <Section width="narrow" className="border-t border-hairline" aria-labelledby="founder-h">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <div
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] bg-surface text-[26px] font-semibold text-ink"
            style={{ border: "1px solid var(--hairline)" }}
          >
            {SITE.founder.name[0]}
          </div>
          <div>
            <h2 id="founder-h" className="sr-only">
              From the founder
            </h2>
            <p className="text-[19px] leading-relaxed text-ink md:text-[22px]">
              &ldquo;I&rsquo;m {SITE.founder.name} — I run {SITE.founder.businesses[0]} and build software for trade
              businesses in {SITE.founder.city}. I built this because I watched contractors get blindsided by price
              changes they had no way of seeing coming.&rdquo;
            </p>
            <p className="mt-4 font-mono text-[12px] text-fog">
              {SITE.founder.name}, founder ·{" "}
              <Link href="/about" className="underline underline-offset-4 hover:text-ink">
                More about why this exists
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* 7. Final CTA */}
      <CtaBand />
    </>
  );
}
