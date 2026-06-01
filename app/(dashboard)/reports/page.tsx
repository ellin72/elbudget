"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { useUIStore } from "@/store/useUIStore";
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

const REPORT_COLOR_CLASSES = [
  "bg-emerald-500",
  "bg-rose-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
  "bg-orange-500",
  "bg-slate-500",
];

export default function ReportsPage() {
  const { currency } = useUIStore();
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

  function exportPDF() {
    if (!data) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const generatedAt = new Date();
    const periodLabel = PERIODS.find((period) => period.value === months)?.label ?? `${months} Months`;

    doc.setFontSize(20);
    doc.text("Elbudget Financial Report", 40, 48);
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Period: ${periodLabel}`, 40, 68);
    doc.text(`Generated: ${generatedAt.toLocaleString()}`, 40, 82);

    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text("Summary", 40, 112);

    autoTable(doc, {
      startY: 122,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Income", formatCurrency(data.totalIncome, currency as any)],
        ["Total Expenses", formatCurrency(data.totalExpenses, currency as any)],
        ["Net Savings", formatCurrency(data.totalSavings, currency as any)],
        ["Average Savings Rate", `${data.avgMonthlySavingsRate.toFixed(1)}%`],
        ["Transactions", String(data.transactionCount)],
      ],
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ? ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 24 : 260,
      theme: "striped",
      head: [["Month", "Income", "Expenses", "Savings", "Savings Rate", "Transactions"]],
      body: data.monthlySummary.map((month) => [
        month.month,
        formatCurrency(month.income, currency as any),
        formatCurrency(month.expenses, currency as any),
        formatCurrency(month.savings, currency as any),
        `${month.savingsRate.toFixed(1)}%`,
        String(month.transactionCount),
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    autoTable(doc, {
      startY: ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0) + 24,
      theme: "striped",
      head: [["Category", "Amount", "% of Expenses", "Transactions"]],
      body: data.spendingByCategory.slice(0, 10).map((category) => [
        category.name,
        formatCurrency(category.total, currency as any),
        `${data.totalExpenses > 0 ? ((category.total / data.totalExpenses) * 100).toFixed(1) : "0.0"}%`,
        String(category.count),
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [239, 68, 68] },
    });

    doc.save(`elbudget-report-${months}months.pdf`);
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
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Income"
          value={formatCurrency(data?.totalIncome ?? 0, currency as any)}
          icon={<TrendingUpIcon className="w-5 h-5 text-green-600" />}
          color="green"
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(data?.totalExpenses ?? 0, currency as any)}
          icon={<TrendingDownIcon className="w-5 h-5 text-red-500" />}
          color="red"
        />
        <SummaryCard
          label="Net Savings"
          value={formatCurrency(data?.totalSavings ?? 0, currency as any)}
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
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency as any)} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency as any)} />
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
              <Tooltip formatter={(v: number) => formatCurrency(v, currency as any)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {totalPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    d.name === "Income"
                      ? "bg-emerald-500"
                      : d.name === "Expenses"
                        ? "bg-rose-500"
                        : "bg-blue-500"
                  }`} />
                  <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(d.value, currency as any)}
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
              const progressValue = Math.min(Math.max(pct, 0), 100);
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length]}`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-xs text-gray-400">({cat.count} txns)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(cat.total, currency as any)}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <progress
                      value={progressValue}
                      max={100}
                      className={`w-full h-2 [appearance:none] [&::-webkit-progress-bar]:bg-gray-100 dark:[&::-webkit-progress-bar]:bg-gray-700 ${
                        REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("emerald")
                          ? "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500"
                          : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("rose")
                            ? "[&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500"
                            : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("blue")
                              ? "[&::-webkit-progress-value]:bg-blue-500 [&::-moz-progress-bar]:bg-blue-500"
                              : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("violet")
                                ? "[&::-webkit-progress-value]:bg-violet-500 [&::-moz-progress-bar]:bg-violet-500"
                                : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("amber")
                                  ? "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500"
                                  : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("cyan")
                                    ? "[&::-webkit-progress-value]:bg-cyan-500 [&::-moz-progress-bar]:bg-cyan-500"
                                    : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("fuchsia")
                                      ? "[&::-webkit-progress-value]:bg-fuchsia-500 [&::-moz-progress-bar]:bg-fuchsia-500"
                                      : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("lime")
                                        ? "[&::-webkit-progress-value]:bg-lime-500 [&::-moz-progress-bar]:bg-lime-500"
                                        : REPORT_COLOR_CLASSES[data.spendingByCategory.indexOf(cat) % REPORT_COLOR_CLASSES.length].includes("orange")
                                          ? "[&::-webkit-progress-value]:bg-orange-500 [&::-moz-progress-bar]:bg-orange-500"
                                          : "[&::-webkit-progress-value]:bg-slate-500 [&::-moz-progress-bar]:bg-slate-500"
                      }`}
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
