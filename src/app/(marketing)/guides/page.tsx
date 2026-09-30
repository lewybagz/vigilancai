import type { Metadata } from "next";
import Link from "next/link";
import { UpdatedLine } from "@/components/guides/UpdatedLine";
import { getPublishedPillars, getSpokesForPillar } from "@/lib/guides/data";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const DESCRIPTION =
  "Plain-language guides for roofing, HVAC and general contractors on permit fee changes, material price increases and licensing rule changes, and how to keep them from eating your bids.";

export const metadata: Metadata = {
  title: "Guides",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/guides` },
  openGraph: {
    title: `Guides · ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/guides`,
    type: "website",
  },
};

export default async function GuidesHubPage() {
  const pillars = await getPublishedPillars();
  const spokeCounts = await Promise.all(
    pillars.map(async (p) => (await getSpokesForPillar(p.id)).length),
  );

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-12 sm:pt-16">
      <h1 className="text-[32px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px]">
        Guides
      </h1>
      <p className="mt-4 text-[17px] leading-[1.7] text-slate">
        These guides explain the three things that quietly change a contractor&rsquo;s numbers between
        the estimate and the invoice: permit and plan-review fees set by cities and counties, material
        prices set by manufacturers and distributors, and licensing rules set by state boards. Each one
        is written for roofing, HVAC and general contractors who want to know what moves, how often,
        where the notice is posted, and what to change in a bid before the cost lands.
      </p>

      {pillars.length === 0 ? (
        <p className="mt-12 border-t border-hairline pt-8 text-[15px] text-fog">
          No guides are published yet. Check back soon.
        </p>
      ) : (
        <ul className="mt-12 border-t border-hairline">
          {pillars.map((p, i) => (
            <li key={p.id} className="border-b border-hairline py-7">
              <Link
                href={`/guides/${p.slug}`}
                className="text-[22px] font-semibold leading-[1.3] tracking-tight text-ink underline-offset-4 hover:underline"
              >
                {p.title}
              </Link>
              <p className="mt-2 text-[16px] leading-[1.65] text-slate">{p.meta_description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <UpdatedLine updatedAt={p.updated_at} />
                <span className="font-mono text-[13px] text-fog">
                  {spokeCounts[i]} {spokeCounts[i] === 1 ? "article" : "articles"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
