import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { debtSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const debts = await prisma.debt.findMany({
    where: { userId: session.user.id },
    include: { payments: { orderBy: { date: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: debts.map((d) => ({
      ...d,
      currentBalance: d.currentBalance.toNumber(),
      originalAmount: d.originalAmount.toNumber(),
      interestRate: d.interestRate.toNumber(),
      minimumPayment: d.minimumPayment.toNumber(),
      payments: d.payments.map((p) => ({ ...p, amount: p.amount.toNumber(), principal: p.principal.toNumber(), interest: p.interest.toNumber() })),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = debtSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const debt = await prisma.debt.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      currentBalance: parsed.data.originalAmount,
    },
  });

  return NextResponse.json(
    { data: { ...debt, currentBalance: debt.currentBalance.toNumber(), originalAmount: debt.originalAmount.toNumber(), interestRate: debt.interestRate.toNumber(), minimumPayment: debt.minimumPayment.toNumber() } },
    { status: 201 }
  );
}
