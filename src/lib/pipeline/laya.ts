
import type { ChangeCategory, Severity, Trade } from "@/lib/types";

/**
 * Client for the Laya decision service (services/laya).
 * Laya is a small non-generative classifier: typed questions over a text "state",
 * one forward pass, calibrated probabilities. It gates and classifies; it never writes copy.
 */

export type LayaQuestion =
  | { type: "noul"; instructions: string; criteria?: Record<string, string | null> }
  | { type: "choice"; instructions: string; criteria: Record<string, string | null> }
  | { type: "score"; instructions: string; criteria: string[] };

export interface LayaAnswer {
  type: "noul" | "choice" | "score";
  noul?: number;
  choice?: string;
  score?: number;
  probabilities?: Record<string, number>;
  confidence: number;
  action?: { act_probability: number };
}

export interface LayaAttribution {
  label: string;
  support: number;
  tvd: number;
  flipped: boolean;
}

export interface LayaClassification {
  material: number;
  materialConfidence: number;
  category: ChangeCategory;
  categoryConfidence: number;
  severity: Severity;
  severityConfidence: number;
  severityProbabilities: Record<Severity, number>;
  trade: Record<Trade, number>;
  actProbability: number;
  attribution?: LayaAttribution[];
  raw: Record<string, LayaAnswer>;
  latencyMs: number;
}

const SEVERITY_LEVELS: Severity[] = ["medium", "high", "critical"];

export function layaQuestions(): Record<string, LayaQuestion> {
  return {
    material: {
      type: "noul",
      instructions:
        "Is this a material change that affects what a contractor pays, must do, or by when? Fee amounts, prices, surcharges, rules, deadlines, license requirements, or code requirements count. Wording, layout, navigation, footers, timestamps, and boilerplate do not.",
    },
    category: {
      type: "choice",
      instructions: "Which kind of change is this?",
      criteria: {
        permit_fee: "permit, plan review, or inspection fee amounts",
        material_price: "product or material pricing, surcharges, price increase notices",
        licensing: "contractor license rules, renewals, bonds, insurance, continuing education",
        code_requirement: "building code, energy code, or technical installation requirements",
        supplier_terms: "supplier delivery, credit, ordering, or return terms",
        other: "none of the above",
      },
    },
    severity: {
      type: "score",
      instructions: "How urgently does a contractor need to act on this change?",
      criteria: [
        "medium: worth knowing, no action needed this week",
        "high: act soon, affects open bids or jobs starting in the next month",
        "critical: act now, affects money already quoted, jobs in progress, or legal compliance",
      ],
    },
    roofing: { type: "noul", instructions: "Does this change matter to a roofing contractor?" },
    hvac: { type: "noul", instructions: "Does this change matter to an HVAC contractor?" },
    gc: { type: "noul", instructions: "Does this change matter to a general contractor?" },
  };
}

function baseUrl(): string | null {
  const u = process.env.LAYA_URL;
  return u ? u.replace(/\/$/, "") : null;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (process.env.LAYA_API_KEY) h["x-api-key"] = process.env.LAYA_API_KEY;
  return h;
}

export async function layaHealthy(timeoutMs = 4000): Promise<boolean> {
  const url = baseUrl();
  if (!url) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${url}/health`, { headers: headers(), signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/** State the classifier sees. Kept short: the English checkpoint reads 512 tokens. */
export function layaState(input: { source: string; kind: string; hunks: string; summaryHint?: string }) {
  return {
    source: input.source,
    source_type: input.kind,
    change: input.hunks.slice(0, 1600),
    ...(input.summaryHint ? { summary: input.summaryHint.slice(0, 300) } : {}),
  };
}

/**
 * Classify one change. Returns null when the service is not configured or unreachable,
 * so the pipeline can fall back to LLM-only classification.
 */
export async function layaClassify(
  state: Record<string, unknown>,
  opts: { attribution?: boolean; timeoutMs?: number } = {},
): Promise<LayaClassification | null> {
  const url = baseUrl();
  if (!url) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 25000);
  const started = Date.now();
  try {
    const path = opts.attribution ? "/inspect" : "/evaluate";
    const res = await fetch(`${url}${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ state, questions: layaQuestions(), ...(opts.attribution ? { attribution: true } : {}) }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Laya ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as {
      answers: Record<string, LayaAnswer>;
      attribution?: LayaAttribution[];
    };
    const a = json.answers;
    const sevProbs = a.severity.probabilities ?? {};
    const severityProbabilities = {
      medium: sevProbs["0"] ?? 0,
      high: sevProbs["1"] ?? 0,
      critical: sevProbs["2"] ?? 0,
    };
    const sevIdx = (Object.entries(sevProbs).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "0") as "0" | "1" | "2";
    const catChoice = (a.category.choice ?? "other") as ChangeCategory;

    return {
      material: a.material.noul ?? 0,
      materialConfidence: a.material.confidence,
      category: catChoice,
      categoryConfidence: a.category.confidence,
      severity: SEVERITY_LEVELS[Number(sevIdx)] ?? "medium",
      severityConfidence: a.severity.confidence,
      severityProbabilities,
      trade: { roofing: a.roofing?.noul ?? 0.5, hvac: a.hvac?.noul ?? 0.5, gc: a.gc?.noul ?? 0.5 },
      actProbability: a.severity.action?.act_probability ?? a.material.action?.act_probability ?? 0,
      attribution: json.attribution,
      raw: a,
      latencyMs: Date.now() - started,
    };
  } catch (e) {
    console.warn("[laya] unavailable:", e instanceof Error ? e.message : e);
    return null;
  } finally {
    clearTimeout(t);
  }
}
