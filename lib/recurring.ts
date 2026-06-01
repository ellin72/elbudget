import { prisma } from "@/lib/prisma";

export function addByFrequency(date: Date, frequency: string) {
  const nextDate = new Date(date);

  switch (frequency) {
    case "DAILY":
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;
    case "BIWEEKLY":
      nextDate.setDate(nextDate.getDate() + 14);
      return nextDate;
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
    case "QUARTERLY":
      nextDate.setMonth(nextDate.getMonth() + 3);
      return nextDate;
    case "YEARLY":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      return nextDate;
    default:
      return nextDate;
  }
}

export function hasPaidCurrentCycle(lastPaid: Date | null, referenceDate: Date, frequency: string) {
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

export async function syncDueRecurringIncomeForUser(userId: string) {
  const now = new Date();
  const dueIncomeItems = await prisma.recurringItem.findMany({
    where: {
      userId,
      type: "INCOME",
      isActive: true,
      nextDueDate: { lte: now },
    },
    orderBy: { nextDueDate: "asc" },
  });

  for (const item of dueIncomeItems) {
    await prisma.$transaction(async (tx) => {
      const currentItem = await tx.recurringItem.findUnique({
        where: { id: item.id },
      });

      if (!currentItem || !currentItem.isActive || currentItem.type !== "INCOME") {
        return;
      }

      let nextDueDate = new Date(currentItem.nextDueDate);
      let lastPaid = currentItem.lastPaid ? new Date(currentItem.lastPaid) : null;
      let processed = false;
      let safety = 0;

      while (nextDueDate <= now && safety < 36) {
        if (!hasPaidCurrentCycle(lastPaid, nextDueDate, currentItem.frequency)) {
          await tx.transaction.create({
            data: {
              userId,
              categoryId: currentItem.categoryId,
              type: currentItem.type,
              amount: currentItem.amount,
              description: `${currentItem.name} (Recurring Income)`,
              date: new Date(nextDueDate),
              notes: "Auto-posted from recurring income",
              isRecurring: true,
              recurringId: currentItem.id,
              tags: "[]",
            },
          });
          lastPaid = new Date(nextDueDate);
          processed = true;
        }

        nextDueDate = addByFrequency(nextDueDate, currentItem.frequency);
        safety += 1;
      }

      if (processed || nextDueDate.getTime() !== currentItem.nextDueDate.getTime()) {
        await tx.recurringItem.update({
          where: { id: currentItem.id },
          data: {
            lastPaid,
            nextDueDate,
          },
        });
      }
    });
  }
}

export async function syncDueRecurringIncomeForAllUsers() {
  const now = new Date();
  const dueUsers = await prisma.recurringItem.findMany({
    where: {
      type: "INCOME",
      isActive: true,
      nextDueDate: { lte: now },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const user of dueUsers) {
    await syncDueRecurringIncomeForUser(user.userId);
  }

  return { processedUsers: dueUsers.length };
}