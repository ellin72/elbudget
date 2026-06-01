import { prisma } from "@/lib/prisma";

export async function listTransactionsForUser(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

export async function createTransactionForUser(
  userId: string,
  payload: {
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    description: string;
    categoryId?: string | null;
    date: string;
    notes?: string | null;
    tags?: string[];
    merchantName?: string | null;
    recurringId?: string | null;
  }
) {
  return prisma.transaction.create({
    data: {
      ...payload,
      userId,
      date: new Date(payload.date),
      tags: JSON.stringify(payload.tags ?? []),
    },
    include: { category: true },
  });
}
