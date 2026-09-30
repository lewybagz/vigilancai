import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { SITE } from "@/lib/site";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return NextResponse.json({ error: "No billing account yet" }, { status: 400 });

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${SITE.url}/app/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Portal failed" }, { status: 500 });
  }
}
