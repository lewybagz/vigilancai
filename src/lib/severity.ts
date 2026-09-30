import type { ChangeCategory, Severity, SeverityThreshold, SourceKind, Trade } from "./types";

export const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
};

/** CSS variable names, used as inline styles so severity never depends on a utility class. */
export const SEVERITY_VAR: Record<Severity, { color: string; tint: string }> = {
  critical: { color: "var(--critical)", tint: "var(--critical-tint)" },
  high: { color: "var(--high)", tint: "var(--high-tint)" },
  medium: { color: "var(--medium)", tint: "var(--medium-tint)" },
};

export const CATEGORY_LABEL: Record<ChangeCategory, string> = {
  permit_fee: "Permit fees",
  material_price: "Material prices",
  licensing: "Licensing",
  code_requirement: "Code requirements",
  supplier_terms: "Supplier terms",
  other: "Other",
};

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  jurisdiction: "Jurisdiction",
  supplier: "Supplier",
  manufacturer: "Manufacturer",
  licensing: "Licensing",
  code: "Building code",
};

export const TRADE_LABEL: Record<Trade, string> = {
  roofing: "Roofing",
  hvac: "HVAC",
  gc: "General contracting",
};

export function meetsThreshold(severity: Severity, threshold: SeverityThreshold): boolean {
  if (threshold === "all") return true;
  if (threshold === "critical_high") return severity !== "medium";
  return severity === "critical";
}

/** Strict spec ordering: severity first, then most recent. Never grouped by source or date. */
export function sortBySeverity<T extends { severity: Severity; detected_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
  });
}
