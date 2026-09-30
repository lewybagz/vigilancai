import type { ChangeCategory, ClassificationMeta, ChangeStatus, Severity, Trade, TradeRelevance } from "@/lib/types";
import type { LayaClassification } from "./laya";
import type { LlmChange } from "./claude";

export interface Reconciled {
  keep: boolean;
  status: ChangeStatus;
  severity: Severity;
  category: ChangeCategory;
  tradeRelevance: TradeRelevance;
  /** True only when both classifiers said critical and Laya was confident. Gates immediate alerts. */
  alertNow: boolean;
  meta: ClassificationMeta;
}

const MIN_CONF = Number(process.env.LAYA_MIN_CONFIDENCE ?? 0.7);

/**
 * "Both classify, Claude breaks ties."
 * Agreement publishes. Disagreement, or a low-confidence Laya read, holds the change for review
 * so nobody gets paged at 6am on an uncertain call. Claude's fields win on any disagreement.
 */
export function reconcile(llm: LlmChange, laya: LayaClassification | null, ownerTrade: Trade): Reconciled {
  const reasons: string[] = [llm.severity_reason];

  if (!laya) {
    const relevant = llm.trade_relevance[ownerTrade] >= 0.35;
    return {
      keep: llm.material && relevant,
      status: "published",
      severity: llm.severity,
      category: llm.category,
      tradeRelevance: llm.trade_relevance,
      alertNow: llm.material && relevant && llm.severity === "critical",
      meta: { method: "llm_only", llm_severity: llm.severity, llm_category: llm.category, reasons },
    };
  }

  const tradeRelevance: TradeRelevance = {
    roofing: avg(llm.trade_relevance.roofing, laya.trade.roofing),
    hvac: avg(llm.trade_relevance.hvac, laya.trade.hvac),
    gc: avg(llm.trade_relevance.gc, laya.trade.gc),
  };

  // Material: keep if Claude says material, or if Laya is strongly sure it is and Claude only leaned no.
  const layaMaterial = laya.material >= 0.5;
  const keep = llm.material || (laya.material >= 0.85 && laya.materialConfidence >= MIN_CONF);
  if (!llm.material && keep) reasons.push("Claude read this as boilerplate but Laya was confident it is material, so it is held for your review.");

  // Trade relevance: drop only when both say it does not apply to the owner's trade.
  const ownerRel = tradeRelevance[ownerTrade] ?? 0.5;
  const irrelevant = llm.trade_relevance[ownerTrade] < 0.35 && laya.trade[ownerTrade] < 0.35;

  const severityAgreed = laya.severity === llm.severity;
  const layaConfident = laya.severityConfidence >= MIN_CONF;
  const agreed = severityAgreed && layaConfident && llm.material === layaMaterial;

  if (!severityAgreed) {
    reasons.push(`Laya scored this ${laya.severity} (${pct(laya.severityConfidence)} confidence); Claude said ${llm.severity}.`);
  } else if (!layaConfident) {
    reasons.push(`Laya agreed on ${llm.severity} but at ${pct(laya.severityConfidence)} confidence, below the ${pct(MIN_CONF)} bar.`);
  }
  if (laya.category !== llm.category) {
    reasons.push(`Category read differently (Laya: ${laya.category.replace("_", " ")}, Claude: ${llm.category.replace("_", " ")}); Claude's wins.`);
  }

  const status: ChangeStatus = agreed ? "published" : "needs_review";

  return {
    keep: keep && !irrelevant,
    status,
    severity: llm.severity,
    category: llm.category,
    tradeRelevance,
    alertNow: agreed && llm.severity === "critical" && ownerRel >= 0.35,
    meta: {
      method: "laya_llm",
      agreed,
      laya_confidence: laya.severityConfidence,
      laya_severity: laya.severity,
      llm_severity: llm.severity,
      laya_category: laya.category,
      llm_category: llm.category,
      reasons,
      attribution: laya.attribution?.map((a) => ({ label: a.label, support: a.support })),
    },
  };
}

function avg(a: number, b: number) {
  return Math.round(((a + b) / 2) * 100) / 100;
}
function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
