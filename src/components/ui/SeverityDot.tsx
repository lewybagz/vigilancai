import type { Severity } from "@/lib/types";
import { SEVERITY_LABEL, SEVERITY_VAR } from "@/lib/severity";

export function SeverityDot({ severity, size = 8 }: { severity: Severity; size?: number }) {
  return (
    <span
      role="img"
      aria-label={`${SEVERITY_LABEL[severity]} severity`}
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: SEVERITY_VAR[severity].color }}
    />
  );
}

export function CalmDot({ size = 8 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="All clear"
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: "var(--calm)" }}
    />
  );
}
