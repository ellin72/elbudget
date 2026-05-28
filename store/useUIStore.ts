import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency } from "@/types";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  // Theme
  theme: "light" | "dark" | "system";
  // Currency preference (cached)
  currency: Currency;
  // Modal states
  transactionModalOpen: boolean;
  budgetModalOpen: boolean;
  goalModalOpen: boolean;
  debtModalOpen: boolean;
  // Notifications panel
  notificationsOpen: boolean;
  unreadCount: number;
  // Loading states
  globalLoading: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setCurrency: (currency: Currency) => void;
  setTransactionModalOpen: (open: boolean) => void;
  setBudgetModalOpen: (open: boolean) => void;
  setGoalModalOpen: (open: boolean) => void;
  setDebtModalOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: "system",
      currency: "NAD",
      transactionModalOpen: false,
      budgetModalOpen: false,
      goalModalOpen: false,
      debtModalOpen: false,
      notificationsOpen: false,
      unreadCount: 0,
      globalLoading: false,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setTransactionModalOpen: (open) => set({ transactionModalOpen: open }),
      setBudgetModalOpen: (open) => set({ budgetModalOpen: open }),
      setGoalModalOpen: (open) => set({ goalModalOpen: open }),
      setDebtModalOpen: (open) => set({ debtModalOpen: open }),
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      decrementUnreadCount: () =>
        set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
    }),
    {
      name: "elbudget-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        currency: state.currency,
      }),
    }
  )
);
