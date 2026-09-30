import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/guides/Breadcrumbs";
import { FaqBlock } from "@/components/guides/FaqBlock";
import { GuideBody } from "@/components/guides/GuideBody";
import { JsonLd } from "@/components/guides/JsonLd";
import { RelatedGuidesForSpoke } from "@/components/guides/RelatedGuides";
import { UpdatedLine } from "@/components/guides/UpdatedLine";
import { getSpoke, getSpokesForPillar, resolveRedirect } from "@/lib/guides/data";
import { articleSchema, breadcrumbSchema, faqSchema, howToSchema } from "@/lib/guides/schema";
import { SITE } from "@/lib/site";
import type { HowToStep } from "@/lib/types";

export const revalidate = 3600;

type Params = Promise<{ pillar: string; spoke: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pillar: pillarSlug, spoke: spokeSlug } = await params;
  const result = await getSpoke(pillarSlug, spokeSlug);
  if (!result) return { title: "Guide not found" };
  const { pillar, spoke } = result;
  const url = `${SITE.url}/guides/${pillar.slug}/${spoke.slug}`;
  return {
    title: spoke.title,
    description: spoke.meta_description,
    alternates: { canonical: url },
    openGraph: {
      title: spoke.title,
      description: spoke.meta_description,
      url,
      type: "article",
      ...(spoke.published_at ? { publishedTime: spoke.published_at } : {}),
      modifiedTime: spoke.updated_at,
    },
  };
}

function HowToSteps({ steps }: { steps: HowToStep[] }) {
  const valid = steps.filter((s) => s?.title?.trim());
  if (valid.length === 0) return null;
  return (
    <section aria-labelledby="steps-heading" className="mt-10 border-t border-hairline pt-8">
      <h2 id="steps-heading" className="text-[24px] font-semibold tracking-tight text-ink">
        Steps
      </h2>
      <ol className="mt-4">
        {valid.map((s, i) => (
          <li
            key={s.title}
            id={`step-${i + 1}`}
            className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-hairline py-5 last:border-b-0"
          >
            <span className="font-mono text-[13px] leading-[1.7] text-fog">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-[17px] font-semibold leading-[1.4] text-ink">{s.title}</h3>
              {s.description?.trim() ? (
                <p className="mt-1.5 text-[16px] leading-[1.7] text-slate">{s.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function SpokePage({ params }: { params: Params }) {
  const { pillar: pillarSlug, spoke: spokeSlug } = await params;
  const path = `/guides/${pillarSlug}/${spokeSlug}`;
  const result = await getSpoke(pillarSlug, spokeSlug);

  if (!result) {
    const next = await resolveRedirect(path);
    if (next) permanentRedirect(next);
    notFound();
  }

  const { pillar, spoke } = result;
  const siblings = await getSpokesForPillar(pillar.id);
  const url = `${SITE.url}/guides/${pillar.slug}/${spoke.slug}`;
  const crumbs = [
    { name: "Guides", href: "/guides" },
    { name: pillar.title, href: `/guides/${pillar.slug}` },
    { name: spoke.title, href: `/guides/${pillar.slug}/${spoke.slug}` },
  ];
  const showSteps = spoke.is_how_to && Array.isArray(spoke.how_to_steps) && spoke.how_to_steps.length > 0;

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-10 sm:pt-14">
      <JsonLd
        schemas={[
          articleSchema(spoke, url),
          howToSchema(spoke, url),
          faqSchema(spoke.faq),
          breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: `${SITE.url}${c.href}` }))),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <article className="mt-6">
        <header>
          <h1 className="text-[32px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px]">
            {spoke.title}
          </h1>
          <UpdatedLine updatedAt={spoke.updated_at} className="mt-4" />
        </header>
        <div className="mt-8">
          <GuideBody markdown={spoke.body_markdown} />
        </div>
        {showSteps ? <HowToSteps steps={spoke.how_to_steps ?? []} /> : null}
        <FaqBlock faq={spoke.faq} />
        <RelatedGuidesForSpoke pillar={pillar} spoke={spoke} siblings={siblings} />
      </article>
    </main>
  );
}
