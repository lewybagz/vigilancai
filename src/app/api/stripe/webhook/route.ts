import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, tierForPrice } from "@/lib/stripe";

export const runtime = "nodejs";

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let userId = sub.metadata?.user_id as string | undefined;
  if (!userId) {
    const { data } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) return;

  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null;
  await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    plan: tierForPrice(item?.price?.id),
    status: sub.status,
    current_period_end: periodEnd,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `Invalid signature: ${e instanceof Error ? e.message : "unknown"}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id,
        );
        await upsertFromSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertFromSubscription(event.data.object);
      break;
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
