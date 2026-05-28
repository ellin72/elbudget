"use client";

import { TrendingDown, TrendingUp, Wallet, Target } from "lucide-react";
import type { DashboardStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: DashboardStats;
  currency?: string;
}

const cards = [
  {
    key: "totalBalance" as const,
    label: "Total Balance",
    icon: Wallet,
    gradient: "from-brand-500 to-purple-600",
    changeKey: null,
    positive: true,
  },
  {
    key: "monthlyIncome" as const,
    label: "Monthly Income",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-600",
    changeKey: "incomeChange" as const,
    positive: true,
  },
  {
    key: "monthlyExpenses" as const,
    label: "Monthly Expenses",
    icon: TrendingDown,
    gradient: "from-orange-500 to-red-500",
    changeKey: "expensesChange" as const,
    positive: false,
  },
  {
    key: "monthlySavings" as const,
    label: "Monthly Savings",
    icon: Target,
    gradient: "from-blue-500 to-cyan-600",
    changeKey: "savingsRate" as const,
    positive: true,
  },
];

export default function StatsCards({ stats, currency = "NAD" }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, gradient, changeKey, positive }) => {
        const value = stats[key] ?? 0;
        const change = changeKey ? (stats as any)[changeKey] : null;
        const isPositive = change !== null ? (positive ? change >= 0 : change <= 0) : true;

        return (
          <div key={key} className="stat-card group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={cn("w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform", gradient)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(value, currency as any)}
            </p>
            {change !== null && (
              <p className={cn("text-xs font-medium mt-1.5 flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change).toFixed(1)}% vs last month
              </p>
            )}
            {key === "monthlySavings" && change !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {change.toFixed(1)}% savings rate
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
