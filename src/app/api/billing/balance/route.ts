import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const accountId = await getSession();
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();

  const { data: provider } = await db
    .from("ad_providers")
    .select("balance_cents, total_spent_cents")
    .eq("id", accountId)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Get recent billing history
  const { data: history } = await db
    .from("ad_billing")
    .select("*")
    .eq("provider_id", accountId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    balance_cents: provider.balance_cents || 0,
    total_spent_cents: provider.total_spent_cents || 0,
    history: history || [],
  });
}
