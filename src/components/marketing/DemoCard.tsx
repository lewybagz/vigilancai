import type { Severity } from "@/lib/types";
import { SEVERITY_VAR } from "@/lib/severity";
import { SeverityDot } from "@/components/ui/SeverityDot";

export interface DemoChange {
  severity: Severity;
  source: string;
  ago: string;
  headline: string;
  number: string;
  numberKind?: "number" | "tag";
  effective: string;
  action: string;
}

/**
 * Static twin of the in-app ChangeCard. Same layout, same type scale,
 * no interactivity. Severity color appears only here, never decoratively.
 */
export function DemoCard({ change, index = 0, compact = false }: { change: DemoChange; index?: number; compact?: boolean }) {
  const v = SEVERITY_VAR[change.severity];
  const pad = compact ? "p-5" : "p-6";
  return (
    <article
      className="card-in rounded-[var(--radius-card)] border border-hairline"
      style={{ ["--i" as string]: index, background: v.tint }}
    >
      <div className={`${pad} text-left`}>
        <div className="flex items-center gap-2.5">
          <SeverityDot severity={change.severity} />
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink">{change.source}</span>
          <span className="ml-auto text-[13px] text-fog">{change.ago}</span>
        </div>

        <h3 className="mt-3 text-[17px] font-medium leading-snug text-ink">{change.headline}</h3>

        <div className="mt-4">
          {change.numberKind === "tag" ? (
            <span className="font-mono text-[13px] font-medium uppercase tracking-[0.08em]" style={{ color: v.color }}>
              {change.number}
            </span>
          ) : (
            <span className="text-[22px] font-bold leading-none tracking-tight" style={{ color: v.color }}>
              {change.number}
            </span>
          )}
        </div>

        <div className="mt-1.5 font-mono text-[12px] text-fog">{change.effective}</div>

        <p className="mt-4 text-[14px] font-medium text-slate">
          <span aria-hidden className="mr-1.5">→</span>
          {change.action}
        </p>
      </div>
    </article>
  );
}

/** The canonical three example changes used across the marketing site. */
export const DEMO_CHANGES: DemoChange[] = [
  {
    severity: "critical",
    source: "TUCSON",
    ago: "6h",
    headline: "Residential reroof permit fee increased",
    number: "+$55",
    effective: "Effective Aug 1",
    action: "Update pending estimates",
  },
  {
    severity: "high",
    source: "ABC SUPPLY",
    ago: "9h",
    headline: "Owens Corning Duration shingles up 8.2% per square",
    number: "+8.2%",
    effective: "Effective Sep 15",
    action: "Re-quote open bids before Friday",
  },
  {
    severity: "medium",
    source: "ARIZONA ROC",
    ago: "1d",
    headline: "New continuing-education requirement for license renewal",
    number: "NEW BULLETIN",
    numberKind: "tag",
    effective: "Comment period ends Oct 30",
    action: "Note for next renewal cycle",
  },
];

export function DemoCardList({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3">
      {DEMO_CHANGES.map((c, i) => (
        <DemoCard key={c.headline} change={c} index={i} compact={compact} />
      ))}
    </div>
  );
}
