import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncDueRecurringIncomeForUser } from "@/lib/recurring";
import { subMonths } from "date-fns";
import {
  buildMonthlySummary,
  buildSpendingByCategory,
  calculateCurrentPeriodStats,
  createMonthBuckets,
  type FinancialTransaction,
} from "@/lib/financial";
import type { DashboardData } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  await syncDueRecurringIncomeForUser(userId);

  const now = new Date();
  const latestTx = await prisma.transaction.findFirst({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const anchorDate = latestTx?.date ?? now;
  const trendBuckets = createMonthBuckets(anchorDate, 6);
  const trendStart = trendBuckets[0].start;
  const trendEnd = trendBuckets[trendBuckets.length - 1].end;

  // Run all queries in parallel
  const [
    user,
    rangeTransactions,
    recentTxs,
    activeGoals,
    activeDebts,
    activeInsights,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true, monthlyIncome: true } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: trendStart, lte: trendEnd }, type: { in: ["INCOME", "EXPENSE"] } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        contributions: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.debt.findMany({
      where: { userId, isPaidOff: false },
      select: { currentBalance: true, originalAmount: true },
    }),
    prisma.aIInsight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const normalizedTransactions: FinancialTransaction[] = rangeTransactions.map((transaction) => ({
    amount: transaction.amount.toNumber(),
    type: transaction.type,
    date: transaction.date,
    categoryId: transaction.categoryId,
    category: transaction.category,
  }));
  const declaredMonthlyIncome = user?.monthlyIncome?.toNumber?.() ?? 0;
  const currentPeriod = calculateCurrentPeriodStats(
    normalizedTransactions,
    anchorDate,
    declaredMonthlyIncome
  );
  const monthlyTrends = buildMonthlySummary(
    normalizedTransactions,
    trendBuckets,
    declaredMonthlyIncome,
    anchorDate
  ).map((month) => ({
    month: month.month.replace(/\s\d{4}$/, ""),
    period: month.period,
    income: month.income,
    expenses: month.expenses,
  }));
  const currentPeriodTransactions = normalizedTransactions.filter(
    (transaction) => transaction.date >= currentPeriod.start && transaction.date <= currentPeriod.end
  );
  const categorySpending = buildSpendingByCategory(currentPeriodTransactions);

  // Calculate stats
  const monthlyIncome = currentPeriod.income;
  const monthlyExpenses = currentPeriod.expenses;
  const monthlySavings = currentPeriod.savings;
  const savingsRate = currentPeriod.savingsRate;
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.currentBalance.toNumber(), 0);
  const totalGoalsSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount.toNumber(), 0);

  // Spending by category with names
  const totalSpend = categorySpending.reduce((sum, category) => sum + category.total, 0);
  const spendingByCategory = categorySpending
    .map((category) => ({
      category: category.name,
      amount: category.total,
      percentage: totalSpend > 0 ? (category.total / totalSpend) * 100 : 0,
      color: category.color ?? "#94a3b8",
      icon: category.icon,
    }))
    .slice(0, 6);

  const fallbackInsights = [] as Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
    fallbackInsights.push({
      id: "fallback-budget-warning",
      type: "BUDGET_WARNING",
      title: "Expenses are above income this month",
      content: `You are overspending by ${(monthlyExpenses - monthlyIncome).toFixed(2)}. Focus on reducing unbudgeted categories first.`,
      isRead: false,
      createdAt: new Date(),
    });
  } else {
    fallbackInsights.push({
      id: "fallback-savings-opportunity",
      type: "SAVINGS_OPPORTUNITY",
      title: "Savings trend looks healthy",
      content: `You are currently saving ${(savingsRate).toFixed(1)}% of your income this month. Keep your top expense categories under control to maintain this pace.`,
      isRead: false,
      createdAt: new Date(),
    });
  }

  if (spendingByCategory.length > 0) {
    const topCategory = spendingByCategory[0];
    fallbackInsights.push({
      id: "fallback-spending-alert",
      type: "SPENDING_ALERT",
      title: `Top spending category: ${topCategory.category}`,
      content: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of this month's expenses.`,
      isRead: false,
      createdAt: new Date(),
    });
  }

  const insightsToShow = activeInsights.length > 0 ? activeInsights : fallbackInsights;

  const dashboardData: DashboardData = {
    stats: {
      totalBalance: monthlySavings,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      totalDebt,
      totalGoalsSaved,
      incomeChange: 0,
      expensesChange: 0,
    },
    recentTransactions: recentTxs.map((t) => ({
      ...t,
      amount: t.amount.toNumber(),
      date: t.date.toISOString() as any,
    })) as any,
    monthlyTrends,
    spendingByCategory,
    upcomingBills: [],
    activeDebts: activeDebts.map((d) => ({
      ...d,
      originalAmount: d.originalAmount.toNumber(),
      currentBalance: d.currentBalance.toNumber(),
    })) as any,
    activeGoals: activeGoals.map((g) => ({
      ...g,
      currentAmount: monthlySavings,
      targetAmount: g.targetAmount.toNumber(),
      monthlyContrib: g.monthlyContrib?.toNumber() ?? null,
      contributions: g.contributions.map((c) => ({ ...c, amount: c.amount.toNumber() })),
      challengeStatus: {
        monthlySavedAmount: monthlySavings,
        isAchieved: monthlySavings >= g.targetAmount.toNumber(),
        shortfall: Math.max(0, g.targetAmount.toNumber() - monthlySavings),
      },
    })) as any,
    aiInsights: insightsToShow as any,
  };

  return NextResponse.json({ data: dashboardData });
}
