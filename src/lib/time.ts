import { formatDistanceToNowStrict } from "date-fns";

export function greetingFor(date = new Date(), timeZone?: string): string {
  let hour = date.getHours();
  if (timeZone) {
    try {
      hour = Number(
        new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone }).format(date),
      );
    } catch {
      // fall back to server-local hour
    }
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "2h", "5h", "1d" - the compact relative time used on card headers. */
export function compactAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w`;
  return `${Math.round(day / 30)}mo`;
}

export function agoWords(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}
