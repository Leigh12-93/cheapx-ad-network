"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  CreditCard,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface BillingRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

const TOP_UP_OPTIONS = [
  { cents: 5000, label: "$50" },
  { cents: 10000, label: "$100" },
  { cents: 25000, label: "$250" },
  { cents: 50000, label: "$500" },
];

export default function BillingPage() {
  const [balanceCents, setBalanceCents] = useState(0);
  const [totalSpentCents, setTotalSpentCents] = useState(0);
  const [history, setHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  // Check for success/cancelled query params
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "1") setShowSuccess(true);
      if (params.get("cancelled") === "1") setShowCancelled(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/billing/balance");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        setBalanceCents(data.balance_cents || 0);
        setTotalSpentCents(data.total_spent_cents || 0);
        setHistory(data.history || []);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleTopUp(amountCents: number) {
    setCheckoutLoading(amountCents);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: amountCents }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Handle error
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="animate-pulse text-text-dim">Loading billing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dim">
      {/* Top nav */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand" />
            <span className="font-bold text-text">
              Cheap<span className="text-brand">X</span> Ad Network
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings" className="text-text-dim hover:text-text">
              <Settings className="h-4 w-4" />
            </Link>
            <Link href="/api/auth/logout" className="text-text-dim hover:text-text">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-text mb-6">Billing & Balance</h1>

        {/* Status banners */}
        {showSuccess && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              Payment successful! Your balance has been topped up.
            </p>
          </div>
        )}
        {showCancelled && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">
              Payment cancelled. No charge was made.
            </p>
          </div>
        )}

        {/* Balance card */}
        <div className="rounded-xl border border-border bg-white p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light">
              <DollarSign className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm text-text-dim">Current Balance</p>
              <p className="text-3xl font-bold text-text">
                {formatCurrency(balanceCents / 100)}
              </p>
            </div>
          </div>
          <p className="text-sm text-text-dim">
            Total spent: {formatCurrency(totalSpentCents / 100)}
          </p>
        </div>

        {/* Top-up options */}
        <div className="rounded-xl border border-border bg-white p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand" />
            Top Up Balance
          </h2>
          <p className="text-sm text-text-dim mb-4">
            Add funds to your advertising balance. Funds are used automatically
            as your campaigns generate leads and impressions.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TOP_UP_OPTIONS.map((opt) => (
              <button
                key={opt.cents}
                onClick={() => handleTopUp(opt.cents)}
                disabled={checkoutLoading !== null}
                className={cn(
                  "rounded-xl border-2 border-border p-4 text-center transition-all",
                  "hover:border-brand hover:bg-brand-light",
                  checkoutLoading === opt.cents && "opacity-50"
                )}
              >
                {checkoutLoading === opt.cents ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-text">{opt.label}</p>
                    <p className="text-xs text-text-dim mt-1">AUD</p>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payment history */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Payment History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-text-dim">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      Balance top-up
                    </p>
                    <p className="text-xs text-text-dim">
                      {new Date(record.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">
                      +{formatCurrency(record.amount)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        record.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : record.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {record.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
