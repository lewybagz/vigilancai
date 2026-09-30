import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/guides/Breadcrumbs";
import { FaqBlock } from "@/components/guides/FaqBlock";
import { GuideBody } from "@/components/guides/GuideBody";
import { JsonLd } from "@/components/guides/JsonLd";
import { RelatedGuidesForPillar } from "@/components/guides/RelatedGuides";
import { UpdatedLine } from "@/components/guides/UpdatedLine";
import {
  getPillarBySlug,
  getRelatedPillars,
  getSpokesForPillar,
  resolveRedirect,
} from "@/lib/guides/data";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/guides/schema";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

type Params = Promise<{ pillar: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pillar: slug } = await params;
  const pillar = await getPillarBySlug(slug);
  if (!pillar) return { title: "Guide not found" };
  const url = `${SITE.url}/guides/${pillar.slug}`;
  return {
    title: pillar.title,
    description: pillar.meta_description,
    alternates: { canonical: url },
    openGraph: {
      title: pillar.title,
      description: pillar.meta_description,
      url,
      type: "article",
      ...(pillar.published_at ? { publishedTime: pillar.published_at } : {}),
      modifiedTime: pillar.updated_at,
      ...(pillar.hero_image_url ? { images: [{ url: pillar.hero_image_url }] } : {}),
    },
  };
}

export default async function PillarPage({ params }: { params: Params }) {
  const { pillar: slug } = await params;
  const path = `/guides/${slug}`;
  const pillar = await getPillarBySlug(slug);

  if (!pillar) {
    const next = await resolveRedirect(path);
    if (next) permanentRedirect(next);
    notFound();
  }

  const [spokes, relatedPillars] = await Promise.all([
    getSpokesForPillar(pillar.id),
    getRelatedPillars(pillar.related_pillar_ids ?? []),
  ]);

  const url = `${SITE.url}/guides/${pillar.slug}`;
  const crumbs = [
    { name: "Guides", href: "/guides" },
    { name: pillar.title, href: `/guides/${pillar.slug}` },
  ];

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-10 sm:pt-14">
      <JsonLd
        schemas={[
          articleSchema(pillar, url),
          faqSchema(pillar.faq),
          breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: `${SITE.url}${c.href}` }))),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <article className="mt-6">
        <header>
          <h1 className="text-[32px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px]">
            {pillar.title}
          </h1>
          <UpdatedLine updatedAt={pillar.updated_at} className="mt-4" />
        </header>
        <div className="mt-8">
          <GuideBody markdown={pillar.body_markdown} />
        </div>
        <FaqBlock faq={pillar.faq} />
        <RelatedGuidesForPillar pillar={pillar} spokes={spokes} relatedPillars={relatedPillars} />
      </article>
    </main>
  );
}
