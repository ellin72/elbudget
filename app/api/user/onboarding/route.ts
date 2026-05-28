import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      monthlyIncome: parsed.data.monthlyIncome,
      salaryDate: parsed.data.salaryDate,
      budgetStyle: parsed.data.budgetStyle,
      currency: parsed.data.currency,
      onboardingDone: true,
    },
  });

  return NextResponse.json({ success: true });
}
