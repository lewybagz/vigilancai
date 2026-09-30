import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { DemoCardList } from "@/components/marketing/DemoCard";
import { Eyebrow, Heading, Lede, Section } from "@/components/marketing/Section";
import { Steps } from "@/components/marketing/Steps";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Vigilancai watches manufacturer, distributor, permit, and licensing pages, ranks every change by severity, and sends one plain-English briefing.",
};

const NOT_DOING = [
  {
    title: "No AI tone settings",
    body: "You can't make the briefing chattier or friendlier. It says what changed, by how much, when, and what to do. That's the whole voice.",
  },
  {
    title: "No dashboards",
    body: "There is no chart of change velocity and no scorecard. The product is the briefing and a history of what it has told you. If a number isn't on a card, we don't track it.",
  },
  {
    title: "No notification without context",
    body: "You will never get a ping that says \"a page changed.\" Every alert carries the number, the effective date, the source excerpt, and the diff, or it doesn't go out.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section width="default" className="pt-16 md:pt-24" aria-labelledby="hiw-h">
        <Eyebrow>How it works</Eyebrow>
        <Heading as="h1" size="lg" className="max-w-[760px]">
          <span id="hiw-h">Three steps, one briefing.</span>
        </Heading>
        <Lede className="mt-6 max-w-[620px]">
          The product is deliberately small: it watches the pages that move your costs, decides which changes matter,
          and tells you once a day. Here is each step in more detail.
        </Lede>
      </Section>

      <Section width="default" className="border-t border-hairline">
        <Steps expanded />
      </Section>

      <Section width="narrow" className="border-t border-hairline" aria-labelledby="hiw-example-h">
        <Eyebrow>What changed</Eyebrow>
        <Heading>
          <span id="hiw-example-h">What a morning with three changes looks like.</span>
        </Heading>
        <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-slate md:text-[17px]">
          The critical one went out yesterday afternoon the moment it cleared. The other two waited for the morning
          briefing.
        </p>
        <div className="mt-10">
          <DemoCardList />
        </div>
      </Section>

      <Section width="default" className="border-t border-hairline" aria-labelledby="not-h">
        <Eyebrow>What we don&rsquo;t do</Eyebrow>
        <Heading className="max-w-[640px]">
          <span id="not-h">A short list, on purpose.</span>
        </Heading>
        <dl className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {NOT_DOING.map((n) => (
            <div key={n.title}>
              <dt className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{n.title}</dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-slate">{n.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBand title="Ready when your sources are." body="Add the pages you already check by hand. We'll take it from tomorrow morning." />
    </>
  );
}
