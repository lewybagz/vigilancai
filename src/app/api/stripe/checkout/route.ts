import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, priceIdFor } from "@/lib/stripe";
import { SITE } from "@/lib/site";
import type { PlanTier } from "@/lib/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let tier: PlanTier = "pro";
  try {
    const body = (await req.json()) as { tier?: PlanTier };
    if (body.tier === "starter" || body.tier === "pro") tier = body.tier;
  } catch {
    // default tier
  }

  try {
    const stripe = getStripe();
    const admin = createAdminClient();
    const { data: sub } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();

    let customerId = sub?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
      customerId = customer.id;
      await admin.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customerId, updated_at: new Date().toISOString() });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdFor(tier), quantity: 1 }],
      success_url: `${SITE.url}/app/settings?billing=success`,
      cancel_url: `${SITE.url}/app/settings`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { user_id: user.id } },
      client_reference_id: user.id,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 500 });
  }
}
