import "server-only";

import Stripe from "stripe";
import type { PlanTier } from "./types";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!cached) cached = new Stripe(key);
  return cached;
}

export function priceIdFor(tier: PlanTier): string {
  const id = tier === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_STARTER;
  if (!id) throw new Error(`Stripe price for ${tier} is not configured`);
  return id;
}

export function tierForPrice(priceId: string | undefined): PlanTier | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  return null;
}
