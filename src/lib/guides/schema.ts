import { SITE } from "@/lib/site";
import type { FaqItem, GuidePillar, GuideSpoke } from "@/lib/types";

/**
 * JSON-LD builders for guide pages.
 * Rule: never emit an empty or placeholder value. Omit the field, or return null
 * when the whole block would be empty.
 */

export type JsonLdObject = Record<string, unknown>;

const AUTHOR = { "@type": "Organization", name: SITE.name } as const;

function nonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Drops keys whose values are empty strings, null, undefined or empty arrays. */
function compact(obj: JsonLdObject): JsonLdObject {
  const out: JsonLdObject = {};
  for (const [k, v] of Object.entries(obj)) {
    if (nonEmpty(v)) out[k] = v;
  }
  return out;
}

export function articleSchema(doc: GuidePillar | GuideSpoke, url: string): JsonLdObject | null {
  if (!nonEmpty(doc.title) || !nonEmpty(url)) return null;
  const heroImage = "hero_image_url" in doc ? doc.hero_image_url : null;
  return compact({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.title,
    description: doc.meta_description,
    keywords: doc.primary_keyword,
    image: heroImage ?? undefined,
    datePublished: doc.published_at ?? undefined,
    dateModified: doc.updated_at ?? undefined,
    author: AUTHOR,
    publisher: AUTHOR,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  });
}

export function faqSchema(faq: FaqItem[] | null | undefined): JsonLdObject | null {
  const items = (faq ?? []).filter((f) => nonEmpty(f?.question) && nonEmpty(f?.answer));
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function howToSchema(spoke: GuideSpoke, url: string): JsonLdObject | null {
  if (!spoke.is_how_to) return null;
  const steps = (spoke.how_to_steps ?? []).filter((s) => nonEmpty(s?.title));
  if (steps.length === 0) return null;
  return compact({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: spoke.title,
    description: spoke.meta_description,
    datePublished: spoke.published_at ?? undefined,
    dateModified: spoke.updated_at ?? undefined,
    mainEntityOfPage: nonEmpty(url) ? { "@type": "WebPage", "@id": url } : undefined,
    step: steps.map((s, i) =>
      compact({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.description,
        url: nonEmpty(url) ? `${url}#step-${i + 1}` : undefined,
      }),
    ),
  });
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject | null {
  const valid = (items ?? []).filter((i) => nonEmpty(i?.name) && nonEmpty(i?.url));
  if (valid.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: valid.map((i, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: i.name,
      item: i.url,
    })),
  };
}
