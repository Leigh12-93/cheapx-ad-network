import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const providerId = session.metadata?.provider_id;
    const amountCents = parseInt(session.metadata?.amount_cents || "0", 10);
    const type = session.metadata?.type;

    if (type === "balance_topup" && providerId && amountCents > 0) {
      const db = getSupabase();

      // Credit the provider's balance
      const { data: provider } = await db
        .from("ad_providers")
        .select("balance_cents")
        .eq("id", providerId)
        .single();

      if (provider) {
        const newBalance = (provider.balance_cents || 0) + amountCents;
        await db
          .from("ad_providers")
          .update({ balance_cents: newBalance })
          .eq("id", providerId);
      }

      // Record the billing event
      await db.from("ad_billing").insert({
        provider_id: providerId,
        stripe_payment_intent: session.payment_intent,
        amount: amountCents / 100,
        currency: "AUD",
        status: "paid",
        billing_period_start: new Date().toISOString().slice(0, 10),
        billing_period_end: new Date().toISOString().slice(0, 10),
      });
    }
  }

  return NextResponse.json({ received: true });
}
