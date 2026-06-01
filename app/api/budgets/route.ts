import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations";
import { startOfMonth, endOfMonth, addWeeks, addMonths, addQuarters, addYears, subDays } from "date-fns";

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
  const budgets = await prisma.budget.findMany({
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
  });

  return NextResponse.json({
    data: budgets.map((b) => ({
      ...b,
      totalAmount: b.totalAmount.toNumber(),
      items: b.items.map((i) => ({ ...i, allocatedAmount: i.allocatedAmount.toNumber(), spentAmount: i.spentAmount.toNumber() })),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
