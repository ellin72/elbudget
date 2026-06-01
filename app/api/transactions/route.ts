import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema, transactionFilterSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filters = transactionFilterSchema.safeParse(Object.fromEntries(searchParams));

  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");
  const skip = (page - 1) * pageSize;
  const unbudgetedOnly = searchParams.get("unbudgetedOnly") === "true";

  const where: any = { userId: session.user.id };
  if (filters.success) {
    if (filters.data.type && filters.data.type !== "ALL") where.type = filters.data.type;
    if (filters.data.categoryId) where.categoryId = filters.data.categoryId;
    if (filters.data.search) {
      where.description = { contains: filters.data.search };
    }
    if (filters.data.startDate) where.date = { ...where.date, gte: new Date(filters.data.startDate) };
    if (filters.data.endDate) where.date = { ...where.date, lte: new Date(filters.data.endDate) };
  }

  const annotateBudgetStatus = async (
    txs: Awaited<ReturnType<typeof prisma.transaction.findMany>>
  ) => {
    const transactionDates = txs.map((t) => t.date);
    const minDate = transactionDates.length > 0 ? new Date(Math.min(...transactionDates.map((d) => d.getTime()))) : null;
    const maxDate = transactionDates.length > 0 ? new Date(Math.max(...transactionDates.map((d) => d.getTime()))) : null;

    const budgetCategoryWindows = minDate && maxDate
      ? await prisma.budget.findMany({
          where: {
            userId: session.user.id,
            startDate: { lte: maxDate },
            OR: [{ endDate: null }, { endDate: { gte: minDate } }],
          },
          select: {
            startDate: true,
            endDate: true,
            items: {
              select: {
                categoryId: true,
              },
            },
          },
        })
      : [];

    return txs.map((t) => ({
      ...t,
      amount: t.amount.toNumber(),
      date: t.date.toISOString(),
      tags: JSON.parse(t.tags ?? "[]"),
      isBudgeted:
        t.type !== "EXPENSE"
          ? null
          : budgetCategoryWindows.some((budget) => {
              const withinRange =
                t.date >= budget.startDate &&
                (!budget.endDate || t.date <= budget.endDate);
              if (!withinRange) return false;

              return budget.items.some(
                (item) => (item.categoryId ?? null) === (t.categoryId ?? null)
              );
            }),
    }));
  };

  if (unbudgetedOnly) {
    const allTransactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
    });

    const annotatedAll = await annotateBudgetStatus(allTransactions);
    const unbudgetedTransactions = annotatedAll.filter(
      (t) => t.type === "EXPENSE" && t.isBudgeted === false
    );
    const total = unbudgetedTransactions.length;
    const paged = unbudgetedTransactions.slice(skip, skip + pageSize);

    return NextResponse.json({
      data: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  const annotatedTransactions = await annotateBudgetStatus(transactions);

  return NextResponse.json({
    data: annotatedTransactions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const tx = await prisma.transaction.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      date: new Date(parsed.data.date),
      tags: JSON.stringify(parsed.data.tags ?? []),
    },
    include: { category: true },
  });

  return NextResponse.json(
    { data: { ...tx, amount: tx.amount.toNumber(), tags: JSON.parse(tx.tags ?? "[]") } },
    { status: 201 }
  );
}
