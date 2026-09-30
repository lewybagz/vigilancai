"use client";

import { useState, useTransition } from "react";
import { addSource } from "@/lib/actions/sources";
import type { SourceCadence, SourceKind } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function AddSourceForm({ remaining }: { remaining: number }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", url: "", kind: "jurisdiction" as SourceKind, cadence: "daily" as SourceCadence });

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] text-fog">
          {remaining > 0 ? `${remaining} more source${remaining === 1 ? "" : "s"} on your plan` : "Source limit reached for your plan"}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} disabled={remaining <= 0}>
          Add a source
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-[var(--radius-card)] border border-hairline bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await addSource(form);
            toast(`${form.name} added. First check runs within the hour.`);
            setForm({ name: "", url: "", kind: "jurisdiction", cadence: "daily" });
            setOpen(false);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not add source");
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="src-name">Name</Label>
          <Input id="src-name" className="mt-1" placeholder="Pima County" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="src-url" hint="The exact page with the fee schedule, price list, or bulletin.">Page URL</Label>
          <Input id="src-url" className="mt-1" type="url" placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="src-kind">Type</Label>
          <Select id="src-kind" className="mt-1" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as SourceKind })}>
            <option value="jurisdiction">Jurisdiction (city, county)</option>
            <option value="supplier">Supplier / distributor</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="licensing">Licensing board</option>
            <option value="code">Building code</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="src-cadence">Check</Label>
          <Select id="src-cadence" className="mt-1" value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value as SourceCadence })}>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Start watching"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
