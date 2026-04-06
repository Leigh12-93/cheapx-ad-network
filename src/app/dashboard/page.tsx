"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  BarChart3,
  Eye,
  MousePointer,
  Users,
  DollarSign,
  Plus,
  Pause,
  Play,
  LogOut,
  Settings,
  TrendingUp,
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent, cn } from "@/lib/utils";

interface DashboardCampaign {
  id: string;
  vertical: string;
  vertical_slug?: string;
  vertical_name?: string;
  name: string;
  monthly_budget_cents?: number;
  bid_per_lead_cents?: number;
  spent_this_month_cents: number;
  service_areas?: string[];
  provider_name?: string;
  active: boolean;
  created_at: string;
}

const VERTICALS_MAP: Record<string, { name: string; color: string }> = {
  "skip-bins": { name: "Skip Bins", color: "bg-orange-100 text-orange-700" },
  electricians: { name: "Electricians", color: "bg-yellow-100 text-yellow-700" },
  plumbers: { name: "Plumbers", color: "bg-blue-100 text-blue-700" },
  cleaners: { name: "Cleaners", color: "bg-green-100 text-green-700" },
  locksmiths: { name: "Locksmiths", color: "bg-purple-100 text-purple-700" },
  removalists: { name: "Removalists", color: "bg-red-100 text-red-700" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <div>
          <p className="text-xs text-text-dim">{label}</p>
          <p className="text-xl font-bold text-text">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    active_campaigns: 0,
    total_impressions: 0,
    total_clicks: 0,
    total_leads: 0,
    total_spend: 0,
    ctr: 0,
    cost_per_lead: 0,
  });
  const [campaigns, setCampaigns] = useState<DashboardCampaign[]>([]);
  const [businessName, setBusinessName] = useState("Your Business");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        setStats(data.stats);
        setCampaigns(data.campaigns || []);
        setBusinessName(data.business_name || "Your Business");
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggleCampaign(id: string, newActive: boolean) {
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: newActive }),
    });
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: newActive } : c))
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="animate-pulse text-text-dim">Loading dashboard...</div>
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
            <span className="text-sm text-text-dim">{businessName}</span>
            <Link href="/dashboard/billing" className="text-text-dim hover:text-text">
              <DollarSign className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/settings" className="text-text-dim hover:text-text">
              <Settings className="h-4 w-4" />
            </Link>
            <Link href="/api/auth/logout" className="text-text-dim hover:text-text">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Eye}
            label="Impressions"
            value={formatNumber(stats.total_impressions)}
            subtitle="This month"
          />
          <StatCard
            icon={MousePointer}
            label="Clicks"
            value={formatNumber(stats.total_clicks)}
            subtitle={`${formatPercent(stats.ctr)} CTR`}
          />
          <StatCard
            icon={Users}
            label="Leads"
            value={formatNumber(stats.total_leads)}
            subtitle={stats.cost_per_lead > 0 ? `${formatCurrency(stats.cost_per_lead)}/lead` : "Free period"}
          />
          <StatCard
            icon={DollarSign}
            label="Spend"
            value={formatCurrency(stats.total_spend)}
            subtitle="This month"
          />
        </div>

        {/* Campaigns */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Your Campaigns</h2>
            <Link
              href="/dashboard/campaigns/new"
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
            >
              <Plus className="h-4 w-4" /> New Campaign
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="font-medium text-text">No campaigns yet</p>
              <p className="text-sm text-text-dim mt-1">
                Create your first campaign to start appearing in search results.
              </p>
              <Link
                href="/dashboard/campaigns/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
              >
                <Plus className="h-4 w-4" /> Create Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const v = VERTICALS_MAP[c.vertical_slug || c.vertical || ""] || {
                  name: c.vertical_name || "Unknown",
                  color: "bg-gray-100 text-gray-700",
                };
                const budgetDisplay = c.monthly_budget_cents
                  ? `${formatCurrency(c.monthly_budget_cents / 100)}/mo`
                  : `${formatCurrency((c.bid_per_lead_cents || 0) / 100)}/lead`;
                const spentDisplay = formatCurrency((c.spent_this_month_cents || 0) / 100);
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border bg-white p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          v.color
                        )}
                      >
                        {v.name}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text">
                          {budgetDisplay}
                        </p>
                        {c.provider_name && (
                          <p className="text-xs text-text-dim">{c.provider_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-success" />
                        <span className="text-sm font-medium text-text">
                          {spentDisplay}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          c.active
                            ? "bg-success-light text-success"
                            : "bg-warning-light text-warning"
                        )}
                      >
                        {c.active ? "active" : "paused"}
                      </span>
                      <button
                        onClick={() => toggleCampaign(c.id, !c.active)}
                        className="rounded-lg border border-border p-1.5 hover:bg-surface-hover transition-colors"
                      >
                        {c.active ? (
                          <Pause className="h-3.5 w-3.5 text-text-dim" />
                        ) : (
                          <Play className="h-3.5 w-3.5 text-text-dim" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
