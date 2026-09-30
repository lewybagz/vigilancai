import type { CSSProperties, ReactNode } from "react";

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-hairline bg-surface p-6 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[12px] text-fog ${className}`}>{children}</span>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">{children}</div>
  );
}
