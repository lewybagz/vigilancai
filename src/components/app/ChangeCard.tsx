"use client";

import { useState, useTransition } from "react";
import { diffWords } from "diff";
import { approveChange, dismissChange, markHandled, reopenChange } from "@/lib/actions/changes";
import { snoozeSourceByName } from "@/lib/actions/sources";
import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_VAR } from "@/lib/severity";
import { compactAgo, formatDate } from "@/lib/time";
import type { Change } from "@/lib/types";
import { SeverityDot } from "@/components/ui/SeverityDot";
import { useToast } from "@/components/ui/Toast";
import { SnoozeMenu } from "./SnoozeMenu";

export function ChangeCard({
  change,
  index = 0,
  context = "home",
}: {
  change: Change;
  index?: number;
  context?: "home" | "history";
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const v = SEVERITY_VAR[change.severity];
  const isNeedsReview = change.status === "needs_review";
  const isHandled = change.status === "handled";
  const isDismissed = change.status === "dismissed";
  const muted = isHandled || isDismissed;

  function run(fn: () => Promise<unknown>, msg: string) {
    start(async () => {
      try {
        await fn();
        toast(msg);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <article
      className="card-in rounded-[var(--radius-card)] border border-hairline"
      style={{
        ["--i" as string]: index,
        background: muted ? "var(--surface)" : v.tint,
        opacity: muted ? 0.72 : 1,
      }}
      aria-labelledby={`change-${change.id}-h`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`change-${change.id}-detail`}
        className="block w-full p-6 text-left"
      >
        {/* Row 1: severity dot + source + relative time */}
        <div className="flex items-center gap-2.5">
          <SeverityDot severity={change.severity} />
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink">
            {change.source_name}
          </span>
          {isNeedsReview && (
            <span className="rounded px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-slate" style={{ background: "var(--surface)" }}>
              Needs review
            </span>
          )}
          {isHandled && (
            <span className="font-mono text-[11px] uppercase tracking-wide text-calm">Handled</span>
          )}
          <span className="ml-auto text-[13px] text-fog" title={formatDate(change.detected_at, { dateStyle: "medium", timeStyle: "short" })}>
            {compactAgo(change.detected_at)}
          </span>
        </div>

        {/* Row 2: the change in plain English */}
        <h3 id={`change-${change.id}-h`} className="mt-3 text-[17px] font-medium leading-snug text-ink">
          {change.headline}
        </h3>

        {/* Row 3: the number (or a mono tag) */}
        <div className="mt-4">
          {change.number_kind === "tag" || !change.number_display ? (
            <span className="font-mono text-[13px] font-medium uppercase tracking-[0.08em]" style={{ color: v.color }}>
              {change.number_display ?? "Update"}
            </span>
          ) : (
            <span className="text-[22px] font-bold leading-none tracking-tight" style={{ color: v.color }}>
              {change.number_display}
            </span>
          )}
        </div>

        {/* Row 4: mono metadata */}
        {change.effective_label && (
          <div className="mt-1.5 font-mono text-[12px] text-fog">{change.effective_label}</div>
        )}

        {/* Row 5: recommended action, never a button */}
        <p className="mt-4 text-[14px] font-medium text-slate">
          <span aria-hidden className="mr-1.5">→</span>
          {change.recommended_action}
        </p>
      </button>

      {open && (
        <div id={`change-${change.id}-detail`} className="border-t border-hairline/80 px-6 pb-6 pt-5">
          <div className="space-y-5 text-[14px] leading-relaxed text-slate">
            <div>
              <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">Summary</div>
              <p className="text-ink">{change.summary}</p>
            </div>

            {(change.diff_before || change.diff_after) && (
              <div>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">What changed in the source</div>
                <DiffView before={change.diff_before ?? ""} after={change.diff_after ?? ""} />
              </div>
            )}

            {change.source_excerpt && (
              <div>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">Source excerpt</div>
                <blockquote className="rounded-md border border-hairline bg-surface p-3 font-mono text-[12px] leading-relaxed text-slate whitespace-pre-wrap">
                  {change.source_excerpt}
                </blockquote>
              </div>
            )}

            {change.action_detail && (
              <div>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">What to do</div>
                <p className="text-ink">{change.action_detail}</p>
              </div>
            )}

            <WhyFlagged change={change} />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] text-fog">
              <span>{CATEGORY_LABEL[change.category]}</span>
              <span>{SEVERITY_LABEL[change.severity]}</span>
              {change.effective_date && <span>Effective {formatDate(change.effective_date)}</span>}
              <span>Detected {formatDate(change.detected_at, { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {isNeedsReview && (
              <ActionButton disabled={pending} onClick={() => run(() => approveChange(change.id), "Published to your briefing")}>
                Looks right, publish it
              </ActionButton>
            )}
            {!muted && (
              <ActionButton disabled={pending} onClick={() => run(() => markHandled(change.id), "Marked handled")}>
                Mark handled
              </ActionButton>
            )}
            {!muted && change.severity !== "critical" && (
              <SnoozeMenu
                disabled={pending}
                onPick={(days) =>
                  run(() => snoozeSourceByName(change.source_name, days), `${change.source_name} snoozed for ${days} days`)
                }
                label={`Snooze ${change.source_name}`}
              />
            )}
            {!muted && (
              <ActionButton disabled={pending} onClick={() => run(() => dismissChange(change.id), "Dismissed")}>
                Dismiss
              </ActionButton>
            )}
            {muted && (
              <ActionButton disabled={pending} onClick={() => run(() => reopenChange(change.id), "Reopened")}>
                Reopen
              </ActionButton>
            )}
            {context === "history" && change.alert_sent_at && (
              <span className="ml-auto font-mono text-[12px] text-fog">
                Alert sent {formatDate(change.alert_sent_at, { dateStyle: "medium", timeStyle: "short" })}
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function ActionButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="h-8 rounded-md border border-hairline bg-surface px-3 text-[13px] font-medium text-ink hover:bg-paper disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

function DiffView({ before, after }: { before: string; after: string }) {
  const parts = diffWords(before, after);
  return (
    <div className="rounded-md border border-hairline bg-surface p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
      {parts.map((p, i) => {
        if (p.added)
          return (
            <ins key={i} className="rounded-sm px-0.5 no-underline" style={{ background: "var(--calm)", color: "#fff" }}>
              {p.value}
            </ins>
          );
        if (p.removed)
          return (
            <del key={i} className="rounded-sm px-0.5 text-fog line-through" style={{ background: "var(--hairline)" }}>
              {p.value}
            </del>
          );
        return <span key={i}>{p.value}</span>;
      })}
    </div>
  );
}

function WhyFlagged({ change }: { change: Change }) {
  const c = change.classification;
  if (!c || !c.method) return null;
  const lines: string[] = [];
  if (c.method === "laya_llm") {
    lines.push(
      c.agreed
        ? `Both classifiers agreed on ${SEVERITY_LABEL[change.severity].toLowerCase()} severity${
            c.laya_confidence != null ? ` (Laya confidence ${Math.round(c.laya_confidence * 100)}%)` : ""
          }.`
        : `Classifiers disagreed (Laya: ${c.laya_severity ?? "?"}, Claude: ${c.llm_severity ?? "?"}), so this was held for review.`,
    );
  } else {
    lines.push("Classified by Claude only; the Laya decision service was unavailable.");
  }
  if (c.reasons?.length) lines.push(...c.reasons);
  const attr = c.attribution?.filter((a) => a.support > 0.02).slice(0, 3) ?? [];
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">Why we flagged this</div>
      <ul className="space-y-1">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
        {attr.length > 0 && (
          <li>
            Strongest signals:{" "}
            {attr.map((a, i) => (
              <span key={i} className="font-mono text-[12px]">
                {i > 0 && ", "}
                &ldquo;{a.label}&rdquo;
              </span>
            ))}
          </li>
        )}
      </ul>
    </div>
  );
}
