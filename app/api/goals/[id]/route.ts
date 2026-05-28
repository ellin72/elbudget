import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalContributionSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const goal = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = goalContributionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const [contribution, updatedGoal] = await prisma.$transaction([
    prisma.goalContribution.create({
      data: {
        goalId: id,
        amount: parsed.data.amount,
        notes: parsed.data.notes,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
    }),
    prisma.goal.update({
      where: { id },
      data: { currentAmount: { increment: parsed.data.amount } },
    }),
  ]);

  return NextResponse.json({ data: { ...contribution, amount: contribution.amount.toNumber() } }, { status: 201 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const goal = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const goal = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.goal.update({ where: { id }, data: body });
  return NextResponse.json({ data: { ...updated, currentAmount: updated.currentAmount.toNumber(), targetAmount: updated.targetAmount.toNumber() } });
}
