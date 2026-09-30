
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Change, Profile, Source, SourceCadence } from "@/lib/types";
import { sendCriticalAlert } from "./alerts";
import { extractChanges, type LlmChange } from "./claude";
import { reconcile } from "./classify";
import { diffText, looksLikeBoilerplate, type SourceDiff } from "./diff";
import { fetchSource } from "./fetch";
import { layaClassify, layaState, type LayaClassification } from "./laya";

const INTERVAL_MS: Record<SourceCadence, number> = {
  hourly: 55 * 60 * 1000,
  daily: 23 * 60 * 60 * 1000,
  weekly: 6.9 * 24 * 60 * 60 * 1000,
};

/** Laya-only fast path: if Laya is this sure a tiny diff is noise, skip the LLM call. */
const NOISE_CUTOFF = Number(process.env.LAYA_NOISE_CUTOFF ?? 0.15);

export interface RunResult {
  checked: number;
  changed: number;
  newChanges: number;
  alerts: number;
  errors: { source: string; error: string }[];
}

export function isDue(s: Source, now = Date.now(), force = false): boolean {
  if (s.snoozed_until && new Date(s.snoozed_until).getTime() > now) return false;
  if (force) return true;
  if (!s.last_checked_at) return true;
  return now - new Date(s.last_checked_at).getTime() >= INTERVAL_MS[s.cadence];
}

/** Cron entry: every due source across all users. */
export async function runDueSources(opts: { limit?: number; force?: boolean } = {}): Promise<RunResult> {
  const admin = createAdminClient();
  const { data } = await admin.from("sources").select("*").order("last_checked_at", { ascending: true, nullsFirst: true }).returns<Source[]>();
  const due = (data ?? []).filter((s) => isDue(s, Date.now(), opts.force)).slice(0, opts.limit ?? 40);
  return processSources(admin, due);
}

/** "Check now" from the app: this user's sources only. */
export async function runPipelineForUser(userId: string, opts: { force?: boolean } = {}): Promise<RunResult> {
  const admin = createAdminClient();
  const { data } = await admin.from("sources").select("*").eq("user_id", userId).returns<Source[]>();
  const due = (data ?? []).filter((s) => isDue(s, Date.now(), opts.force));
  return processSources(admin, due);
}

