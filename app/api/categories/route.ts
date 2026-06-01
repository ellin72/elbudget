import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Salary", icon: "💼", color: "#10b981", type: "INCOME" },
  { name: "Freelance", icon: "💻", color: "#3b82f6", type: "INCOME" },
  { name: "Business", icon: "🏢", color: "#8b5cf6", type: "INCOME" },
  { name: "Investments", icon: "📈", color: "#f59e0b", type: "INCOME" },
  { name: "Other Income", icon: "💰", color: "#06b6d4", type: "INCOME" },
  { name: "Food & Dining", icon: "🍽️", color: "#ef4444", type: "EXPENSE" },
  { name: "Transport", icon: "🚗", color: "#f97316", type: "EXPENSE" },
  { name: "Rent & Housing", icon: "🏠", color: "#84cc16", type: "EXPENSE" },
  { name: "Utilities", icon: "⚡", color: "#f59e0b", type: "EXPENSE" },
  { name: "Healthcare", icon: "🏥", color: "#ec4899", type: "EXPENSE" },
  { name: "Education", icon: "📚", color: "#6366f1", type: "EXPENSE" },
  { name: "Entertainment", icon: "🎬", color: "#a855f7", type: "EXPENSE" },
  { name: "Shopping", icon: "🛍️", color: "#14b8a6", type: "EXPENSE" },
  { name: "Debt Payment", icon: "💳", color: "#dc2626", type: "EXPENSE" },
  { name: "Savings", icon: "💾", color: "#10b981", type: "EXPENSE" },
  { name: "Family", icon: "👨‍👩‍👧", color: "#f97316", type: "EXPENSE" },
  { name: "Personal Care", icon: "🧴", color: "#ec4899", type: "EXPENSE" },
  { name: "Groceries", icon: "🛒", color: "#84cc16", type: "EXPENSE" },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingCount = await prisma.category.count({
    where: { userId: session.user.id },
  });

  if (existingCount === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        isDefault: true,
        userId: session.user.id,
      })),
    });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: categories });
}
