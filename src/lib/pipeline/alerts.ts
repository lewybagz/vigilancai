
import type { SupabaseClient } from "@supabase/supabase-js";
import { criticalAlertEmail } from "@/lib/email/templates";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { SITE } from "@/lib/site";
import type { Change } from "@/lib/types";

/**
 * Immediate critical alert to the owner plus every configured crew recipient.
 * Idempotent: a change with alert_sent_at set is never re-sent.
 */
export async function sendCriticalAlert(admin: SupabaseClient, change: Change): Promise<{ sent: boolean; recipients: string[] }> {
  if (change.alert_sent_at) return { sent: false, recipients: [] };
  if (!emailConfigured()) {
    console.warn("[alerts] Resend not configured; skipping critical alert for", change.id);
    return { sent: false, recipients: [] };
  }

  const [{ data: profile }, { data: recips }] = await Promise.all([
    admin.from("profiles").select("email, first_name").eq("id", change.user_id).maybeSingle(),
    admin.from("alert_recipients").select("email").eq("user_id", change.user_id),
  ]);
  const to = Array.from(new Set([profile?.email, ...(recips ?? []).map((r) => r.email)].filter(Boolean) as string[]));
  if (to.length === 0) return { sent: false, recipients: [] };

  const mail = criticalAlertEmail({ change, ownerName: profile?.first_name ?? "there", appUrl: SITE.url });
  await sendEmail({ to, ...mail, tags: [{ name: "kind", value: "critical_alert" }] });
  await admin.from("changes").update({ alert_sent_at: new Date().toISOString() }).eq("id", change.id);
  return { sent: true, recipients: to };
}

/** Sweep: any published critical change without an alert (e.g. approved from needs_review) gets one. */
export async function sendPendingCriticalAlerts(admin: SupabaseClient): Promise<number> {
  const { data } = await admin
    .from("changes")
    .select("*")
    .eq("status", "published")
    .eq("severity", "critical")
    .is("alert_sent_at", null)
    .gte("detected_at", new Date(Date.now() - 3 * 86400000).toISOString())
    .returns<Change[]>();
  let n = 0;
  for (const c of data ?? []) {
    try {
      const r = await sendCriticalAlert(admin, c);
      if (r.sent) n++;
    } catch (e) {
      console.error("[alerts] failed", c.id, e);
    }
  }
  return n;
}
