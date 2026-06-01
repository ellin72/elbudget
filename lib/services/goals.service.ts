import { prisma } from "@/lib/prisma";

export async function listGoalsForUser(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
