import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";

export interface FinancialCategory {
  name?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface FinancialTransaction {
  amount: number;
  type: string;
  date: Date;
  categoryId?: string | null;
  category?: FinancialCategory | null;
}

export interface MonthBucket {
  label: string;
  period: string;
  start: Date;
  end: Date;
}

export interface MonthlyFinancialSummary {
  month: string;
  period: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  transactionCount: number;
}

export interface CurrentPeriodStats {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  start: Date;
  end: Date;
}

export interface SpendingCategorySummary {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  total: number;
  count: number;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function createMonthBuckets(anchorDate: Date, monthsBack: number): MonthBucket[] {
  return Array.from({ length: monthsBack }, (_, index) => {
    const date = subMonths(anchorDate, monthsBack - 1 - index);
    return {
      label: format(date, "MMM yyyy"),
      period: format(date, "yyyy-MM"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });
}

export function resolveIncomeForMonth(
  transactionIncome: number,
  declaredMonthlyIncome: number,
  monthStart: Date,
  anchorDate: Date
) {
  const isAnchorMonth =
    monthStart.getFullYear() === anchorDate.getFullYear() &&
    monthStart.getMonth() === anchorDate.getMonth();

  if (declaredMonthlyIncome > 0 && isAnchorMonth) {
    return declaredMonthlyIncome;
  }

  return transactionIncome;
}

export function buildMonthlySummary(
  transactions: FinancialTransaction[],
  buckets: MonthBucket[],
  declaredMonthlyIncome: number,
  anchorDate: Date
): MonthlyFinancialSummary[] {
  return buckets.map((bucket) => {
    const monthTransactions = transactions.filter(
      (transaction) => transaction.date >= bucket.start && transaction.date <= bucket.end
    );
    const transactionIncome = monthTransactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = monthTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const income = resolveIncomeForMonth(
      transactionIncome,
      declaredMonthlyIncome,
      bucket.start,
      anchorDate
    );
    const savings = income - expenses;

    return {
      month: bucket.label,
      period: bucket.period,
      income: round2(income),
      expenses: round2(expenses),
      savings: round2(savings),
      savingsRate: income > 0 ? round2((savings / income) * 100) : 0,
      transactionCount: monthTransactions.length,
    };
  });
}

export function calculateCurrentPeriodStats(
  transactions: FinancialTransaction[],
  anchorDate: Date,
  declaredMonthlyIncome: number
): CurrentPeriodStats {
  const start = startOfMonth(anchorDate);
  const end = endOfMonth(anchorDate);
  const currentTransactions = transactions.filter(
    (transaction) => transaction.date >= start && transaction.date <= end
  );
  const transactionIncome = currentTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = currentTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const income = resolveIncomeForMonth(transactionIncome, declaredMonthlyIncome, start, anchorDate);
  const savings = income - expenses;

  return {
    income: round2(income),
    expenses: round2(expenses),
    savings: round2(savings),
    savingsRate: income > 0 ? round2((savings / income) * 100) : 0,
    start,
    end,
  };
}

export function buildSpendingByCategory(
  transactions: FinancialTransaction[]
): SpendingCategorySummary[] {
  const categoryMap = new Map<string, SpendingCategorySummary>();

  for (const transaction of transactions.filter((item) => item.type === "EXPENSE")) {
    const key = transaction.categoryId ?? "uncategorized";
    const existing = categoryMap.get(key);

    if (!existing) {
      categoryMap.set(key, {
        id: key,
        name: transaction.category?.name ?? "Uncategorized",
        color: transaction.category?.color ?? "#6B7280",
        icon: transaction.category?.icon ?? null,
        total: round2(transaction.amount),
        count: 1,
      });
      continue;
    }

    existing.total = round2(existing.total + transaction.amount);
    existing.count += 1;
  }

  return Array.from(categoryMap.values()).sort((left, right) => right.total - left.total);
}