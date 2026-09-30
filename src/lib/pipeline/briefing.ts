
import type { SupabaseClient } from "@supabase/supabase-js";
import { briefingEmail } from "@/lib/email/templates";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { meetsThreshold, sortBySeverity } from "@/lib/severity";
import { SITE } from "@/lib/site";
import { greetingFor } from "@/lib/time";
import type { Change, Profile, Source, UserSettings } from "@/lib/types";

/** Local wall-clock parts for a timezone. */
function localParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    ymd: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour === "24" ? 0 : p.hour) * 60 + Number(p.minute),
    weekday: p.weekday,
  };
}

/** Has this user's delivery moment passed today (local time), and did we not already send today? */
export function briefingDue(settings: UserSettings, now = new Date()): boolean {
  let tz = settings.timezone || "America/Phoenix";
  let local;
  try {
    local = localParts(now, tz);
  } catch {
    tz = "America/Phoenix";
    local = localParts(now, tz);
  }
  const [h, m] = settings.delivery_time.split(":").map(Number);
  if (local.minutes < h * 60 + m) return false;
  if (settings.cadence === "weekly" && local.weekday !== "Mon") return false;
  if (settings.last_briefing_sent_at) {
    const last = localParts(new Date(settings.last_briefing_sent_at), tz);
    if (last.ymd === local.ymd) return false;
  }
  return true;
}

export async function sendBriefingForUser(admin: SupabaseClient, userId: string, settings: UserSettings): Promise<boolean> {
  if (!emailConfigured()) return false;
  const windowStart = settings.last_briefing_sent_at
    ? new Date(settings.last_briefing_sent_at)
    : new Date(Date.now() - (settings.cadence === "daily" ? 1 : 7) * 86400000);

  const [{ data: profile }, { data: sources }, { data: changes }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle<Profile>(),
    admin.from("sources").select("name, snoozed_until").eq("user_id", userId).returns<Pick<Source, "name" | "snoozed_until">[]>(),
    admin
      .from("changes")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "published")
      .gte("detected_at", windowStart.toISOString())
      .returns<Change[]>(),
  ]);
  if (!profile) return false;

  const included = sortBySeverity((changes ?? []).filter((c) => meetsThreshold(c.severity, settings.threshold)));
  const mail = briefingEmail({
    greeting: greetingFor(new Date(), settings.timezone),
    ownerName: profile.first_name ?? "there",
    changes: included,
    sourceNames: (sources ?? []).filter((s) => !s.snoozed_until || new Date(s.snoozed_until) < new Date()).map((s) => s.name),
    cadence: settings.cadence,
    appUrl: SITE.url,
  });
  await sendEmail({ to: [profile.email], ...mail, tags: [{ name: "kind", value: "briefing" }] });
  await admin.from("user_settings").update({ last_briefing_sent_at: new Date().toISOString() }).eq("user_id", userId);
  return true;
}

/** Cron entry: send every due briefing. */
export async function sendDueBriefings(admin: SupabaseClient): Promise<{ sent: number; checked: number }> {
  const { data: all } = await admin.from("user_settings").select("*").returns<UserSettings[]>();
  let sent = 0;
  for (const s of all ?? []) {
    if (!briefingDue(s)) continue;
    try {
      if (await sendBriefingForUser(admin, s.user_id, s)) sent++;
    } catch (e) {
      console.error("[briefing] failed for", s.user_id, e);
    }
  }
  return { sent, checked: all?.length ?? 0 };
}
