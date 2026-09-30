import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { daysAgoISO } from "@/lib/time";
import type { Change } from "@/lib/types";
import { ChangeFeed } from "@/components/app/ChangeFeed";
import { WeeklySummary } from "@/components/app/WeeklySummary";

export const dynamic = "force-dynamic";
export const metadata = { title: "History" };

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(d);
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const { supabase, user } = await requireUser();
  const since = daysAgoISO(30);
  const { data } = await supabase
    .from("changes")
    .select("*")
    .eq("user_id", user.id)
    .gte("detected_at", since)
    .order("detected_at", { ascending: false })
    .returns<Change[]>();
  const changes = data ?? [];
  const weekSince = daysAgoISO(7);
  const week = changes.filter((c) => c.detected_at >= weekSince && c.status !== "dismissed");

  const byDay = new Map<string, Change[]>();
  for (const c of changes) {
    const key = c.detected_at.slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), c]);
  }

  const summary = view === "summary";

  return (
    <div>
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-ink">History</h1>
          <p className="mt-1 text-[16px] text-slate">Last 30 days.</p>
        </div>
        <div className="inline-flex rounded-lg border border-hairline bg-surface p-0.5 text-[13px] font-medium">
          <Link href="/app/history" className={`rounded-md px-3 py-1.5 ${!summary ? "bg-ink text-white" : "text-slate"}`}>
            Feed
          </Link>
          <Link href="/app/history?view=summary" className={`rounded-md px-3 py-1.5 ${summary ? "bg-ink text-white" : "text-slate"}`}>
            Week
          </Link>
        </div>
      </header>

      <div className="mt-8">
        {summary ? (
          week.length === 0 ? (
            <p className="text-[15px] text-slate">No changes in the last seven days.</p>
          ) : (
            <WeeklySummary changes={week} since={weekSince} />
          )
        ) : changes.length === 0 ? (
          <p className="text-[15px] text-slate">No changes recorded yet.</p>
        ) : (
          <div className="space-y-10">
            {[...byDay.entries()].map(([day, items]) => (
              <section key={day} aria-label={dayLabel(items[0].detected_at)}>
                <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">
                  {dayLabel(items[0].detected_at)} <span className="font-mono font-normal">· {items.length}</span>
                </h2>
                <ChangeFeed changes={items} context="history" allowGrouping={false} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
