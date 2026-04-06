import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const accountId = await getSession();
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount_cents } = await req.json();

    if (!amount_cents || amount_cents < 500 || amount_cents > 100000) {
      return NextResponse.json(
        { error: "Amount must be between $5 and $1,000" },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const stripe = getStripe();

    // Get provider details
    const { data: provider } = await db
      .from("ad_providers")
      .select("id, email, business_name, stripe_customer_id")
      .eq("id", accountId)
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Create or reuse Stripe customer
    let customerId = provider.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: provider.email,
        name: provider.business_name,
        metadata: { provider_id: provider.id },
      });
      customerId = customer.id;

      await db
        .from("ad_providers")
        .update({ stripe_customer_id: customerId })
        .eq("id", provider.id);
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://cheapadsnearme.com.au").trim();

    // Create Stripe Checkout session for balance top-up
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aud",
            unit_amount: amount_cents,
            product_data: {
              name: "CheapX Ad Network — Balance Top-Up",
              description: `Add ${(amount_cents / 100).toFixed(2)} AUD to your advertising balance`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        provider_id: provider.id,
        type: "balance_topup",
        amount_cents: String(amount_cents),
      },
      success_url: `${siteUrl}/dashboard/billing?success=1`,
      cancel_url: `${siteUrl}/dashboard/billing?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
