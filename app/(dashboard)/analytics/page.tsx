"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency, CHART_COLORS } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
} from "lucide-react";

interface ReportData {
  monthlySummary: {
    month: string;
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    transactionCount: number;
  }[];
  spendingByCategory: {
    id: string;
    name: string;
    color: string;
    total: number;
    count: number;
  }[];
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  avgMonthlySavingsRate: number;
  transactionCount: number;
}

const PERIODS = [
  { label: "3 Months", value: "3" },
  { label: "6 Months", value: "6" },
  { label: "12 Months", value: "12" },
];

const DOT_COLOR_CLASSES = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
];

export default function AnalyticsPage() {
  const { currency } = useUIStore();
  const [months, setMonths] = useState("6");

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["reports", months],
    queryFn: async () => {
      const res = await fetch(`/api/reports?months=${months}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summary = data?.monthlySummary ?? [];
  const categories = data?.spendingByCategory ?? [];
  const topCategories = [...categories]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const avgSavingsRate = data?.avgMonthlySavingsRate ?? 0;
  const expenseRatio = data?.totalIncome
    ? (data.totalExpenses / data.totalIncome) * 100
    : 0;

  // Cash flow = income - expenses per month
  const cashFlowData = summary.map((m) => ({
    month: m.month,
    cashFlow: m.savings,
    positive: m.savings >= 0,
  }));

  // Savings rate trend
  const savingsRateTrend = summary.map((m) => ({
    month: m.month,
    rate: parseFloat(m.savingsRate.toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Deep dive into your financial patterns
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setMonths(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                months === value
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Avg Savings Rate",
            value: `${avgSavingsRate.toFixed(1)}%`,
            icon: Percent,
            color:
              avgSavingsRate >= 20
                ? "text-green-600"
                : avgSavingsRate >= 10
                  ? "text-yellow-600"
                  : "text-destructive",
            note:
              avgSavingsRate >= 20
                ? "Excellent"
                : avgSavingsRate >= 10
                  ? "Good"
                  : "Needs work",
          },
          {
            label: "Expense Ratio",
            value: `${expenseRatio.toFixed(1)}%`,
            icon: Activity,
            color:
              expenseRatio <= 70
                ? "text-green-600"
                : expenseRatio <= 90
                  ? "text-yellow-600"
                  : "text-destructive",
            note:
              expenseRatio <= 70
                ? "Healthy"
                : expenseRatio <= 90
                  ? "Watch out"
                  : "Overspending",
          },
          {
            label: "Total Income",
            value: formatCurrency(data?.totalIncome ?? 0, currency as any),
            icon: TrendingUp,
            color: "text-green-600",
            note: `${months}mo period`,
          },
          {
            label: "Total Savings",
            value: formatCurrency(data?.totalSavings ?? 0, currency as any),
            icon: TrendingDown,
            color:
              (data?.totalSavings ?? 0) >= 0
                ? "text-blue-600"
                : "text-destructive",
            note:
              (data?.totalSavings ?? 0) >= 0 ? "Net positive" : "Net negative",
          },
        ].map(({ label, value, icon: Icon, color, note }) => (
          <div
            key={label}
            className="bg-card rounded-2xl border border-border p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className={`text-xs font-medium ${color}`}>{note}</p>
          </div>
        ))}
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-4">Monthly Cash Flow</h3>
        {cashFlowData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            No data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={cashFlowData}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="cashFlowGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => formatCurrency(v, currency as any)}
                width={70}
              />
              <Tooltip
                formatter={(v: number) => [
                  formatCurrency(v, currency as any),
                  "Cash Flow",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Area
                type="monotone"
                dataKey="cashFlow"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#cashFlowGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Savings Rate Trend */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4">Savings Rate Trend (%)</h3>
          {savingsRateTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={savingsRateTrend}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Savings Rate"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Spending Categories */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4">Top Spending Categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No expense data
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={topCategories}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                  >
                    {topCategories.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.color || CHART_COLORS[i % CHART_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [
                      formatCurrency(v, currency as any),
                      "Spent",
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {topCategories.map((cat, i) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLOR_CLASSES[i % DOT_COLOR_CLASSES.length]}`} />
                      <span className="text-muted-foreground truncate max-w-[120px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(cat.total, currency as any)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
        {summary.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            No data available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Month",
                    "Income",
                    "Expenses",
                    "Savings",
                    "Savings Rate",
                    "Transactions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr
                    key={row.month}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium">{row.month}</td>
                    <td className="py-2.5 px-3 text-green-600">
                      {formatCurrency(row.income, currency as any)}
                    </td>
                    <td className="py-2.5 px-3 text-destructive">
                      {formatCurrency(row.expenses, currency as any)}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-medium ${row.savings >= 0 ? "text-blue-600" : "text-destructive"}`}
                    >
                      {formatCurrency(row.savings, currency as any)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.savingsRate >= 20
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : row.savingsRate >= 10
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {row.savingsRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {row.transactionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
