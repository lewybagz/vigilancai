import { format } from "date-fns";

export function formatGuideDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "MMMM d, yyyy");
}

export function UpdatedLine({ updatedAt, className = "" }: { updatedAt: string; className?: string }) {
  const label = formatGuideDate(updatedAt);
  if (!label) return null;
  return (
    <p className={`font-mono text-[13px] text-fog ${className}`}>
      Updated <time dateTime={updatedAt}>{label}</time>
    </p>
  );
}
