// Shared TypeScript types for the Elbudget application

import type { 
  User, Transaction, Budget, BudgetItem, Goal, GoalContribution,
  Debt, DebtPayment, RecurringItem, Notification, AIInsight,
  Category, Subscription
} from "@prisma/client";

// ─── LOCAL ENUMS (SQLite doesn't support DB-level enums) ──────────────────────

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type Currency = "NAD" | "USD" | "ZAR" | "EUR" | "GBP" | "AUD" | "CAD";
export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";

// ─── RE-EXPORTS ────────────────────────────────────────────────────────────────

export type {
  User, Transaction, Budget, BudgetItem, Goal, GoalContribution,
  Debt, DebtPayment, RecurringItem, Notification, AIInsight,
  Category, Subscription
};

// ─── EXTENDED TYPES ───────────────────────────────────────────────────────────

export type TransactionWithCategory = Transaction & {
  category: Category | null;
};

export type BudgetWithItems = Budget & {
  items: (BudgetItem & { category: Category | null })[];
};

export type GoalWithContributions = Goal & {
  contributions: GoalContribution[];
};

export type DebtWithPayments = Debt & {
  payments: DebtPayment[];
};

// ─── API RESPONSE ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  totalDebt: number;
  totalGoalsSaved: number;
  incomeChange: number;
  expensesChange: number;
}

export interface SpendingByCategory {
  category: string;
  color: string;
  icon?: string | null;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  period?: string;
  income: number;
  expenses: number;
  savings?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  spendingByCategory: SpendingByCategory[];
  monthlyTrends: MonthlyTrend[];
  recentTransactions: TransactionWithCategory[];
  upcomingBills: RecurringItem[];
  activeGoals: GoalWithContributions[];
  activeDebts: Debt[];
  aiInsights: AIInsight[];
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

// ─── FINANCIAL CALCULATIONS ───────────────────────────────────────────────────

export interface FinancialHealthScore {
  score: number;
  grade: string;
  color: string;
  breakdown: {
    savingsRate: number;
    debtRatio: number;
    budgetAdherence: number;
    emergencyFund: number;
  };
}

export interface DebtPayoffPlan {
  debtId: string;
  debtName: string;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  monthsToPayoff: number;
  totalInterest: number;
  payoffDate: Date;
}

export interface SavingsProjection {
  months: number;
  projectedAmount: number;
  monthlyContribution: number;
  interestRate: number;
}

// ─── UI TYPES ─────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  premium?: boolean;
}

export interface FilterOptions {
  type?: TransactionType | "ALL";
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: string;
  color?: string;
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface AIInsightDisplay {
  id: string;
  type: string;
  title: string;
  content: string;
  score?: number | null;
  isRead: boolean;
  createdAt: Date;
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

export interface ReportData {
  period: { startDate: string; endDate: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
  };
  spendingByCategory: SpendingByCategory[];
  monthlyTrends: MonthlyTrend[];
  topTransactions: TransactionWithCategory[];
  budgetPerformance: {
    budgetName: string;
    allocated: number;
    spent: number;
    variance: number;
  }[];
}

// ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

export interface SubscriptionFeatures {
  maxBudgets: number | null;
  maxGoals: number | null;
  maxDebts: number | null;
  aiInsights: boolean;
  advancedReports: boolean;
  bankSync: boolean;
  exportFormats: string[];
  prioritySupport: boolean;
}

export const PLAN_FEATURES: Record<string, SubscriptionFeatures> = {
  FREE: {
    maxBudgets: 3,
    maxGoals: 3,
    maxDebts: 5,
    aiInsights: false,
    advancedReports: false,
    bankSync: false,
    exportFormats: ["csv"],
    prioritySupport: false,
  },
  PREMIUM: {
    maxBudgets: null,
    maxGoals: null,
    maxDebts: null,
    aiInsights: true,
    advancedReports: true,
    bankSync: true,
    exportFormats: ["csv", "pdf", "xlsx"],
    prioritySupport: true,
  },
  BUSINESS: {
    maxBudgets: null,
    maxGoals: null,
    maxDebts: null,
    aiInsights: true,
    advancedReports: true,
    bankSync: true,
    exportFormats: ["csv", "pdf", "xlsx"],
    prioritySupport: true,
  },
};
