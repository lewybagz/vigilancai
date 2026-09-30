import Link from "next/link";
import type { GuidePillar, GuideSpoke } from "@/lib/types";

interface RelatedLink {
  href: string;
  title: string;
  description?: string;
  label?: string;
}

function Row({ item }: { item: RelatedLink }) {
  return (
    <li className="border-b border-hairline py-4 last:border-b-0">
      {item.label ? (
        <div className="mb-1 font-mono text-[12px] uppercase tracking-[0.06em] text-fog">{item.label}</div>
      ) : null}
      <Link href={item.href} className="text-[17px] font-medium text-ink underline-offset-4 hover:underline">
        {item.title}
      </Link>
      {item.description ? <p className="mt-1 text-[15px] leading-[1.6] text-slate">{item.description}</p> : null}
    </li>
  );
}

function List({ items }: { items: RelatedLink[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="related-heading" className="mt-12 border-t border-hairline pt-8">
      <h2 id="related-heading" className="text-[24px] font-semibold tracking-tight text-ink">
        Related guides
      </h2>
      <ul className="mt-2">
        {items.map((item) => (
          <Row key={item.href} item={item} />
        ))}
      </ul>
    </section>
  );
}

/** Pillar page: its spokes, then related pillars. */
export function RelatedGuidesForPillar({
  pillar,
  spokes,
  relatedPillars,
}: {
  pillar: GuidePillar;
  spokes: GuideSpoke[];
  relatedPillars: GuidePillar[];
}) {
  const items: RelatedLink[] = [
    ...spokes.map((s) => ({
      href: `/guides/${pillar.slug}/${s.slug}`,
      title: s.title,
      description: s.meta_description,
      label: "In this guide",
    })),
    ...relatedPillars
      .filter((p) => p.id !== pillar.id)
      .map((p) => ({
        href: `/guides/${p.slug}`,
        title: p.title,
        description: p.meta_description,
        label: "Related guide",
      })),
  ];
  return <List items={items} />;
}

/** Spoke page: link up to the pillar, then sibling spokes. */
export function RelatedGuidesForSpoke({
  pillar,
  spoke,
  siblings,
}: {
  pillar: GuidePillar;
  spoke: GuideSpoke;
  siblings: GuideSpoke[];
}) {
  const items: RelatedLink[] = [
    {
      href: `/guides/${pillar.slug}`,
      title: pillar.title,
      description: pillar.meta_description,
      label: "Parent guide",
    },
    ...siblings
      .filter((s) => s.id !== spoke.id)
      .map((s) => ({
        href: `/guides/${pillar.slug}/${s.slug}`,
        title: s.title,
        description: s.meta_description,
        label: "Also in this guide",
      })),
  ];
  return <List items={items} />;
}
