
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS. Only for trusted server code:
 * the pipeline, Stripe webhooks, and the seed script. Never import from a component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required");
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
