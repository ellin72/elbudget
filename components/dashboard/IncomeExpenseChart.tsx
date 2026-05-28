"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlyTrend, Currency } from "@/types";
import { formatCompactCurrency } from "@/lib/utils";

interface Props {
  data: MonthlyTrend[];
  currency?: Currency;
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-card text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-medium tabular-nums">{formatCompactCurrency(p.value, currency)}</span>
        </p>
      ))}
    </div>
  );
};

export default function IncomeExpenseChart({ data, currency = "NAD" }: Props) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-semibold mb-4">Income vs Expenses</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No data yet. Start tracking transactions!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => formatCompactCurrency(v, currency)}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              formatter={(v) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{v}</span>}
            />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
