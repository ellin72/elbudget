import { prisma } from "@/lib/prisma";

export async function listBudgetsForUser(userId: string) {
  return prisma.budget.findMany({
    where: { userId },
    include: { items: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
}
