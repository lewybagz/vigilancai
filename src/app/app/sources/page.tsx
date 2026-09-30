import { requireUser } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/plans";
import type { Source, Subscription } from "@/lib/types";
import { AddSourceForm } from "@/components/app/AddSourceForm";
import { SourceRow } from "@/components/app/SourceRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sources" };

export default async function SourcesPage() {
  const { supabase, user } = await requireUser();
  const [{ data: sources }, { data: sub }] = await Promise.all([
    supabase.from("sources").select("*").eq("user_id", user.id).order("name").returns<Source[]>(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle<Subscription>(),
  ]);
  const list = sources ?? [];
  const limits = getPlanLimits(sub?.plan ?? null, sub?.status ?? "none");
  const canSetCadence = limits.plan?.tier === "pro";
  const active = list.filter((s) => !s.snoozed_until || new Date(s.snoozed_until) <= new Date());
  const snoozed = list.filter((s) => s.snoozed_until && new Date(s.snoozed_until) > new Date());

  return (
    <div>
      <header>
        <h1 className="text-[24px] font-semibold tracking-tight text-ink">Sources</h1>
        <p className="mt-1 text-[16px] text-slate">
          {list.length === 0
            ? "Nothing is being watched yet."
            : `Watching ${active.length} source${active.length === 1 ? "" : "s"}${snoozed.length ? `, ${snoozed.length} snoozed` : ""}.`}
        </p>
      </header>

      <div className="mt-8">
        <AddSourceForm remaining={Math.max(0, limits.maxSources - list.length)} />
      </div>

      {active.length > 0 && (
        <ul className="mt-6 space-y-3">
          {active.map((s) => (
            <SourceRow key={s.id} source={s} canSetCadence={canSetCadence} />
          ))}
        </ul>
      )}

      {snoozed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-fog">Snoozed</h2>
          <ul className="space-y-3">
            {snoozed.map((s) => (
              <SourceRow key={s.id} source={s} canSetCadence={canSetCadence} />
            ))}
          </ul>
        </section>
      )}

      {!canSetCadence && list.length > 0 && (
        <p className="mt-8 text-[13px] text-fog">
          Per-source cadence (hourly checks for suppliers, weekly for permits) is part of the Pro plan.
        </p>
      )}
    </div>
  );
}
