import { requireUser } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/settings";
import { getPlanLimits } from "@/lib/plans";
import type { AlertRecipient, Profile, Subscription, UserSettings } from "@/lib/types";
import { BillingCard } from "@/components/app/BillingCard";
import { BusinessProfileForm, NotificationForm, RecipientsForm } from "@/components/app/SettingsForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: settings }, { data: recipients }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle<UserSettings>(),
    supabase.from("alert_recipients").select("*").eq("user_id", user.id).order("created_at").returns<AlertRecipient[]>(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle<Subscription>(),
  ]);
  const limits = getPlanLimits(sub?.plan ?? null, sub?.status ?? "none");

  return (
    <div>
      <header>
        <h1 className="text-[24px] font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-[16px] text-slate">How you are told. What gets watched lives under Sources.</p>
      </header>

      {billing === "success" && (
        <p className="mt-6 rounded-lg border border-hairline bg-surface px-4 py-3 text-[14px] text-ink">
          Payment received. Your plan updates within a minute once Stripe confirms it.
        </p>
      )}

      <div className="mt-10 space-y-12">
        <Section title="Critical alerts" blurb="Sent the moment a critical change is confirmed, to you and everyone below. Not subject to the briefing cadence.">
          <RecipientsForm recipients={recipients ?? []} ownerEmail={user.email ?? ""} maxRecipients={limits.maxRecipients} />
        </Section>

        <Section title="Briefing" blurb="When and what the regular briefing includes.">
          {settings && <NotificationForm settings={settings} />}
        </Section>

        <Section title="Business profile" blurb="Trade context shapes which recommended actions surface. The voice of the briefing is not adjustable.">
          {profile && <BusinessProfileForm profile={profile} />}
        </Section>

        <Section title="Account and billing">
          <BillingCard subscription={sub ?? null} />
          <form action={signOut} className="mt-4">
            <button type="submit" className="text-[14px] text-slate hover:text-ink">
              Sign out ({user.email})
            </button>
          </form>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, blurb, children }: { title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      {blurb && <p className="mt-1 max-w-prose text-[14px] text-slate">{blurb}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
