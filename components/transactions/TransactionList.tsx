"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUIStore } from "@/store/useUIStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import TransactionForm from "@/components/transactions/TransactionForm";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TransactionWithCategory } from "@/types";

async function fetchTransactions(page: number, pageSize: number, filters: any) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, String(v)));
  const res = await fetch(`/api/transactions?${params}`);
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

export default function TransactionList() {
  const { currency } = useUIStore();
  const { page, pageSize, filters, setPage, setFilters, selectedTransaction, setSelectedTransaction, editModalOpen, setEditModalOpen } = useTransactionStore();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, pageSize, filters],
    queryFn: () => fetchTransactions(page, pageSize, filters),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transaction deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete transaction"),
  });

  const transactions: TransactionWithCategory[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setFilters({ search: searchInput })}
            placeholder="Search transactions…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.type ?? ""}
            onChange={(e) => setFilters({ type: (e.target.value || undefined) as any })}
            className="px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 shadow-glow"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-muted-foreground text-sm">No transactions found.</p>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 text-primary text-sm hover:underline">
              <Plus className="w-3.5 h-3.5" /> Add your first transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                          tx.type === "INCOME" && "bg-green-100 dark:bg-green-900/30",
                          tx.type === "EXPENSE" && "bg-red-100 dark:bg-red-900/30",
                          tx.type === "TRANSFER" && "bg-blue-100 dark:bg-blue-900/30",
                        )}>
                          {tx.type === "INCOME" && <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />}
                          {tx.type === "EXPENSE" && <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />}
                          {tx.type === "TRANSFER" && <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className="font-medium truncate max-w-[160px]">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {tx.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {format(new Date(tx.date), "MMM d, yyyy")}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right font-semibold tabular-nums",
                      tx.type === "INCOME" && "text-green-600 dark:text-green-400",
                      tx.type === "EXPENSE" && "text-red-600 dark:text-red-400",
                      tx.type === "TRANSFER" && "text-blue-600 dark:text-blue-400",
                    )}>
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                      {formatCurrency(Number(tx.amount), currency as any)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setSelectedTransaction(tx); setEditModalOpen(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <TransactionForm onClose={() => setShowForm(false)} />
      )}
      {editModalOpen && selectedTransaction && (
        <TransactionForm transaction={selectedTransaction} onClose={() => { setEditModalOpen(false); setSelectedTransaction(null); }} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm z-10 space-y-4">
            <h3 className="font-semibold">Delete Transaction?</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-border hover:bg-accent text-sm">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
