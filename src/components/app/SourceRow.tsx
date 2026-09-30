"use client";

import { useTransition } from "react";
import { removeSource, setSourceCadence, snoozeSource, unsnoozeSource } from "@/lib/actions/sources";
import { SOURCE_KIND_LABEL } from "@/lib/severity";
import { agoWords, formatDate } from "@/lib/time";
import type { Source, SourceCadence } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { SnoozeMenu } from "./SnoozeMenu";

export function SourceRow({ source, canSetCadence }: { source: Source; canSetCadence: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const snoozed = !!source.snoozed_until && new Date(source.snoozed_until) > new Date();

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
    <li className="rounded-[var(--radius-card)] border border-hairline bg-surface p-5" style={{ opacity: snoozed ? 0.7 : 1 }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{
                background:
                  source.status === "error" ? "var(--critical)" : source.status === "ok" ? "var(--calm)" : "var(--fog)",
              }}
              aria-label={`Status ${source.status}`}
            />
            <span className="truncate text-[15px] font-semibold text-ink">{source.name}</span>
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-fog">{SOURCE_KIND_LABEL[source.kind]}</span>
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-1 block truncate font-mono text-[12px] text-fog hover:text-accent"
          >
            {source.url}
          </a>
          <div className="mt-2 font-mono text-[12px] text-fog">
            {source.status === "error" && source.last_error ? (
              <span className="text-critical">Last check failed: {source.last_error}</span>
            ) : source.last_checked_at ? (
              <>Checked {agoWords(source.last_checked_at)}</>
            ) : (
              "Not checked yet"
            )}
            {source.last_changed_at && <> · last change {formatDate(source.last_changed_at)}</>}
            {snoozed && <> · snoozed until {formatDate(source.snoozed_until!)}</>}
          </div>
        </div>
        <label className="shrink-0 text-[13px] text-slate">
          <span className="sr-only">Check cadence</span>
          <select
            value={source.cadence}
            disabled={pending || !canSetCadence}
            title={canSetCadence ? undefined : "Per-source cadence is a Pro feature"}
            onChange={(e) => run(() => setSourceCadence(source.id, e.target.value as SourceCadence), "Cadence updated")}
            className="h-8 rounded-md border border-hairline bg-surface px-2 text-[13px] text-ink disabled:opacity-60"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {snoozed ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => unsnoozeSource(source.id), `${source.name} is being watched again`)}
            className="h-8 rounded-md border border-hairline bg-surface px-3 text-[13px] font-medium text-ink hover:bg-paper disabled:opacity-50"
          >
            Resume watching
          </button>
        ) : (
          <SnoozeMenu
            disabled={pending}
            label="Snooze"
            onPick={(days) => run(() => snoozeSource(source.id, days), `${source.name} snoozed for ${days} days`)}
          />
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Stop watching ${source.name}? Its history stays; future checks stop.`)) {
              run(() => removeSource(source.id), `${source.name} removed`);
            }
          }}
          className="ml-auto h-8 px-2 text-[13px] text-fog hover:text-critical disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
