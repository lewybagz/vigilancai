import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { sendDueBriefings } from "@/lib/pipeline/briefing";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Every 15 minutes: send briefings whose local delivery time has passed today. */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await sendDueBriefings(createAdminClient());
  return NextResponse.json(result);
}
