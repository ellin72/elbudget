import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations";
import { enforceCreationLimit } from "@/lib/subscription";
import { startOfMonth, endOfMonth, addWeeks, addMonths, addQuarters, addYears, subDays } from "date-fns";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function recurringToMonthlyAmount(amount: number, frequency: string) {
  const factor: Record<string, number> = {
    DAILY: 30,
    WEEKLY: 4.33,
    BIWEEKLY: 2.17,
    MONTHLY: 1,
    QUARTERLY: 1 / 3,
    YEARLY: 1 / 12,
  };

  return round2(amount * (factor[frequency] ?? 1));
}

function getBudgetEndDate(startDate: Date, period: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY") {
  switch (period) {
    case "WEEKLY":
      return subDays(addWeeks(startDate, 1), 1);
    case "MONTHLY":
      return subDays(addMonths(startDate, 1), 1);
    case "QUARTERLY":
      return subDays(addQuarters(startDate, 1), 1);
    case "YEARLY":
      return subDays(addYears(startDate, 1), 1);
    default:
      return endOfMonth(startDate);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const [budgets, recurringItems] = await Promise.all([
    prisma.budget.findMany({
      where: {
        userId: session.user.id,
        startDate: { lte: endOfMonth(now) },
        OR: [
          { endDate: null },
          { endDate: { gte: startOfMonth(now) } },
        ],
      },
      include: {
        items: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recurringItem.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const budgetSpendSnapshots = await Promise.all(
    budgets.map(async (budget) => {
      const expenses = await prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          type: "EXPENSE",
          date: {
            gte: budget.startDate,
            lte: budget.endDate ?? now,
          },
        },
        select: {
          id: true,
          amount: true,
          categoryId: true,
          description: true,
          date: true,
        },
      });

      const spentByCategory = new Map<string, number>();
      for (const tx of expenses) {
        const key = tx.categoryId ?? "__uncategorized__";
        spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + tx.amount.toNumber());
      }

      const budgetedCategoryKeys = new Set(
        budget.items.map((item) => item.categoryId ?? "__uncategorized__")
      );

      const unbudgetedExpenses = expenses
        .filter((tx) => !budgetedCategoryKeys.has(tx.categoryId ?? "__uncategorized__"))
        .map((tx) => ({
          id: tx.id,
          description: tx.description,
          amount: tx.amount.toNumber(),
          date: tx.date,
          categoryId: tx.categoryId,
        }));

      return {
        budgetId: budget.id,
        spentByCategory,
        unbudgetedExpenses,
      };
    })
  );

  const spendByBudgetId = new Map(
    budgetSpendSnapshots.map((snapshot) => [snapshot.budgetId, snapshot])
  );

  const recurringExpenseMonthlyItems = recurringItems
    .filter((item) => item.type === "EXPENSE")
    .map((item) => {
      const allocatedAmount = recurringToMonthlyAmount(item.amount.toNumber(), item.frequency);
      return {
        id: `recurring-${item.id}`,
        budgetId: null,
        categoryId: item.categoryId,
        name: item.name,
        allocatedAmount,
        spentAmount: 0,
        color: item.color,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        category: item.category,
        isRecurring: true,
        isLocked: true,
        recurringId: item.id,
      };
    });

  const recurringIncomeMonthlyItems = recurringItems
    .filter((item) => item.type === "INCOME")
    .map((item) => {
      const monthlyAmount = recurringToMonthlyAmount(item.amount.toNumber(), item.frequency);
      return {
        id: item.id,
        name: item.name,
        monthlyAmount,
        frequency: item.frequency,
        category: item.category,
      };
    });

  const recurringMonthlyTotal = recurringExpenseMonthlyItems.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const recurringMonthlyIncomeTotal = recurringIncomeMonthlyItems.reduce((sum, item) => sum + item.monthlyAmount, 0);
  const primaryMonthlyBudgetId = budgets.find((b) => b.period === "MONTHLY")?.id;

  return NextResponse.json({
    data: budgets.map((b) => {
      const spendSnapshot = spendByBudgetId.get(b.id);
      const baseItems = b.items.map((i) => ({
        ...i,
        allocatedAmount: i.allocatedAmount.toNumber(),
        spentAmount:
          spendSnapshot?.spentByCategory.get(i.categoryId ?? "__uncategorized__") ?? 0,
      }));

      const includeRecurring = b.id === primaryMonthlyBudgetId;
      const items = includeRecurring ? [...baseItems, ...recurringExpenseMonthlyItems] : baseItems;
      const totalAmount = baseItems.reduce((sum, i) => sum + i.allocatedAmount, 0) + (includeRecurring ? recurringMonthlyTotal : 0);

      return {
        ...b,
        totalAmount,
        items,
        unbudgetedExpenses: spendSnapshot?.unbudgetedExpenses ?? [],
        unbudgetedExpensesTotal: (spendSnapshot?.unbudgetedExpenses ?? []).reduce(
          (sum, tx) => sum + tx.amount,
          0
        ),
      };
    }),
    recurringMonthlyTotal,
    recurringMonthlyIncomeTotal,
    recurringMonthlyItems: recurringExpenseMonthlyItems,
    recurringMonthlyIncomeItems: recurringIncomeMonthlyItems,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quota = await enforceCreationLimit(session.user.id, "budgets");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Your ${quota.plan} plan allows up to ${quota.limit} budgets. Upgrade to create more.`,
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { items, ...budgetData } = parsed.data;
  const startDate = new Date(budgetData.startDate);
  const computedEndDate = getBudgetEndDate(startDate, budgetData.period);
  const totalAmount = items ? items.reduce((sum, item) => sum + item.allocatedAmount, 0) : 0;
  const budget = await prisma.budget.create({
    data: {
      ...budgetData,
      totalAmount,
      userId: session.user.id,
      startDate,
      endDate: computedEndDate,
      items: items ? { create: items } : undefined,
    },
    include: { items: { include: { category: true } } },
  });

  return NextResponse.json({ data: budget }, { status: 201 });
}
