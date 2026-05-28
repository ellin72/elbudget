"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency, CHART_COLORS } from "@/lib/utils";
import { DownloadIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, BarChart2Icon } from "lucide-react";

interface ReportData {
  monthlySummary: {
    month: string;
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    transactionCount: number;
  }[];
  spendingByCategory: { id: string; name: string; color: string; total: number; count: number }[];
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

export default function ReportsPage() {
  const [months, setMonths] = useState("6");

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["reports", months],
    queryFn: () => fetch(`/api/reports?months=${months}`).then((r) => r.json()),
  });

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Month", "Income", "Expenses", "Savings", "Savings Rate", "Transactions"],
      ...data.monthlySummary.map((m) => [
        m.month,
        m.income.toFixed(2),
        m.expenses.toFixed(2),
        m.savings.toFixed(2),
        m.savingsRate.toFixed(1) + "%",
        m.transactionCount,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elbudget-report-${months}months.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const totalPieData = data
    ? [
        { name: "Income", value: data.totalIncome, color: "#22c55e" },
        { name: "Expenses", value: data.totalExpenses, color: "#ef4444" },
        { name: "Savings", value: Math.max(0, data.totalSavings), color: "#3b82f6" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyze your spending and saving patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setMonths(p.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  months === p.value
                    ? "bg-brand-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Income"
          value={formatCurrency(data?.totalIncome ?? 0)}
          icon={<TrendingUpIcon className="w-5 h-5 text-green-600" />}
          color="green"
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(data?.totalExpenses ?? 0)}
          icon={<TrendingDownIcon className="w-5 h-5 text-red-500" />}
          color="red"
        />
        <SummaryCard
          label="Net Savings"
          value={formatCurrency(data?.totalSavings ?? 0)}
          icon={<DollarSignIcon className="w-5 h-5 text-brand-600" />}
          color="blue"
        />
        <SummaryCard
          label="Avg Savings Rate"
          value={`${(data?.avgMonthlySavingsRate ?? 0).toFixed(1)}%`}
          icon={<BarChart2Icon className="w-5 h-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expenses
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.monthlySummary} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overview pie */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overview</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={totalPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
              >
                {totalPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {totalPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(d.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Savings rate trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Savings Rate Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data?.monthlySummary}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Line
              type="monotone"
              dataKey="savingsRate"
              name="Savings Rate"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by Category */}
      {data && data.spendingByCategory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h2>
          <div className="space-y-3">
            {data.spendingByCategory.slice(0, 10).map((cat) => {
              const pct =
                data.totalExpenses > 0 ? (cat.total / data.totalExpenses) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-xs text-gray-400">({cat.count} txns)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(cat.total)}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-900/20",
    red: "bg-red-50 dark:bg-red-900/20",
    blue: "bg-blue-50 dark:bg-blue-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${bgMap[color]}`}>{icon}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
