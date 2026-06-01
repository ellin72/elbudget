import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import type { DashboardData } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const now = new Date();
  const latestTx = await prisma.transaction.findFirst({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const anchorDate = latestTx?.date ?? now;
  const startCurrent = startOfMonth(anchorDate);
  const endCurrent = endOfMonth(anchorDate);

  // Run all queries in parallel
  const [
    user,
    currentMonthTxs,
    recentTxs,
    activeGoals,
    activeDebts,
    activeInsights,
    monthlyTrendsRaw,
    spendingByCategoryRaw,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true, monthlyIncome: true } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: startCurrent, lte: endCurrent } },
      select: { amount: true, type: true },
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
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    // Last 6 months trends
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(anchorDate, 5 - i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        return prisma.transaction.aggregate({
          where: { userId, date: { gte: start, lte: end } },
          _sum: { amount: true },
        }).then((r) => ({
          month: format(d, "MMM"),
          income: 0,
          expenses: 0,
          period: format(d, "yyyy-MM"),
        })).then(async (m) => {
          const [income, expenses] = await Promise.all([
            prisma.transaction.aggregate({
              where: { userId, date: { gte: startOfMonth(subMonths(anchorDate, 5 - i)), lte: endOfMonth(subMonths(anchorDate, 5 - i)) }, type: "INCOME" },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: { userId, date: { gte: startOfMonth(subMonths(anchorDate, 5 - i)), lte: endOfMonth(subMonths(anchorDate, 5 - i)) }, type: "EXPENSE" },
              _sum: { amount: true },
            }),
          ]);
          return {
            ...m,
            income: income._sum.amount?.toNumber() ?? 0,
            expenses: expenses._sum.amount?.toNumber() ?? 0,
          };
        });
      })
    ),
    // Spending by category for current month
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: startCurrent, lte: endCurrent } },
      _sum: { amount: true },
    }),
  ]);

  // Calculate stats
  const monthlyIncome = currentMonthTxs
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount.toNumber(), 0);
  const monthlyExpenses = currentMonthTxs
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount.toNumber(), 0);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.currentBalance.toNumber(), 0);
  const totalGoalsSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount.toNumber(), 0);

  // Spending by category with names
  const categoryIds = spendingByCategoryRaw.map((r) => r.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true, icon: true },
  });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const totalSpend = spendingByCategoryRaw.reduce((s, r) => s + (r._sum.amount?.toNumber() ?? 0), 0);
  const spendingByCategory = spendingByCategoryRaw.map((r) => {
    const cat = r.categoryId ? categoryMap[r.categoryId] : null;
    const amount = r._sum.amount?.toNumber() ?? 0;
    return {
      category: cat?.name ?? "Uncategorized",
      amount,
      percentage: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
      color: cat?.color ?? "#94a3b8",
      icon: cat?.icon,
    };
  }).sort((a, b) => b.amount - a.amount).slice(0, 6);

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
    monthlyTrends: monthlyTrendsRaw,
    spendingByCategory,
    upcomingBills: [],
    activeDebts: activeDebts.map((d) => ({
      ...d,
      originalAmount: d.originalAmount.toNumber(),
      currentBalance: d.currentBalance.toNumber(),
    })) as any,
    activeGoals: activeGoals.map((g) => ({
      ...g,
      currentAmount: g.currentAmount.toNumber(),
      targetAmount: g.targetAmount.toNumber(),
      monthlyContrib: g.monthlyContrib?.toNumber() ?? null,
      contributions: g.contributions.map((c) => ({ ...c, amount: c.amount.toNumber() })),
    })) as any,
    aiInsights: activeInsights,
  };

  return NextResponse.json({ data: dashboardData });
}
