"use client";

import { useEffect, useRef, useState } from "react";

const OPTIONS = [3, 7, 14, 30];

export function SnoozeMenu({
  onPick,
  disabled,
  label = "Snooze source",
}: {
  onPick: (days: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-8 rounded-md border border-hairline bg-surface px-3 text-[13px] font-medium text-ink hover:bg-paper disabled:opacity-50"
      >
        {label}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-hairline bg-surface py-1 shadow-sm">
          {OPTIONS.map((d) => (
            <button
              key={d}
              role="menuitem"
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[13px] text-ink hover:bg-paper"
              onClick={() => {
                setOpen(false);
                onPick(d);
              }}
            >
              {d} days
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
