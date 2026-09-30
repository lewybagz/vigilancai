import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/CtaBand";
import { Eyebrow, Heading, Section } from "@/components/marketing/Section";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${SITE.name} exists: built in ${SITE.founder.city} by a developer who runs service businesses and watched contractors get blindsided by price changes.`,
};

export default function AboutPage() {
  const { founder } = SITE;
  return (
    <>
      <Section width="narrow" className="pt-16 md:pt-24" aria-labelledby="about-h">
        <Eyebrow>About</Eyebrow>
        <Heading as="h1" size="lg">
          <span id="about-h">Why this exists.</span>
        </Heading>

        <div className="mt-10 flex items-center gap-4">
          <div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-surface text-[22px] font-semibold text-ink"
            style={{ border: "1px solid var(--hairline)" }}
          >
            {founder.name[0]}
          </div>
          <div>
            <div className="text-[15px] font-medium text-ink">{founder.name}</div>
            <div className="font-mono text-[12px] text-fog">Founder · {founder.city}, Arizona</div>
          </div>
        </div>

        <div className="mt-10 space-y-6 text-[17px] leading-[1.7] text-ink md:text-[19px]">
          <p>
            I&rsquo;m {founder.name}. I live in {founder.city}, where I run {founder.businesses[0]}, a residential bin
            service, and build {founder.businesses[1]}, software for the trade businesses around me. Running one
            business and writing code for a dozen others means I spend most of my week close to people who bid work
            for a living.
          </p>
          <p>
            The thing I kept seeing was the same story with different names on it. A roofer quotes a job in June on a
            shingle price that moved in May. A GC pulls a permit and finds the fee schedule changed on the first of the
            month. An HVAC crew hears about a licensing rule change from a customer who read it on the county site.
            None of it was secret. It was all published somewhere. Nobody had time to go look.
          </p>
          <p>
            {SITE.name} is the tool I wanted to hand those people. It watches the pages that move your costs and your
            paperwork, it decides which changes actually matter for your trade, and it tells you once, in plain
            English, with the number and the date and what to do. When nothing changed, it says so in one line.
          </p>
          <p>
            It will never be a dashboard, a feed, or a place you have to go check. It will never send you a
            notification that doesn&rsquo;t carry its own context. And it will never pretend that a small change is a
            big one to look busy. A calm instrument that&rsquo;s right most mornings is worth more than a loud one that
            is right all the time about things that don&rsquo;t matter.
          </p>
        </div>

        <p className="mt-10 font-mono text-[12px] text-fog">
          Questions, sources you want watched, or something we got wrong:{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4 hover:text-ink">
            {SITE.contactEmail}
          </a>
        </p>
      </Section>

      <CtaBand title="Try it on your own sources." body="Three sources are free before you pick a plan. The first briefing is real." />
    </>
  );
}
