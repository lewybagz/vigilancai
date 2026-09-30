import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runDueSources } from "@/lib/pipeline/run";
import { sendPendingCriticalAlerts } from "@/lib/pipeline/alerts";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Hourly: check every source whose cadence is due, then sweep unsent critical alerts. */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const limit = Number(url.searchParams.get("limit") ?? 40);

  const started = Date.now();
  const result = await runDueSources({ force, limit });
  const swept = await sendPendingCriticalAlerts(createAdminClient());
  return NextResponse.json({ ...result, sweptAlerts: swept, ms: Date.now() - started });
}
