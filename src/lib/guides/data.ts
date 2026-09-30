import { createPublicClient } from "@/lib/supabase/public";
import type { GuidePillar, GuideSpoke } from "@/lib/types";

/**
 * Server-side read access for the public Guides hub.
 * Every function tolerates a missing Supabase env (returns empty / null)
 * so static builds and previews never throw.
 */

function hasEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function client() {
  return hasEnv() ? createPublicClient() : null;
}

const PILLAR_COLUMNS =
  "id, slug, title, primary_keyword, meta_description, body_markdown, hero_image_url, published_at, updated_at, related_pillar_ids, faq, status";

const SPOKE_COLUMNS =
  "id, pillar_id, slug, title, primary_keyword, meta_description, body_markdown, is_how_to, how_to_steps, published_at, updated_at, faq, status";

export async function getPublishedPillars(): Promise<GuidePillar[]> {
  const sb = client();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("guide_pillars")
      .select(PILLAR_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return data as unknown as GuidePillar[];
  } catch {
    return [];
  }
}

export async function getPillarBySlug(slug: string): Promise<GuidePillar | null> {
  const sb = client();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("guide_pillars")
      .select(PILLAR_COLUMNS)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return data as unknown as GuidePillar;
  } catch {
    return null;
  }
}

export async function getSpokesForPillar(pillarId: string): Promise<GuideSpoke[]> {
  const sb = client();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("guide_spokes")
      .select(SPOKE_COLUMNS)
      .eq("status", "published")
      .eq("pillar_id", pillarId)
      .order("published_at", { ascending: true });
    if (error || !data) return [];
    return data as unknown as GuideSpoke[];
  } catch {
    return [];
  }
}

export async function getSpoke(
  pillarSlug: string,
  spokeSlug: string,
): Promise<{ pillar: GuidePillar; spoke: GuideSpoke } | null> {
  const pillar = await getPillarBySlug(pillarSlug);
  if (!pillar) return null;
  const sb = client();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("guide_spokes")
      .select(SPOKE_COLUMNS)
      .eq("status", "published")
      .eq("pillar_id", pillar.id)
      .eq("slug", spokeSlug)
      .maybeSingle();
    if (error || !data) return null;
    return { pillar, spoke: data as unknown as GuideSpoke };
  } catch {
    return null;
  }
}

export async function getRelatedPillars(ids: string[]): Promise<GuidePillar[]> {
  if (!ids || ids.length === 0) return [];
  const sb = client();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("guide_pillars")
      .select(PILLAR_COLUMNS)
      .eq("status", "published")
      .in("id", ids);
    if (error || !data) return [];
    return data as unknown as GuidePillar[];
  } catch {
    return [];
  }
}

/** Looks up guide_redirects by old_path. Returns the new full path or null. */
export async function resolveRedirect(path: string): Promise<string | null> {
  const sb = client();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("guide_redirects")
      .select("new_path")
      .eq("old_path", path)
      .maybeSingle();
    if (error || !data) return null;
    const next = (data as { new_path: string }).new_path;
    // Never redirect to self; that would loop.
    return next && next !== path ? next : null;
  } catch {
    return null;
  }
}

export interface GuidePath {
  path: string;
  updated_at: string;
}

/** Every published pillar and spoke path, for the sitemap. */
export async function getAllGuidePaths(): Promise<GuidePath[]> {
  const sb = client();
  if (!sb) return [];
  try {
    const [pillarsRes, spokesRes] = await Promise.all([
      sb.from("guide_pillars").select("id, slug, updated_at").eq("status", "published"),
      sb.from("guide_spokes").select("pillar_id, slug, updated_at").eq("status", "published"),
    ]);
    const pillars = (pillarsRes.data ?? []) as { id: string; slug: string; updated_at: string }[];
    const spokes = (spokesRes.data ?? []) as { pillar_id: string; slug: string; updated_at: string }[];
    const slugById = new Map(pillars.map((p) => [p.id, p.slug]));

    const out: GuidePath[] = pillars.map((p) => ({ path: `/guides/${p.slug}`, updated_at: p.updated_at }));
    for (const s of spokes) {
      const pslug = slugById.get(s.pillar_id);
      if (!pslug) continue; // parent unpublished: skip
      out.push({ path: `/guides/${pslug}/${s.slug}`, updated_at: s.updated_at });
    }
    return out;
  } catch {
    return [];
  }
}
