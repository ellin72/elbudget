import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: { contributions: { orderBy: { date: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: goals.map((g) => ({
      ...g,
      currentAmount: g.currentAmount.toNumber(),
      targetAmount: g.targetAmount.toNumber(),
      monthlyContrib: g.monthlyContrib?.toNumber() ?? null,
      contributions: g.contributions.map((c) => ({ ...c, amount: c.amount.toNumber() })),
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
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
    },
  });

  return NextResponse.json(
    { data: { ...goal, currentAmount: goal.currentAmount.toNumber(), targetAmount: goal.targetAmount.toNumber() } },
    { status: 201 }
  );
}
