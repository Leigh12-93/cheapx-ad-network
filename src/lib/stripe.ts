import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = (process.env.STRIPE_SECRET_KEY || "").trim();
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Pre-defined top-up amounts in AUD cents
export const TOP_UP_AMOUNTS = [
  { cents: 5000, label: "$50" },
  { cents: 10000, label: "$100" },
  { cents: 25000, label: "$250" },
  { cents: 50000, label: "$500" },
] as const;
