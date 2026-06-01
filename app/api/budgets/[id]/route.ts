import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations";
import { addMonths, addQuarters, addWeeks, addYears, endOfMonth, subDays } from "date-fns";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existingBudget = await prisma.budget.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!existingBudget) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { items, ...budgetData } = parsed.data;
  const startDate = new Date(budgetData.startDate);
  const endDate = getBudgetEndDate(startDate, budgetData.period);
  const totalAmount = items.reduce((sum, item) => sum + item.allocatedAmount, 0);

  const spentLookup = new Map(
    existingBudget.items.map((item) => [`${item.name.toLowerCase()}::${item.categoryId ?? "none"}`, item.spentAmount])
  );

  const updated = await prisma.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({ where: { budgetId: id } });

    await tx.budget.update({
      where: { id },
      data: {
        name: budgetData.name,
        period: budgetData.period,
        style: budgetData.style,
        startDate,
        endDate,
        totalAmount,
      },
    });

    await tx.budgetItem.createMany({
      data: items.map((item) => {
        const key = `${item.name.toLowerCase()}::${item.categoryId ?? "none"}`;
        return {
          budgetId: id,
          name: item.name,
          categoryId: item.categoryId ?? null,
          allocatedAmount: item.allocatedAmount,
          spentAmount: spentLookup.get(key) ?? 0,
          color: item.color ?? "#6366f1",
        };
      }),
    });

    return tx.budget.findUnique({
      where: { id },
      include: { items: { include: { category: true } } },
    });
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      ...updated,
      totalAmount: updated.totalAmount.toNumber(),
      items: updated.items.map((i) => ({
        ...i,
        allocatedAmount: i.allocatedAmount.toNumber(),
        spentAmount: i.spentAmount.toNumber(),
      })),
    },
  });
}
