import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMonthlyInsights } from "@/lib/ai";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const insights = await prisma.aIInsight.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(insights);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if insights were already generated this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const existingThisMonth = await prisma.aIInsight.findFirst({
    where: {
      userId: session.user.id,
      createdAt: { gte: startOfMonth },
    },
  });

  if (existingThisMonth) {
    return NextResponse.json(
      { message: "Insights already generated this month" },
      { status: 200 }
    );
  }

  // Get financial context and generate insights
  const insights = await generateMonthlyInsights(session.user!.id);

  // Save each insight to the database
  const created = await prisma.$transaction(
    insights.map((insight) =>
      prisma.aIInsight.create({
        data: {
          userId: session.user!.id,
          type: insight.type,
          title: insight.title,
          content: insight.content,
          score: insight.score,
        },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Insight ID required" }, { status: 400 });
  }

  const insight = await prisma.aIInsight.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!insight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.aIInsight.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
}
