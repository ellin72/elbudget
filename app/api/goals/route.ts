import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncDueRecurringIncomeForUser } from "@/lib/recurring";
import { goalSchema } from "@/lib/validations";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  calculateCurrentPeriodStats,
  type FinancialTransaction,
} from "@/lib/financial";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await syncDueRecurringIncomeForUser(session.user.id);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    user,
    goals,
    monthTransactions,
    activeBudgets,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { monthlyIncome: true },
    }),
    prisma.goal.findMany({
      where: { userId: session.user.id },
      include: { contributions: { orderBy: { date: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: monthStart, lte: monthEnd },
        type: { in: ["INCOME", "EXPENSE"] },
      },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.budget.findMany({
      where: {
        userId: session.user.id,
        startDate: { lte: monthEnd },
        OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        items: { select: { categoryId: true } },
      },
    }),
  ]);

  const declaredMonthlyIncome = user?.monthlyIncome?.toNumber?.() ?? 0;
  const normalizedTransactions: FinancialTransaction[] = monthTransactions.map((transaction) => ({
    amount: transaction.amount.toNumber(),
    type: transaction.type,
    date: transaction.date,
    categoryId: transaction.categoryId,
    category: transaction.category,
  }));
  const currentPeriod = calculateCurrentPeriodStats(
    normalizedTransactions,
    now,
    declaredMonthlyIncome
  );
  const monthlyIncome = currentPeriod.income;
  const monthlyExpenses = currentPeriod.expenses;
  const monthlySavings = currentPeriod.savings;

  const unbudgetedExpenses = monthTransactions.filter((tx) => {
    if (tx.type !== "EXPENSE") return false;

    const txCategoryId = tx.categoryId ?? null;
    const covered = activeBudgets.some((budget) => {
      const inRange = tx.date >= budget.startDate && (!budget.endDate || tx.date <= budget.endDate);
      if (!inRange) return false;
      return budget.items.some((item) => (item.categoryId ?? null) === txCategoryId);
    });

    return !covered;
  });

  const suggestionByCategory = new Map<string, { category: string; amount: number }>();
  for (const tx of unbudgetedExpenses) {
    const key = tx.categoryId ?? "uncategorized";
    const current = suggestionByCategory.get(key);
    const amount = tx.amount.toNumber();
    if (!current) {
      suggestionByCategory.set(key, {
        category: tx.category?.name ?? "Uncategorized",
        amount,
      });
    } else {
      current.amount += amount;
    }
  }

  const topSuggestions = Array.from(suggestionByCategory.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((s) => ({
      category: s.category,
      amount: s.amount,
      suggestion: `Consider reducing ${s.category} by at least ${Math.max(5, Math.round(s.amount * 0.15))}% this month.`,
    }));

  return NextResponse.json({
    monthlySavings,
    monthlyIncome,
    monthlyExpenses,
    monthLabel: format(now, "MMMM yyyy"),
    unbudgetedSuggestions: topSuggestions,
    data: goals.map((g) => ({
      ...g,
      currentAmount: monthlySavings,
      targetAmount: g.targetAmount.toNumber(),
      monthlyContrib: g.monthlyContrib?.toNumber() ?? null,
      contributions: g.contributions.map((c) => ({ ...c, amount: c.amount.toNumber() })),
      challengeStatus: {
        monthLabel: format(now, "MMMM yyyy"),
        monthlySavedAmount: monthlySavings,
        isAchieved: monthlySavings >= g.targetAmount.toNumber(),
        shortfall: Math.max(0, g.targetAmount.toNumber() - monthlySavings),
        suggestions: topSuggestions,
      },
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : endOfMonth(new Date()),
    },
  });

  return NextResponse.json(
    { data: { ...goal, currentAmount: goal.currentAmount.toNumber(), targetAmount: goal.targetAmount.toNumber() } },
    { status: 201 }
  );
}
