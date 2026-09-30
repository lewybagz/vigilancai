"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import type { ChangeStatus } from "@/lib/types";

async function setStatus(changeId: string, status: ChangeStatus) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("changes")
    .update({ status, handled_at: status === "handled" ? new Date().toISOString() : null })
    .eq("id", changeId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/history");
}

export async function markHandled(changeId: string) {
  await setStatus(changeId, "handled");
}

export async function dismissChange(changeId: string) {
  await setStatus(changeId, "dismissed");
}

export async function reopenChange(changeId: string) {
  await setStatus(changeId, "published");
}

export async function approveChange(changeId: string) {
  // A needs_review change the owner has looked at becomes a published change.
  await setStatus(changeId, "published");
}
