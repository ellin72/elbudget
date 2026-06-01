"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, BarChart2, Loader2, TrendingUp, ArrowDownLeft, ArrowUpRight, Trash2, Pencil } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { formatCurrency } from "@/lib/utils";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import { startOfMonth, endOfMonth, format } from "date-fns";

async function fetchBudgets() {
  const res = await fetch("/api/budgets");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function fetchCategories() {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function BudgetsPage() {
  const { currency } = useUIStore();
  const [showForm, setShowForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["budgets"], queryFn: fetchBudgets });
  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, enabled: showForm });
  const budgets = data?.data ?? [];
  const categories = catData?.data ?? [];
  const recurringMonthlyTotal = data?.recurringMonthlyTotal ?? 0;
  const recurringMonthlyIncomeTotal = data?.recurringMonthlyIncomeTotal ?? 0;

  const totalAllocated = budgets.flatMap((b: any) => b.items ?? []).reduce((s: number, i: any) => s + i.allocatedAmount, 0);
  const totalSpent = budgets.flatMap((b: any) => b.items ?? []).reduce((s: number, i: any) => s + i.spentAmount, 0);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      period: "MONTHLY",
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      style: "CUSTOM",
      items: [{ name: "", categoryId: null, allocatedAmount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const openCreateModal = () => {
    setEditingBudgetId(null);
    reset({
      name: "",
      period: "MONTHLY",
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      style: "CUSTOM",
      items: [{ name: "", categoryId: null, allocatedAmount: 0 }],
    });
    setShowForm(true);
  };

  const openEditModal = (budget: any) => {
    setEditingBudgetId(budget.id);
    reset({
      name: budget.name,
      period: budget.period,
      startDate: format(new Date(budget.startDate), "yyyy-MM-dd"),
      style: budget.style,
      items: (budget.items ?? []).length > 0
        ? budget.items
          .filter((item: any) => !item.isRecurring)
          .map((item: any) => ({
            name: item.name,
            categoryId: item.categoryId ?? null,
            allocatedAmount: Number(item.allocatedAmount),
          }))
        : [{ name: "", categoryId: null, allocatedAmount: 0 }],
    });
    setShowForm(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: BudgetInput) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create budget");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Budget created successfully");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setShowForm(false);
      reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BudgetInput) => {
      if (!editingBudgetId) throw new Error("No budget selected");
      const res = await fetch(`/api/budgets/${editingBudgetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update budget");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Budget updated successfully");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setShowForm(false);
      setEditingBudgetId(null);
      reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Budgets</h2>
          <p className="text-sm text-muted-foreground">Plan and control your monthly spending</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-glow">
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
          <button onClick={openCreateModal} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Create Budget</button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget: any) => (
            <div key={budget.id} className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{budget.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(budget.startDate), "MMM d")} – {budget.endDate ? format(new Date(budget.endDate), "MMM d, yyyy") : "Ongoing"}
                  </span>
                </div>
                <button
                  onClick={() => openEditModal(budget)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="space-y-3">
                {(budget.items ?? []).map((item: any) => {
                  const pct = item.allocatedAmount > 0 ? (item.spentAmount / item.allocatedAmount) * 100 : 0;
                  const over = pct > 100;
                  const itemLabel = item.isRecurring
                    ? item.name
                    : item.category?.name ?? item.name ?? "Uncategorized";
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground inline-flex items-center gap-1.5">
                          {itemLabel}
                          {item.isRecurring && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/20 text-primary">
                              Recurring
                            </span>
                          )}
                        </span>
                        <span className={over ? "text-destructive font-medium" : ""}>
                          {formatCurrency(item.spentAmount, currency as any)} / {formatCurrency(item.allocatedAmount, currency as any)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <progress
                          value={Math.min(pct, 100)}
                          max={100}
                          className={`w-full h-1.5 [appearance:none] [&::-webkit-progress-bar]:bg-muted ${
                            over
                              ? "[&::-webkit-progress-value]:bg-destructive [&::-moz-progress-bar]:bg-destructive"
                              : "[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                          }`}
                        />
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
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowForm(false); setEditingBudgetId(null); reset(); }} />
          <div className="relative bg-card rounded-3xl border border-border p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingBudgetId ? "Edit Budget" : "New Budget"}</h2>
            <form onSubmit={handleSubmit((d) => editingBudgetId ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Budget Name</label>
                <input {...register("name")} placeholder="e.g. November Budget"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Period</label>
                  <select {...register("period")} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Style</label>
                  <select {...register("style")} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="CUSTOM">Custom</option>
                    <option value="ZERO_BASED">Zero-Based</option>
                    <option value="RULE_50_30_20">50/30/20 Rule</option>
                    <option value="ENVELOPE">Envelope</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Start Date</label>
                <input {...register("startDate")} type="date"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Budget Items</label>
                  <button type="button" onClick={() => append({ name: "", categoryId: null, allocatedAmount: 0 })}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                {errors.items && <p className="text-xs text-destructive">Add at least one budget item</p>}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                    <div>
                      <input {...register(`items.${index}.name`)} placeholder="Item name"
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      {errors.items?.[index]?.name && <p className="text-xs text-destructive mt-0.5">{errors.items[index]?.name?.message}</p>}
                    </div>
                    <div>
                      <select
                        {...register(`items.${index}.categoryId`)}
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input {...register(`items.${index}.allocatedAmount`)} type="number" min="0" step="0.01" placeholder="Amount"
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      {errors.items?.[index]?.allocatedAmount && <p className="text-xs text-destructive mt-0.5">Required</p>}
                    </div>
                    <button type="button" onClick={() => remove(index)} disabled={fields.length === 1}
                      aria-label="Remove item"
                      className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingBudgetId(null); reset(); }}
                  className="flex-1 py-3 rounded-xl border border-border hover:bg-accent text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingBudgetId ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recurringMonthlyTotal > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          Fixed recurring services are automatically included in your monthly budget: {formatCurrency(recurringMonthlyTotal, currency as any)}
        </div>
      )}

      {recurringMonthlyIncomeTotal > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400">
          Recurring income is automatically included in monthly planning: {formatCurrency(recurringMonthlyIncomeTotal, currency as any)}
        </div>
      )}
    </div>
  );
}
