import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function hasPaidCurrentCycle(lastPaid: Date | null, referenceDate: Date, frequency: string) {
  if (!lastPaid) return false;

  switch (frequency) {
    case "DAILY":
      return lastPaid.toDateString() === referenceDate.toDateString();
    case "WEEKLY": {
      const diffMs = referenceDate.getTime() - lastPaid.getTime();
      return diffMs >= 0 && diffMs < 7 * 24 * 60 * 60 * 1000;
    }
    case "BIWEEKLY": {
      const diffMs = referenceDate.getTime() - lastPaid.getTime();
      return diffMs >= 0 && diffMs < 14 * 24 * 60 * 60 * 1000;
    }
    case "MONTHLY":
      return (
        lastPaid.getFullYear() === referenceDate.getFullYear() &&
        lastPaid.getMonth() === referenceDate.getMonth()
      );
    case "QUARTERLY":
      return (
        lastPaid.getFullYear() === referenceDate.getFullYear() &&
        Math.floor(lastPaid.getMonth() / 3) === Math.floor(referenceDate.getMonth() / 3)
      );
    case "YEARLY":
      return lastPaid.getFullYear() === referenceDate.getFullYear();
    default:
      return false;
  }
}

function addByFrequency(date: Date, frequency: string) {
  const d = new Date(date);
  switch (frequency) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      return d;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      return d;
    case "BIWEEKLY":
      d.setDate(d.getDate() + 14);
      return d;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      return d;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      return d;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      return d;
    default:
      return d;
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  markPaid: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (Object.prototype.hasOwnProperty.call(body, "amount")) {
    return NextResponse.json(
      { error: "Recurring amount is fixed after creation. Stop and create a new item to change amount." },
      { status: 400 }
    );
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.recurringItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.markPaid) {
    if (!item.isActive) {
      return NextResponse.json(
        { error: "Only active recurring items can be marked as paid." },
        { status: 400 }
      );
    }

    const paidAt = new Date();
    if (hasPaidCurrentCycle(item.lastPaid, paidAt, item.frequency)) {
      return NextResponse.json(
        { error: "This recurring item has already been paid for the current cycle." },
        { status: 400 }
      );
    }

    let nextDueDate = addByFrequency(item.nextDueDate, item.frequency);
    let safety = 0;
    while (nextDueDate <= paidAt && safety < 36) {
      nextDueDate = addByFrequency(nextDueDate, item.frequency);
      safety += 1;
    }

    const [, updatedItem] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          categoryId: item.categoryId,
          type: item.type,
          amount: item.amount,
          description: `${item.name} (Recurring)`,
          date: paidAt,
          notes: "Created from recurring item payment",
          isRecurring: true,
          recurringId: item.id,
          tags: "[]",
        },
      }),
      prisma.recurringItem.update({
        where: { id },
        data: {
          lastPaid: paidAt,
          nextDueDate,
        },
        include: { category: true },
      }),
    ]);

    return NextResponse.json({
      ...updatedItem,
      amount: updatedItem.amount.toNumber(),
      paymentRecorded: true,
    });
  }

  const { markPaid, ...rest } = parsed.data;

  const updated = await prisma.recurringItem.update({
    where: { id },
    data: {
      ...rest,
      nextDueDate: rest.nextDueDate ? new Date(rest.nextDueDate) : undefined,
    },
    include: { category: true },
  });

  return NextResponse.json({ ...updated, amount: updated.amount.toNumber() });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.recurringItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (item.isActive) {
    return NextResponse.json(
      { error: "Stop this recurring item before deleting it." },
      { status: 400 }
    );
  }

  await prisma.recurringItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
