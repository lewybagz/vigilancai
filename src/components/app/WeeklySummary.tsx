import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_VAR } from "@/lib/severity";
import type { Change, ChangeCategory, Severity } from "@/lib/types";
import { SeverityDot } from "@/components/ui/SeverityDot";
import { formatDate } from "@/lib/time";

export function WeeklySummary({ changes, since }: { changes: Change[]; since: string }) {
  const total = changes.length;
  const byCategory = new Map<ChangeCategory, number>();
  const bySeverity: Record<Severity, number> = { critical: 0, high: 0, medium: 0 };
  let handled = 0;
  let alerts = 0;
  const sources = new Map<string, number>();

  for (const c of changes) {
    byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + 1);
    bySeverity[c.severity]++;
    if (c.status === "handled") handled++;
    if (c.alert_sent_at) alerts++;
    sources.set(c.source_name, (sources.get(c.source_name) ?? 0) + 1);
  }
  const cats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const top = cats[0];
  const max = top?.[1] ?? 1;
  const topSources = [...sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">This week</div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-[40px] font-bold leading-none tracking-tight text-ink">{total}</span>
          <span className="text-[15px] text-slate">change{total === 1 ? "" : "s"} since {formatDate(since, { month: "short", day: "numeric" })}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate">
          {(["critical", "high", "medium"] as Severity[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <SeverityDot severity={s} size={7} />
              <span className="font-semibold" style={{ color: SEVERITY_VAR[s].color }}>{bySeverity[s]}</span> {SEVERITY_LABEL[s].toLowerCase()}
            </span>
          ))}
          <span>{handled} handled</span>
          <span>{alerts} critical alert{alerts === 1 ? "" : "s"} sent</span>
        </div>
      </div>

      {top && (
        <div className="rounded-[var(--radius-card)] border border-hairline p-6" style={{ background: "var(--medium-tint)" }}>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">Most frequent</div>
          <div className="mt-2 text-[17px] font-medium text-ink">{CATEGORY_LABEL[top[0]]}</div>
          <div className="mt-1 text-[14px] text-slate">
            {top[1]} of {total} change{total === 1 ? "" : "s"} this week
            {topSources.length > 0 && <> · mostly from {topSources.map(([n]) => n).join(", ")}</>}
          </div>
        </div>
      )}

      {cats.length > 0 && (
        <section aria-label="Changes by category">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">By category</div>
          <ul className="space-y-2.5">
            {cats.map(([cat, n]) => (
              <li key={cat} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                <span className="text-[14px] text-ink">{CATEGORY_LABEL[cat]}</span>
                <span className="font-mono text-[13px] text-slate">{n}</span>
                <div className="col-span-2 h-1 rounded-full bg-hairline">
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${Math.max(4, (n / max) * 100)}%`, background: cat === top?.[0] ? "var(--medium)" : "var(--fog)" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
