"use client";

import { useState } from "react";
import { CATEGORY_LABEL, sortBySeverity } from "@/lib/severity";
import type { Change, ChangeCategory } from "@/lib/types";
import { Segmented } from "@/components/ui/Field";
import { ChangeCard } from "./ChangeCard";

type Mode = "severity" | "category";

export function ChangeFeed({
  changes,
  context = "home",
  allowGrouping = true,
}: {
  changes: Change[];
  context?: "home" | "history";
  allowGrouping?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("severity");
  const sorted = sortBySeverity(changes);

  if (mode === "category" && allowGrouping) {
    const groups = new Map<ChangeCategory, Change[]>();
    for (const c of sorted) groups.set(c.category, [...(groups.get(c.category) ?? []), c]);
    let i = 0;
    return (
      <div>
        <Toggle mode={mode} setMode={setMode} />
        <div className="space-y-8">
          {[...groups.entries()].map(([cat, items]) => (
            <section key={cat} aria-label={CATEGORY_LABEL[cat]}>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">
                {CATEGORY_LABEL[cat]} <span className="font-mono font-normal">· {items.length}</span>
              </h2>
              <div className="space-y-4">
                {items.map((c) => (
                  <ChangeCard key={c.id} change={c} index={i++} context={context} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {allowGrouping && <Toggle mode={mode} setMode={setMode} />}
      <div className="space-y-4">
        {sorted.map((c, i) => (
          <ChangeCard key={c.id} change={c} index={i} context={context} />
        ))}
      </div>
    </div>
  );
}

function Toggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <Segmented
        ariaLabel="Group changes"
        value={mode}
        onChange={setMode}
        options={[
          { value: "severity", label: "By severity" },
          { value: "category", label: "By category" },
        ]}
      />
    </div>
  );
}
