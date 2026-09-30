/**
 * Seed a demo account with sources, changes, settings, recipients, and the guide content.
 *
 *   npm run seed
 *
 * Reads .env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Optional:
 *   SEED_EMAIL (default demo@vigilancai.local), SEED_PASSWORD (default vigilancai-demo)
 * Safe to re-run: it wipes and re-creates the demo user's data and upserts guides by slug.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const EMAIL = process.env.SEED_EMAIL ?? "demo@vigilancai.local";
const PASSWORD = process.env.SEED_PASSWORD ?? "vigilancai-demo";

const h = (n: number) => new Date(Date.now() - n * 3600_000).toISOString();
const d = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

async function ensureUser(): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: "Lewis" },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const userId = await ensureUser();
  console.log(`Demo user ${EMAIL} (${userId})`);

  // Wipe the demo user's rows (cascades to snapshots and runs).
  await admin.from("changes").delete().eq("user_id", userId);
  await admin.from("sources").delete().eq("user_id", userId);
  await admin.from("alert_recipients").delete().eq("user_id", userId);

  await admin.from("profiles").upsert({
    id: userId,
    email: EMAIL,
    first_name: "Lewis",
    business_name: "Sonoran Roofing Co.",
    trade: "roofing",
    service_area: "Tucson, AZ",
  });
  await admin.from("user_settings").upsert({
    user_id: userId,
    cadence: "daily",
    delivery_time: "06:30",
    timezone: "America/Phoenix",
    threshold: "critical_high",
    in_app_history_sync: true,
  });
  await admin.from("subscriptions").upsert({ user_id: userId, plan: "pro", status: "active", current_period_end: d(-23) });
  await admin.from("alert_recipients").insert([
    { user_id: userId, email: "office@sonoranroofing.example", name: "Maria (office)" },
    { user_id: userId, email: "foreman@sonoranroofing.example", name: "Dave (foreman)" },
  ]);

  // Sources. URLs are real public pages; verify the exact fee-schedule paths for your jurisdictions.
  const sources = [
    { name: "Tucson", kind: "jurisdiction", url: "https://www.tucsonaz.gov/Departments/Planning-Development-Services", cadence: "daily", last_checked_at: h(2), last_changed_at: h(2) },
    { name: "Pima County", kind: "jurisdiction", url: "https://www.pima.gov/163/Development-Services", cadence: "daily", last_checked_at: h(2), last_changed_at: d(2) },
    { name: "Arizona ROC", kind: "licensing", url: "https://roc.az.gov/", cadence: "weekly", last_checked_at: h(20), last_changed_at: h(20) },
    { name: "ABC Supply", kind: "supplier", url: "https://www.abcsupply.com/", cadence: "hourly", last_checked_at: h(1), last_changed_at: h(5) },
    { name: "GAF", kind: "manufacturer", url: "https://www.gaf.com/en-us/for-professionals", cadence: "daily", last_checked_at: h(8), last_changed_at: h(8) },
    { name: "Tucson Electric Power", kind: "code", url: "https://www.tep.com/rebates/", cadence: "weekly", last_checked_at: d(1), last_changed_at: d(3) },
    { name: "Owens Corning", kind: "manufacturer", url: "https://www.owenscorning.com/en-us/roofing", cadence: "daily", last_checked_at: d(9), snoozed_until: d(-12) },
  ].map((s) => ({ ...s, user_id: userId, status: "ok" as const }));
  const { data: srcRows, error: srcErr } = await admin.from("sources").insert(sources).select("id, name");
  if (srcErr) throw srcErr;
  const sid = (name: string) => srcRows!.find((s) => s.name === name)!.id;

  const agreed = (sev: string, conf: number, reason: string) => ({
    method: "laya_llm",
    agreed: true,
    laya_confidence: conf,
    laya_severity: sev,
    llm_severity: sev,
    reasons: [reason],
  });

  const changes = [
    {
      source: "Tucson", severity: "critical", category: "permit_fee", status: "published", detected_at: h(2), alert_sent_at: h(2),
      headline: "Residential reroof permit fee increased", number_display: "+$55", number_kind: "dollar",
      effective_label: "Effective Aug 1", effective_date: "2026-08-01",
      summary: "The flat residential reroof permit rose from $195 to $250. It applies to any permit pulled on or after the effective date, including jobs already quoted.",
      recommended_action: "Update pending estimates",
      action_detail: "Any reroof estimate that has not pulled its permit yet is $55 short. Re-issue open estimates today and add a line item for the new fee on templates going forward.",
      diff_before: "Residential Reroof (flat fee) ........ $195.00", diff_after: "Residential Reroof (flat fee) ........ $250.00",
      source_excerpt: "Residential Reroof (flat fee) ........ $250.00\nEffective August 1. Fees are due at permit issuance.",
      classification: { ...agreed("critical", 0.91, "Applies to work already quoted; permit is pulled after the estimate is signed."), attribution: [{ label: "change", support: 0.42 }, { label: "source", support: 0.11 }] },
      trade_relevance: { roofing: 0.98, hvac: 0.2, gc: 0.7 },
    },
    {
      source: "ABC Supply", severity: "high", category: "material_price", status: "published", detected_at: h(5),
      headline: "Owens Corning Duration shingles up 8.2% per square", number_display: "+8.2%", number_kind: "percent",
      effective_label: "Effective Sep 15", effective_date: "2026-09-15",
      summary: "Branch price list moved Duration architectural shingles from $118.40 to $128.10 per square. Underlayment and ridge cap were not changed.",
      recommended_action: "Re-quote open bids before Friday",
      action_detail: "Bids that priced Duration at the old number lose roughly $10 a square. Re-quote anything unsigned, and lock material on signed jobs by placing the order this week.",
      diff_before: "Duration® Architectural Shingle, per sq ...... $118.40", diff_after: "Duration® Architectural Shingle, per sq ...... $128.10",
      classification: agreed("high", 0.84, "Affects open bids; signed jobs can still lock pricing."),
      trade_relevance: { roofing: 0.97, hvac: 0.05, gc: 0.55 },
    },
    {
      source: "Arizona ROC", severity: "medium", category: "licensing", status: "published", detected_at: h(20),
      headline: "New continuing-education requirement proposed for license renewal", number_display: "NEW BULLETIN", number_kind: "tag",
      effective_label: "Comment period ends Oct 30", effective_date: "2026-10-30",
      summary: "The Registrar posted a proposed rule requiring four hours of continuing education per renewal cycle for residential license holders. It is a proposal, not yet a rule.",
      recommended_action: "Note for next renewal cycle",
      action_detail: "Nothing to do this week. If you want a say, comments are open until Oct 30. We will flag it again if it is adopted.",
      diff_after: "Notice of Proposed Rulemaking: Continuing education for residential contractors (4 hours per renewal cycle). Public comment through October 30.",
      classification: agreed("medium", 0.77, "Informational; deadline is a comment period, not a compliance date."),
      trade_relevance: { roofing: 0.8, hvac: 0.8, gc: 0.85 },
    },
    {
      source: "GAF", severity: "high", category: "material_price", status: "needs_review", detected_at: h(8),
      headline: "Timberline HDZ price adjustment notice posted", number_display: "+6%", number_kind: "percent",
      effective_label: "Effective Nov 1", effective_date: "2026-11-01",
      summary: "A dealer notice announces a price adjustment of up to 6% on Timberline HDZ and related accessories. Distributor pass-through timing varies.",
      recommended_action: "Confirm pass-through with your branch",
      action_detail: "Manufacturer notices land at distributors on different dates. Ask ABC Supply when their Timberline pricing changes, then decide whether to pre-buy for jobs starting in November.",
      diff_after: "Pricing Update: Effective November 1, GAF will implement a price increase of up to 6% on Timberline® HDZ® shingles and select accessories.",
      classification: {
        method: "laya_llm", agreed: false, laya_confidence: 0.58, laya_severity: "medium", llm_severity: "high",
        reasons: ["Laya scored this medium (58% confidence); Claude said high.", "More than 30 days notice, but it affects bids for November starts."],
      },
      trade_relevance: { roofing: 0.95, hvac: 0.05, gc: 0.5 },
    },
    {
      source: "Pima County", severity: "medium", category: "permit_fee", status: "handled", detected_at: d(2), handled_at: d(1),
      headline: "Plan review turnaround extended to 10 business days", number_display: "10 days", number_kind: "date",
      effective_label: "Was 7 business days", effective_date: null,
      summary: "Development Services updated the posted target for residential plan review from 7 to 10 business days, citing staffing.",
      recommended_action: "Pad schedules for county jobs",
      action_detail: "Add three business days to any county job timeline that has not been submitted yet, and tell customers before they ask.",
      diff_before: "Residential plan review target: 7 business days", diff_after: "Residential plan review target: 10 business days",
      classification: agreed("medium", 0.81, "Schedule impact only; no cost change."),
      trade_relevance: { roofing: 0.7, hvac: 0.6, gc: 0.9 },
    },
    {
      source: "Tucson Electric Power", severity: "medium", category: "other", status: "published", detected_at: d(3),
      headline: "Heat pump rebate for 16+ SEER2 systems reduced", number_display: "-$200", number_kind: "dollar",
      effective_label: "Effective Oct 1", effective_date: "2026-10-01",
      summary: "The residential heat pump rebate for qualifying 16+ SEER2 systems drops from $800 to $600 for installations completed after Oct 1.",
      recommended_action: "Tell HVAC partners on shared jobs",
      action_detail: "If you sub or partner on reroof-plus-HVAC jobs, the customer's rebate math changes. Roofing-only work is unaffected.",
      diff_before: "16+ SEER2 heat pump rebate: $800", diff_after: "16+ SEER2 heat pump rebate: $600",
      classification: agreed("medium", 0.72, "Low relevance to a roofing contractor; kept for awareness."),
      trade_relevance: { roofing: 0.3, hvac: 0.95, gc: 0.6 },
    },
    {
      source: "Arizona ROC", severity: "high", category: "licensing", status: "published", detected_at: d(5),
      headline: "License bond minimum raised for residential contractors", number_display: "+$5,000", number_kind: "dollar",
      effective_label: "Applies at next renewal", effective_date: null,
      summary: "The minimum bond for residential license classes with under $750,000 in annual volume rose from $9,000 to $14,000.",
      recommended_action: "Ask your bond agent for the new rate",
      action_detail: "Your renewal will require the higher bond. Premiums usually scale with the bond amount, so get a quote now and budget for it.",
      diff_before: "Residential (volume under $750,000): $9,000 bond", diff_after: "Residential (volume under $750,000): $14,000 bond",
      classification: agreed("high", 0.88, "Compliance requirement with a clear cost at renewal."),
      trade_relevance: { roofing: 0.9, hvac: 0.9, gc: 0.9 },
    },
    {
      source: "ABC Supply", severity: "medium", category: "supplier_terms", status: "dismissed", detected_at: d(6),
      headline: "Delivery fuel surcharge added on orders under $1,500", number_display: "+$35", number_kind: "dollar",
      effective_label: "Effective immediately", effective_date: null,
      summary: "Branch delivery terms now add a $35 fuel surcharge on delivered orders below $1,500. Will-call pickup is exempt.",
      recommended_action: "Batch small orders or use will-call",
      action_detail: "Combine accessory runs into one delivery, or send the truck for anything small.",
      diff_after: "Delivery: $35 fuel surcharge applies to delivered orders under $1,500. Will-call orders exempt.",
      classification: agreed("medium", 0.79, "Small, avoidable cost."),
      trade_relevance: { roofing: 0.85, hvac: 0.6, gc: 0.7 },
    },
    {
      source: "Tucson", severity: "critical", category: "permit_fee", status: "handled", detected_at: d(6), handled_at: d(5), alert_sent_at: d(6),
      headline: "Expedited review fee now required for rooftop solar permits", number_display: "+$150", number_kind: "dollar",
      effective_label: "Effective Sep 1", effective_date: "2026-09-01",
      summary: "Rooftop solar permits now route through expedited review with a mandatory $150 fee. Reroof-with-solar packages are affected.",
      recommended_action: "Add $150 to solar-ready reroof quotes",
      action_detail: "Any quote bundling a reroof with solar mounting needs the fee added. Solar-only partners should already know; confirm.",
      diff_after: "Rooftop Solar (residential): expedited review required, $150.00 fee at intake.",
      classification: agreed("critical", 0.9, "Mandatory fee on active quote types."),
      trade_relevance: { roofing: 0.9, hvac: 0.1, gc: 0.6 },
    },
  ];

  const rows = changes.map(({ source, ...c }) => ({ ...c, user_id: userId, source_id: sid(source), source_name: source }));
  const { error: chErr } = await admin.from("changes").insert(rows);
  if (chErr) throw chErr;
  console.log(`Seeded ${srcRows!.length} sources and ${rows.length} changes.`);

  // Guides
  const { SEED_PILLARS, SEED_SPOKES } = await import("../src/lib/guides/seed-content");
  const keyToId = new Map<string, string>();
  for (const { key, related_keys: _r, ...p } of SEED_PILLARS) {
    void _r;
    const { data, error } = await admin.from("guide_pillars").upsert(p, { onConflict: "slug" }).select("id").single();
    if (error) throw error;
    keyToId.set(key, data.id);
  }
  for (const { key, related_keys } of SEED_PILLARS) {
    await admin
      .from("guide_pillars")
      .update({ related_pillar_ids: related_keys.map((k) => keyToId.get(k)).filter(Boolean) })
      .eq("id", keyToId.get(key)!);
  }
  for (const { pillar_key, ...s } of SEED_SPOKES) {
    const { error } = await admin.from("guide_spokes").upsert({ ...s, pillar_id: keyToId.get(pillar_key)! }, { onConflict: "pillar_id,slug" });
    if (error) throw error;
  }
  console.log(`Seeded ${SEED_PILLARS.length} guide pillars and ${SEED_SPOKES.length} spokes.`);
  console.log(`\nSign in at /login with ${EMAIL} / ${PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
