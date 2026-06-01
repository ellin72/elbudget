"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import type { TransactionWithCategory } from "@/types";

interface Props {
  transaction?: TransactionWithCategory | null;
  onClose: () => void;
}

async function fetchCategories() {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export default function TransactionForm({ transaction, onClose }: Props) {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          description: transaction.description,
          amount: Number(transaction.amount),
          type: transaction.type as "INCOME" | "EXPENSE" | "TRANSFER",
          categoryId: transaction.categoryId ?? undefined,
          date: format(new Date(transaction.date), "yyyy-MM-dd"),
          notes: transaction.notes ?? undefined,
        }
      : {
          date: format(new Date(), "yyyy-MM-dd"),
          type: "EXPENSE",
        },
  });

  const txType = watch("type");

  const mutation = useMutation({
    mutationFn: async (data: TransactionInput) => {
      const url = transaction ? `/api/transactions/${transaction.id}` : "/api/transactions";
      const method = transaction ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(transaction ? "Transaction updated!" : "Transaction added!");
      onClose();
    },
    onError: () => toast.error("Failed to save transaction"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {transaction ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button title="Close form" aria-label="Close form" onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* Type tabs */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            {(["INCOME", "EXPENSE", "TRANSFER"] as const).map((t) => (
              <label key={t} className={`flex-1 text-center py-2 text-sm font-medium cursor-pointer transition-colors ${txType === t ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                <input {...register("type")} type="radio" value={t} className="sr-only" />
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <input
              {...register("description")}
              placeholder="e.g. Grocery shopping"
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount</label>
              <input
                {...register("amount", { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <input
                {...register("date")}
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select
              {...register("categoryId")}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a category</option>
              {categories?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              {...register("notes")}
              placeholder="Any additional notes…"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-accent transition-colors font-medium text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-glow"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {transaction ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