async function processSources(admin: SupabaseClient, sources: Source[]): Promise<RunResult> {
  const result: RunResult = { checked: 0, changed: 0, newChanges: 0, alerts: 0, errors: [] };
  const profiles = new Map<string, Profile>();

  for (const source of sources) {
    const { data: run } = await admin.from("pipeline_runs").insert({ source_id: source.id }).select("id").single();
    try {
      let profile = profiles.get(source.user_id);
      if (!profile) {
        const { data } = await admin.from("profiles").select("*").eq("id", source.user_id).maybeSingle<Profile>();
        if (!data) throw new Error("Owner profile missing");
        profile = data;
        profiles.set(source.user_id, data);
      }
      const r = await processSource(admin, source, profile);
      result.checked++;
      if (r.changed) result.changed++;
      result.newChanges += r.inserted;
      result.alerts += r.alerts;
      await admin.from("pipeline_runs").update({ finished_at: new Date().toISOString(), outcome: r.changed ? "changed" : "unchanged", notes: r.notes }).eq("id", run?.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push({ source: source.name, error: msg });
      await Promise.all([
        admin.from("sources").update({ status: "error", last_error: msg.slice(0, 500), last_checked_at: new Date().toISOString() }).eq("id", source.id),
        admin.from("pipeline_runs").update({ finished_at: new Date().toISOString(), outcome: "error", notes: { error: msg } }).eq("id", run?.id),
      ]);
    }
  }
  return result;
}

interface SourceOutcome {
  changed: boolean;
  inserted: number;
  alerts: number;
  notes: Record<string, unknown>;
}

async function processSource(admin: SupabaseClient, source: Source, owner: Profile): Promise<SourceOutcome> {
  const fetched = await fetchSource(source.url, source.css_selector);
  const now = new Date().toISOString();

  const { data: prev } = await admin
    .from("source_snapshots")
    .select("content_hash, content_text")
    .eq("source_id", source.id)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ content_hash: string; content_text: string }>();

  // First fetch is the baseline: nothing to compare yet.
  if (!prev) {
    await admin.from("source_snapshots").insert({ source_id: source.id, content_hash: fetched.hash, content_text: fetched.text });
    await admin.from("sources").update({ status: "ok", last_error: null, last_checked_at: now }).eq("id", source.id);
    return { changed: false, inserted: 0, alerts: 0, notes: { baseline: true, chars: fetched.text.length } };
  }

  if (prev.content_hash === fetched.hash) {
    await admin.from("sources").update({ status: "ok", last_error: null, last_checked_at: now }).eq("id", source.id);
    return { changed: false, inserted: 0, alerts: 0, notes: { unchanged: true } };
  }

  // Something changed. Store the new snapshot first so a classifier failure never re-triggers the same diff.
  await admin.from("source_snapshots").insert({ source_id: source.id, content_hash: fetched.hash, content_text: fetched.text });
  const diff = diffText(prev.content_text, fetched.text);
  const notes: Record<string, unknown> = { churn: diff.churn, added: diff.addedChars, removed: diff.removedChars };

  if (looksLikeBoilerplate(diff)) {
    await admin.from("sources").update({ status: "ok", last_error: null, last_checked_at: now }).eq("id", source.id);
    return { changed: true, inserted: 0, alerts: 0, notes: { ...notes, skipped: "boilerplate" } };
  }

  // 1) Laya reads the raw diff once: noise gate + independent classification.
  const layaOnDiff = await layaClassify(layaState({ source: source.name, kind: source.kind, hunks: diff.hunks }));
  notes.laya = layaOnDiff ? { material: layaOnDiff.material, severity: layaOnDiff.severity, conf: layaOnDiff.severityConfidence, ms: layaOnDiff.latencyMs } : "unavailable";
  if (layaOnDiff && layaOnDiff.material < NOISE_CUTOFF && layaOnDiff.materialConfidence >= 0.85 && diff.addedChars + diff.removedChars < 400) {
    await admin.from("sources").update({ status: "ok", last_error: null, last_checked_at: now, last_changed_at: now }).eq("id", source.id);
    return { changed: true, inserted: 0, alerts: 0, notes: { ...notes, skipped: "laya_noise_gate" } };
  }

  // 2) Claude extracts distinct changes and writes the cards.
  const extraction = await extractChanges({
    sourceName: source.name,
    sourceKind: source.kind,
    sourceUrl: source.url,
    hunks: diff.hunks,
    ownerTrade: owner.trade,
    ownerBusiness: owner.business_name,
    serviceArea: owner.service_area,
  });
  notes.llm = { changes: extraction.changes.length, noise_reason: extraction.noise_reason };

  let inserted = 0;
  let alerts = 0;
  for (const llm of extraction.changes) {
    // 3) Laya re-reads each extracted change on its own text (with attribution for "why we flagged this").
    const laya = layaOnDiff
      ? (await layaClassify(
          layaState({ source: source.name, kind: source.kind, hunks: `- ${llm.before_excerpt}\n+ ${llm.after_excerpt}`, summaryHint: llm.headline }),
          { attribution: true },
        )) ?? layaOnDiff
      : null;

    // 4) Reconcile: agreement publishes, disagreement holds for review.
    const r = reconcile(llm, laya, owner.trade);
    if (!r.keep) continue;

    const row = buildChangeRow(source, llm, r, laya, diff);
    const { data: saved, error } = await admin.from("changes").insert(row).select("*").single<Change>();
    if (error) throw new Error(`Insert failed: ${error.message}`);
    inserted++;

    // 5) Critical alert only when both classifiers agreed on critical.
    if (r.alertNow) {
      try {
        const sent = await sendCriticalAlert(admin, saved);
        if (sent.sent) alerts++;
      } catch (e) {
        console.error("[pipeline] alert failed", saved.id, e);
      }
    }
  }

  await admin
    .from("sources")
    .update({ status: "ok", last_error: null, last_checked_at: now, last_changed_at: inserted > 0 ? now : undefined })
    .eq("id", source.id);
  return { changed: true, inserted, alerts, notes };
}

function buildChangeRow(source: Source, llm: LlmChange, r: ReturnType<typeof reconcile>, laya: LayaClassification | null, diff: SourceDiff) {
  const isTag = !llm.number_display;
  return {
    user_id: source.user_id,
    source_id: source.id,
    source_name: source.name,
    headline: llm.headline.slice(0, 140),
    summary: llm.summary,
    category: r.category,
    severity: r.severity,
    number_display: isTag ? llm.tag?.toUpperCase() ?? null : llm.number_display,
    number_kind: isTag ? "tag" : llm.number_kind,
    effective_label: llm.effective_label,
    effective_date: llm.effective_date && /^\d{4}-\d{2}-\d{2}$/.test(llm.effective_date) ? llm.effective_date : null,
    recommended_action: llm.recommended_action.slice(0, 80),
    action_detail: llm.action_detail,
    source_excerpt: (llm.after_excerpt || diff.after).slice(0, 1200),
    diff_before: (llm.before_excerpt || diff.before).slice(0, 2000),
    diff_after: (llm.after_excerpt || diff.after).slice(0, 2000),
    status: r.status,
    trade_relevance: r.tradeRelevance,
    classification: r.meta,
    laya_result: laya ? { answers: laya.raw, attribution: laya.attribution ?? null, latency_ms: laya.latencyMs } : null,
    llm_result: llm,
    detected_at: new Date().toISOString(),
  };
}
