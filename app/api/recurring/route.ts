import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncDueRecurringIncomeForUser } from "@/lib/recurring";
import { z } from "zod";

const recurringSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  categoryId: z.string().optional(),
  nextDueDate: z.string(),
  notes: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncDueRecurringIncomeForUser(session.user.id);

  const items = await prisma.recurringItem.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      amount: item.amount.toNumber(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = recurringSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, type, amount, frequency, categoryId, nextDueDate, notes, icon, color, isActive } =
    parsed.data;

  const item = await prisma.recurringItem.create({
    data: {
      userId: session.user.id,
      name,
      type,
      amount,
      frequency,
      categoryId: categoryId || null,
      nextDueDate: new Date(nextDueDate),
      notes: notes || null,
      icon: icon || null,
      color: color || "#6366f1",
      isActive,
    },
    include: { category: true },
  });

  return NextResponse.json({ ...item, amount: item.amount.toNumber() }, { status: 201 });
}
