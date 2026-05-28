"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import StatsCards from "@/components/dashboard/StatsCards";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SavingsProgress from "@/components/dashboard/SavingsProgress";
import AIInsightsWidget from "@/components/dashboard/AIInsightsWidget";
import type { DashboardData } from "@/types";

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  const json = await res.json();
  return json.data;
}

export default function DashboardPage() {
  const { setTransactionModalOpen, currency } = useUIStore();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Failed to load dashboard.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Here&apos;s your financial snapshot</p>
        </div>
        <button
          onClick={() => setTransactionModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-glow"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Stats Row */}
      <StatsCards stats={data!.stats} currency={currency} />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <IncomeExpenseChart data={data!.monthlyTrends} currency={currency} />
        <CategoryPieChart data={data!.spendingByCategory} currency={currency} />
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={data!.recentTransactions} currency={currency} />
        </div>
        <div className="space-y-6">
          <SavingsProgress goals={data!.activeGoals} currency={currency} />
          <AIInsightsWidget insights={data!.aiInsights} />
        </div>
      </div>
    </div>
  );
}
