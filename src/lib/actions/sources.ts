"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { runPipelineForUser } from "@/lib/pipeline/run";
import { getPlanLimits } from "@/lib/plans";
import type { SourceCadence, SourceKind } from "@/lib/types";

function revalidate() {
  revalidatePath("/app");
  revalidatePath("/app/sources");
  revalidatePath("/app/history");
}

export async function snoozeSource(sourceId: string, days: number) {
  const { supabase, user } = await requireUser();
  const until = new Date(Date.now() + days * 86400000).toISOString();
  const { error } = await supabase
    .from("sources")
    .update({ snoozed_until: until })
    .eq("id", sourceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidate();
  return until;
}

/** Snooze by source name, for cards that only carry the source label. */
export async function snoozeSourceByName(sourceName: string, days: number) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("sources")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", sourceName)
    .maybeSingle();
  if (!data) throw new Error(`No source named ${sourceName}`);
  return snoozeSource(data.id, days);
}

export async function unsnoozeSource(sourceId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("sources")
    .update({ snoozed_until: null })
    .eq("id", sourceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidate();
}

export async function setSourceCadence(sourceId: string, cadence: SourceCadence) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("sources")
    .update({ cadence })
    .eq("id", sourceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidate();
}

export async function addSource(input: { name: string; kind: SourceKind; url: string; cadence: SourceCadence }) {
  const { supabase, user } = await requireUser();
  const name = input.name.trim();
  const url = input.url.trim();
  if (!name || !url) throw new Error("Name and URL are required");
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error();
  } catch {
    throw new Error("Enter a full http(s) URL");
  }

  const [{ count }, { data: sub }] = await Promise.all([
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle(),
  ]);
  const limits = getPlanLimits(sub?.plan ?? null, sub?.status ?? "none");
  if ((count ?? 0) >= limits.maxSources) {
    throw new Error(`Your plan watches up to ${limits.maxSources} sources. Upgrade in Settings to add more.`);
  }

  const { error } = await supabase
    .from("sources")
    .insert({ user_id: user.id, name, kind: input.kind, url, cadence: input.cadence });
  if (error) throw new Error(error.message);
  revalidate();
}

export async function removeSource(sourceId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("sources").delete().eq("id", sourceId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidate();
}

/** "Sync now": run the pipeline for every due (or forced) source this user owns. */
export async function syncNow(force = false) {
  const { user } = await requireUser();
  const result = await runPipelineForUser(user.id, { force });
  revalidate();
  return result;
}
