"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  RepeatIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";

interface RecurringItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  frequency: string;
  isActive: boolean;
  nextDue: string;
  startDate: string;
  endDate: string | null;
  category: { name: string; color: string; icon: string } | null;
}

const FREQUENCIES = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];
const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

function getNextDueLabel(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    frequency: "MONTHLY",
    startDate: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  const { data: items = [], isLoading } = useQuery<RecurringItem[]>({
    queryKey: ["recurring"],
    queryFn: () => fetch("/api/recurring").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: parseFloat(data.amount) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      setShowForm(false);
      setFormData({ name: "", type: "EXPENSE", amount: "", frequency: "MONTHLY", startDate: format(new Date(), "yyyy-MM-dd"), description: "" });
      toast.success("Recurring item created");
    },
    onError: () => toast.error("Failed to create recurring item"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/recurring/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Deleted");
    },
  });

  const activeItems = items.filter((i) => i.isActive);
  const inactiveItems = items.filter((i) => !i.isActive);
  const monthlyTotal = items
    .filter((i) => i.isActive)
    .reduce((sum, i) => {
      const amount = parseFloat(i.amount);
      const multiplier: Record<string, number> = {
        DAILY: 30, WEEKLY: 4.33, BIWEEKLY: 2.17, MONTHLY: 1, QUARTERLY: 1/3, YEARLY: 1/12,
      };
      const sign = i.type === "INCOME" ? 1 : -1;
      return sum + sign * amount * (multiplier[i.frequency] ?? 1);
    }, 0);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recurring Items</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automate your regular income and expenses
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Recurring
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Items</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeItems.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Net</p>
          <p className={`text-2xl font-bold ${monthlyTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(Math.abs(monthlyTotal))}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Recurring Item</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Netflix Subscription"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                {(["INCOME", "EXPENSE"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      formData.type === t
                        ? t === "INCOME"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.name || !formData.amount}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Items */}
      {activeItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active</h2>
          {activeItems.map((item) => (
            <RecurringItemCard
              key={item.id}
              item={item}
              onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Inactive Items */}
      {inactiveItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Paused</h2>
          {inactiveItems.map((item) => (
            <RecurringItemCard
              key={item.id}
              item={item}
              onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-16">
          <RepeatIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recurring items</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add your subscriptions, bills, and regular income to track them automatically.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Add First Recurring Item
          </button>
        </div>
      )}
    </div>
  );
}

function RecurringItemCard({
  item,
  onToggle,
  onDelete,
}: {
  item: RecurringItem;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const dueLabel = getNextDueLabel(item.nextDue);
  const isOverdue = dueLabel === "Overdue";

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 border flex items-center gap-4 transition-all ${
      item.isActive ? "border-gray-200 dark:border-gray-700" : "border-gray-100 dark:border-gray-800 opacity-60"
    }`}>
      {/* Type indicator */}
      <div className={`w-3 h-10 rounded-full flex-shrink-0 ${
        item.type === "INCOME" ? "bg-green-500" : "bg-red-500"
      }`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">{item.name}</span>
          {item.category && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: item.category.color + "20", color: item.category.color }}
            >
              {item.category.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span>{FREQUENCY_LABELS[item.frequency]}</span>
          <span>·</span>
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>{dueLabel}</span>
        </div>
      </div>

      {/* Amount */}
      <div className={`text-right flex-shrink-0 ${
        item.type === "INCOME" ? "text-green-600" : "text-red-600"
      }`}>
        <span className="font-semibold">
          {item.type === "INCOME" ? "+" : "-"}{formatCurrency(parseFloat(item.amount))}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggle(item.id, !item.isActive)}
          title={item.isActive ? "Pause" : "Activate"}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {item.isActive ? (
            <XCircleIcon className="w-4 h-4" />
          ) : (
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
          )}
        </button>
        <button
          onClick={() => onDelete(item.id)}
          title="Delete"
          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
