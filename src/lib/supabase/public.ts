import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Anonymous client for public guide pages. Safe to use in static generation. */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
