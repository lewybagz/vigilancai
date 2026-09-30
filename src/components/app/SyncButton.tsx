"use client";

import { useState, useTransition } from "react";
import { syncNow } from "@/lib/actions/sources";
import { useToast } from "@/components/ui/Toast";
import { agoWords } from "@/lib/time";

export function SyncButton({ lastCheckedAt }: { lastCheckedAt: string | null }) {
  const [pending, start] = useTransition();
  const [last, setLast] = useState(lastCheckedAt);
  const toast = useToast();

  return (
    <div className="flex items-center gap-3 text-[13px] text-fog">
      <span className="hidden sm:inline">{last ? `Checked ${agoWords(last)}` : "Not checked yet"}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const r = await syncNow(true);
              setLast(new Date().toISOString());
              toast(
                r.newChanges > 0
                  ? `Checked ${r.checked} source${r.checked === 1 ? "" : "s"}, ${r.newChanges} new change${r.newChanges === 1 ? "" : "s"}`
                  : `Checked ${r.checked} source${r.checked === 1 ? "" : "s"}. Nothing new.`,
              );
            } catch (e) {
              toast(e instanceof Error ? e.message : "Sync failed");
            }
          })
        }
        className="text-accent hover:underline disabled:opacity-50"
      >
        {pending ? "Checking…" : "Check now"}
      </button>
    </div>
  );
}
