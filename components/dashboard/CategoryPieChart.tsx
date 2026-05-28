"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SpendingByCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/utils";

interface Props {
  data: SpendingByCategory[];
  currency?: string;
}

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-card text-sm">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">{formatCurrency(d.value, currency)}</p>
      <p className="text-xs text-muted-foreground">{d.payload.percentage?.toFixed(1)}%</p>
    </div>
  );
};

export default function CategoryPieChart({ data, currency = "NAD" }: Props) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-semibold mb-4">Spending by Category</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No spending data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(v) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
