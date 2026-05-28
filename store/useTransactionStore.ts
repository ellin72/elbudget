import { create } from "zustand";
import type { FilterOptions, TransactionWithCategory } from "@/types";

interface TransactionState {
  transactions: TransactionWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  filters: FilterOptions;
  selectedTransaction: TransactionWithCategory | null;
  editModalOpen: boolean;
}

interface TransactionActions {
  setTransactions: (transactions: TransactionWithCategory[], total: number) => void;
  addTransaction: (transaction: TransactionWithCategory) => void;
  updateTransaction: (id: string, transaction: Partial<TransactionWithCategory>) => void;
  deleteTransaction: (id: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSelectedTransaction: (transaction: TransactionWithCategory | null) => void;
  setEditModalOpen: (open: boolean) => void;
}

const defaultFilters: FilterOptions = {
  type: "ALL",
  page: 1,
  pageSize: 20,
};

export const useTransactionStore = create<TransactionState & TransactionActions>()(
  (set) => ({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 20,
    filters: defaultFilters,
    selectedTransaction: null,
    editModalOpen: false,

    setTransactions: (transactions, total) => set({ transactions, total }),
    addTransaction: (t) =>
      set((s) => ({ transactions: [t, ...s.transactions], total: s.total + 1 })),
    updateTransaction: (id, updated) =>
      set((s) => ({
        transactions: s.transactions.map((t) =>
          t.id === id ? { ...t, ...updated } : t
        ),
      })),
    deleteTransaction: (id) =>
      set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== id),
        total: s.total - 1,
      })),
    setFilters: (filters) =>
      set((s) => ({ filters: { ...s.filters, ...filters, page: 1 }, page: 1 })),
    clearFilters: () => set({ filters: defaultFilters, page: 1 }),
    setPage: (page) => set({ page, filters: { ...defaultFilters, page } }),
    setSelectedTransaction: (transaction) =>
      set({ selectedTransaction: transaction }),
    setEditModalOpen: (open) => set({ editModalOpen: open }),
  })
);
