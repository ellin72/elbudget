import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildMonthlySummary,
  buildSpendingByCategory,
  createMonthBuckets,
  type FinancialTransaction,
} from "@/lib/financial";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthsBack = Math.min(12, Math.max(1, parseInt(searchParams.get("months") ?? "6", 10) || 6));
  const userId = session.user.id;

  const now = new Date();
  const [user, latestTx] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyIncome: true },
    }),
    prisma.transaction.findFirst({
      where: { userId },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
  ]);
  const anchorDate = latestTx?.date ?? now;
  const months = createMonthBuckets(anchorDate, monthsBack);

  // Fetch all transactions for date range
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: months[0].start,
        lte: months[months.length - 1].end,
      },
      type: { in: ["INCOME", "EXPENSE"] },
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const declaredMonthlyIncome = user?.monthlyIncome?.toNumber?.() ?? 0;
  const normalizedTransactions: FinancialTransaction[] = transactions.map((transaction) => ({
    amount: transaction.amount.toNumber(),
    type: transaction.type,
    date: transaction.date,
    categoryId: transaction.categoryId,
    category: transaction.category,
  }));
  const monthlySummary = buildMonthlySummary(
    normalizedTransactions,
    months,
    declaredMonthlyIncome,
    anchorDate
  );
  const spendingByCategory = buildSpendingByCategory(normalizedTransactions);

  // Totals
  const totalIncome = monthlySummary.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = monthlySummary.reduce((sum, month) => sum + month.expenses, 0);

  return NextResponse.json({
    monthlySummary,
    spendingByCategory,
    totalIncome,
    totalExpenses,
    totalSavings: totalIncome - totalExpenses,
    avgMonthlySavingsRate:
      monthlySummary.length > 0
        ? monthlySummary.reduce((s, m) => s + m.savingsRate, 0) / monthlySummary.length
        : 0,
    transactionCount: transactions.length,
  });
}
