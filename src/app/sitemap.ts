import type { MetadataRoute } from "next";
import { getAllGuidePaths } from "@/lib/guides/data";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/how-it-works", priority: 0.8 },
  { path: "/pricing", priority: 0.8 },
  { path: "/about", priority: 0.5 },
  { path: "/guides", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    changeFrequency: "weekly",
    priority: r.priority,
  }));

  try {
    const guides = await getAllGuidePaths();
    for (const g of guides) {
      const lastModified = new Date(g.updated_at);
      entries.push({
        url: `${base}${g.path}`,
        lastModified: Number.isNaN(lastModified.getTime()) ? undefined : lastModified,
        changeFrequency: "monthly",
        priority: g.path.split("/").length > 3 ? 0.6 : 0.7,
      });
    }
  } catch {
    // Missing env or unreachable database: static routes only.
  }

  return entries;
}
