import { requireUser } from "@/lib/supabase/server";
import { greetingFor, daysAgoISO } from "@/lib/time";
import type { Change, Profile, Source, UserSettings } from "@/lib/types";
import { ChangeFeed } from "@/components/app/ChangeFeed";
import { ClosingLine } from "@/components/app/ClosingLine";
import { FirstRun, NothingChanged } from "@/components/app/EmptyState";
import { SyncButton } from "@/components/app/SyncButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: settings }, { data: sources }, { data: changes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle<UserSettings>(),
    supabase.from("sources").select("*").eq("user_id", user.id).order("name").returns<Source[]>(),
    supabase
      .from("changes")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["published", "needs_review"])
      .gte("detected_at", daysAgoISO(1))
      .order("detected_at", { ascending: false })
      .returns<Change[]>(),
  ]);

  const firstName = profile?.first_name || user.email?.split("@")[0] || "there";
  const greeting = greetingFor(new Date(), settings?.timezone);
  const active = changes ?? [];
  const sourceList = sources ?? [];
  const everChecked = sourceList.some((s) => s.last_checked_at);
  const lastChecked = sourceList.reduce<string | null>(
    (acc, s) => (s.last_checked_at && (!acc || s.last_checked_at > acc) ? s.last_checked_at : acc),
    null,
  );
  const count = active.length;

  return (
    <div>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-ink">
            {greeting}, {firstName}.
          </h1>
          {count > 0 && (
            <p className="mt-1 text-[16px] text-slate">
              {count} important change{count === 1 ? "" : "s"} since yesterday.
            </p>
          )}
        </div>
        <div className="pt-1.5">
          <SyncButton lastCheckedAt={lastChecked} />
        </div>
      </header>

      {count === 0 ? (
        everChecked ? (
          <NothingChanged sourceNames={sourceList.filter((s) => !s.snoozed_until).map((s) => s.name)} />
        ) : (
          <FirstRun hasSources={sourceList.length > 0} />
        )
      ) : (
        <>
          <div className="mt-8">
            <ChangeFeed changes={active} context="home" />
          </div>
          <ClosingLine />
        </>
      )}
    </div>
  );
}
