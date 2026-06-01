import { prisma } from "@/lib/prisma";

export async function listDebtsForUser(userId: string) {
  return prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
