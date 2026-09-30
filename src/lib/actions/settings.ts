"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { BriefingCadence, SeverityThreshold, Trade } from "@/lib/types";

export async function updateSettings(input: {
  cadence: BriefingCadence;
  delivery_time: string;
  timezone: string;
  threshold: SeverityThreshold;
  in_app_history_sync: boolean;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...input, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings");
}

export async function updateProfile(input: {
  first_name: string;
  business_name: string;
  trade: Trade;
  service_area: string;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.first_name.trim() || null,
      business_name: input.business_name.trim() || null,
      trade: input.trade,
      service_area: input.service_area.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/settings");
}

export async function addRecipient(email: string, name?: string) {
  const { supabase, user } = await requireUser();
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error("Enter a valid email address");
  const { error } = await supabase
    .from("alert_recipients")
    .insert({ user_id: user.id, email: clean, name: name?.trim() || null });
  if (error) throw new Error(error.code === "23505" ? "That address is already on the list" : error.message);
  revalidatePath("/app/settings");
}

export async function removeRecipient(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("alert_recipients").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
