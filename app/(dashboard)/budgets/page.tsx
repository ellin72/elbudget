"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, BarChart2, Loader2, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import { startOfMonth, endOfMonth, format } from "date-fns";

async function fetchBudgets() {
  const res = await fetch("/api/budgets");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function BudgetsPage() {
  const { currency } = useUIStore();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["budgets"], queryFn: fetchBudgets });
  const budgets = data?.data ?? [];

  const totalAllocated = budgets.flatMap((b: any) => b.items ?? []).reduce((s: number, i: any) => s + i.allocatedAmount, 0);
  const totalSpent = budgets.flatMap((b: any) => b.items ?? []).reduce((s: number, i: any) => s + i.spentAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Budgets</h2>
          <p className="text-sm text-muted-foreground">Plan and control your monthly spending</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-glow">
          <Plus className="w-4 h-4" /> New Budget
        </button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Total Allocated", value: formatCurrency(totalAllocated, currency as any), icon: ArrowDownLeft, color: "text-blue-600" },
            { label: "Total Spent", value: formatCurrency(totalSpent, currency as any), icon: ArrowUpRight, color: "text-orange-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BarChart2 className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground">No budgets yet. Create one to start controlling your spending.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Create Budget</button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget: any) => (
            <div key={budget.id} className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{budget.name}</h3>
                <span className="text-xs text-muted-foreground">{format(new Date(budget.startDate), "MMM d")} – {format(new Date(budget.endDate), "MMM d, yyyy")}</span>
              </div>
              <div className="space-y-3">
                {(budget.items ?? []).map((item: any) => {
                  const pct = item.allocatedAmount > 0 ? (item.spentAmount / item.allocatedAmount) * 100 : 0;
                  const over = pct > 100;
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.category?.name ?? "Uncategorized"}</span>
                        <span className={over ? "text-destructive font-medium" : ""}>
                          {formatCurrency(item.spentAmount, currency as any)} / {formatCurrency(item.allocatedAmount, currency as any)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-card rounded-3xl border border-border p-6 w-full max-w-md z-10">
            <h2 className="text-lg font-semibold mb-4">New Budget</h2>
            <div className="space-y-3">
              <input placeholder="Budget name (e.g. November Budget)" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border hover:bg-accent text-sm">Cancel</button>
                <button className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
