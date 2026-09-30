"use client";

import { useState, useTransition } from "react";
import { addRecipient, removeRecipient, updateProfile, updateSettings } from "@/lib/actions/settings";
import type { AlertRecipient, BriefingCadence, Profile, SeverityThreshold, Trade, UserSettings } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Label, Segmented, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const TIMEZONES = [
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export function NotificationForm({ settings }: { settings: UserSettings }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const [form, setForm] = useState({
    cadence: settings.cadence,
    delivery_time: settings.delivery_time.slice(0, 5),
    timezone: settings.timezone,
    threshold: settings.threshold,
    in_app_history_sync: settings.in_app_history_sync,
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await updateSettings(form);
            toast("Notification settings saved");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not save");
          }
        });
      }}
    >
      <div>
        <Label hint="How often the briefing email lands. Critical alerts always go out immediately, regardless.">Briefing cadence</Label>
        <div className="mt-2">
          <Segmented<BriefingCadence>
            ariaLabel="Briefing cadence"
            value={form.cadence}
            onChange={(v) => setForm({ ...form, cadence: v })}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="delivery-time">Delivery time</Label>
          <Input
            id="delivery-time"
            type="time"
            className="mt-1"
            value={form.delivery_time}
            onChange={(e) => setForm({ ...form, delivery_time: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="tz">Time zone</Label>
          <Select id="tz" className="mt-1" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace("America/", "").replace("Pacific/", "").replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label hint="A filter on what gets sent, not a change to how it is written.">Include in the briefing</Label>
        <div className="mt-2">
          <Segmented<SeverityThreshold>
            ariaLabel="Severity threshold"
            value={form.threshold}
            onChange={(v) => setForm({ ...form, threshold: v })}
            options={[
              { value: "critical", label: "Critical only" },
              { value: "critical_high", label: "Critical + High" },
              { value: "all", label: "Everything" },
            ]}
          />
        </div>
      </div>

      <div>
        <Label>Delivery channel</Label>
        <p className="mt-1 text-[14px] text-slate">
          Email. Text and push arrive once they exist; there is nothing to toggle yet.
        </p>
      </div>

      <details className="rounded-lg border border-hairline bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-[14px] font-medium text-slate">Advanced</summary>
        <div className="border-t border-hairline px-4 py-3">
          <label className="flex items-start gap-3 text-[14px] text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.in_app_history_sync}
              onChange={(e) => setForm({ ...form, in_app_history_sync: e.target.checked })}
            />
            <span>
              Keep in-app History in sync with the email digest
              <span className="block text-[13px] text-fog">Off means History shows every change, even ones below your threshold.</span>
            </span>
          </label>
        </div>
      </details>

      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

export function BusinessProfileForm({ profile }: { profile: Profile }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: profile.first_name ?? "",
    business_name: profile.business_name ?? "",
    trade: profile.trade,
    service_area: profile.service_area ?? "",
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await updateProfile(form);
            toast("Business profile saved");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not save");
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="first-name" hint="Used in your greeting.">First name</Label>
          <Input id="first-name" className="mt-1" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="biz">Business name</Label>
          <Input id="biz" className="mt-1" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="trade" hint="Changes which recommended actions get surfaced, not how they are written.">Trade</Label>
          <Select id="trade" className="mt-1" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value as Trade })}>
            <option value="roofing">Roofing</option>
            <option value="hvac">HVAC</option>
            <option value="gc">General contractor</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="area">Primary service area</Label>
          <Input id="area" className="mt-1" placeholder="Tucson, AZ" value={form.service_area} onChange={(e) => setForm({ ...form, service_area: e.target.value })} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

export function RecipientsForm({
  recipients,
  ownerEmail,
  maxRecipients,
}: {
  recipients: AlertRecipient[];
  ownerEmail: string;
  maxRecipients: number;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const full = recipients.length >= maxRecipients;

  return (
    <div>
      <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface">
        <li className="flex items-center justify-between px-4 py-2.5 text-[14px]">
          <span className="text-ink">{ownerEmail}</span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-fog">You</span>
        </li>
        {recipients.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-4 py-2.5 text-[14px]">
            <span className="text-ink">
              {r.email}
              {r.name && <span className="ml-2 text-fog">{r.name}</span>}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await removeRecipient(r.id);
                    toast("Removed");
                  } catch (err) {
                    toast(err instanceof Error ? err.message : "Could not remove");
                  }
                })
              }
              className="text-[13px] text-fog hover:text-critical"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              await addRecipient(email, name);
              setEmail("");
              setName("");
              toast("Recipient added");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Could not add");
            }
          });
        }}
      >
        <Input type="email" placeholder="crew@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={full} aria-label="Recipient email" />
        <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} disabled={full} className="sm:max-w-[180px]" aria-label="Recipient name" />
        <Button type="submit" variant="secondary" disabled={pending || full}>Add</Button>
      </form>
      {full && <p className="mt-2 text-[13px] text-fog">Your plan allows {maxRecipients} crew recipient{maxRecipients === 1 ? "" : "s"}. Upgrade to add more.</p>}
    </div>
  );
}
