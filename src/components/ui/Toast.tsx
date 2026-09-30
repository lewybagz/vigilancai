"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface ToastItem {
  id: number;
  text: string;
}

const ToastCtx = createContext<(text: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text }]);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const t = setTimeout(() => setItems((s) => s.slice(1)), 3200);
    return () => clearTimeout(t);
  }, [items]);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {items.map((t) => (
          <div key={t.id} className="rounded-lg bg-ink px-4 py-2 text-[14px] text-white shadow-sm">
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
