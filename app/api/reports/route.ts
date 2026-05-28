import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthsBack = parseInt(searchParams.get("months") ?? "6");
  const userId = session.user.id;

  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const date = subMonths(now, i);
    return {
      label: format(date, "MMM yyyy"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  }).reverse();

  // Fetch all transactions for date range
  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
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
    }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { isDefault: true }] },
    }),
  ]);

  // Monthly summary
  const monthlySummary = months.map((m) => {
    const monthTx = transactions.filter(
      (t) => t.date >= m.start && t.date <= m.end
    );
    const income = monthTx
      .filter((t) => t.type === "INCOME")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTx
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + Number(t.amount), 0);
    return {
      month: m.label,
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      transactionCount: monthTx.length,
    };
  });

  // Spending by category (all time in range)
  const categoryMap: Record<string, { name: string; color: string; total: number; count: number }> = {};
  for (const tx of transactions.filter((t) => t.type === "EXPENSE")) {
    const key = tx.categoryId ?? "uncategorized";
    if (!categoryMap[key]) {
      categoryMap[key] = {
        name: tx.category?.name ?? "Uncategorized",
        color: tx.category?.color ?? "#6B7280",
        total: 0,
        count: 0,
      };
    }
    categoryMap[key].total += Number(tx.amount);
    categoryMap[key].count++;
  }
  const spendingByCategory = Object.entries(categoryMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  // Totals
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);

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
