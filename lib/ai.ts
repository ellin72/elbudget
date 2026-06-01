import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponseMetadata {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  confidence: "low" | "medium" | "high";
  disclaimer: string;
}

interface FinancialContext {
  userId: string;
  monthlyIncome: number;
  currency: Currency;
  currentMonth?: {
    totalIncome: number;
    totalExpenses: number;
    savingsRate: number;
    topCategories: { name: string; amount: number }[];
  };
  budgetHealth?: number;
  activeDebts?: number;
  savingsGoalsProgress?: number;
}

export async function getFinancialContext(userId: string): Promise<FinancialContext> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [transactions, debts, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      include: { category: true },
    }),
    prisma.debt.findMany({ where: { userId, isPaidOff: false } }),
    prisma.goal.findMany({ where: { userId, status: "ACTIVE" } }),
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const categorySpend: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const cat = t.category?.name ?? "Other";
      categorySpend[cat] = (categorySpend[cat] ?? 0) + Number(t.amount);
    });

  const topCategories = Object.entries(categorySpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  const totalDebtBalance = debts.reduce((s, d) => s + Number(d.currentBalance), 0);
  const totalGoalProgress =
    goals.length > 0
      ? goals.reduce(
          (s, g) =>
            s + (Number(g.currentAmount) / Number(g.targetAmount)) * 100,
          0
        ) / goals.length
      : 0;

  return {
    userId,
    monthlyIncome: Number(user.monthlyIncome),
    currency: user.currency as Currency,
    currentMonth: {
      totalIncome,
      totalExpenses,
      savingsRate,
      topCategories,
    },
    activeDebts: totalDebtBalance,
    savingsGoalsProgress: totalGoalProgress,
  };
}

export async function generateAIResponse(
  message: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  context: FinancialContext
): Promise<{ content: string; metadata: AIResponseMetadata }> {
  const { currency, monthlyIncome, currentMonth } = context;
  const sym = formatCurrency(0, currency).replace("0.00", "").trim();
  const model = "gpt-4o-mini";

  const confidence: "low" | "medium" | "high" =
    monthlyIncome > 0 && (currentMonth?.topCategories.length ?? 0) >= 3
      ? "high"
      : monthlyIncome > 0 || (currentMonth?.totalIncome ?? 0) > 0
        ? "medium"
        : "low";

  const disclaimer =
    "Educational guidance only, not financial, tax, or investment advice.";

  const systemPrompt = `You are Elbudget AI, a friendly and knowledgeable personal finance assistant embedded in the Elbudget app.

CURRENT USER FINANCIAL CONTEXT:
- Monthly Income: ${formatCurrency(monthlyIncome, currency)}
- This Month's Income: ${formatCurrency(currentMonth?.totalIncome ?? 0, currency)}
- This Month's Expenses: ${formatCurrency(currentMonth?.totalExpenses ?? 0, currency)}
- Savings Rate: ${currentMonth?.savingsRate.toFixed(1)}%
- Top Spending Categories: ${currentMonth?.topCategories.map((c) => `${c.name}: ${formatCurrency(c.amount, currency)}`).join(", ")}
- Total Active Debt: ${formatCurrency(context.activeDebts ?? 0, currency)}
- Average Savings Goal Progress: ${context.savingsGoalsProgress?.toFixed(1)}%

INSTRUCTIONS:
- Be concise, friendly, and actionable
- Use the user's currency (${currency}, symbol: ${sym})
- Give practical, context-aware suggestions grounded in the provided data
- Use bullet points for lists
- Keep responses under 300 words unless a detailed analysis is requested
- Discuss spending summaries, budgeting opportunities, debt reduction options, and savings habits
- Do not provide legal/tax/investment guarantees
- When uncertain, explicitly say what additional data is needed
- Include this disclaimer near the end: "${disclaimer}"
- Respond in plain markdown format`;

  const startedAt = Date.now();
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const content =
      response.choices[0]?.message?.content ??
      "I could not generate an AI response. Here's a basic spending summary and next step instead.";

    return {
      content,
      metadata: {
        model,
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
        latencyMs: Date.now() - startedAt,
        confidence,
        disclaimer,
      },
    };
  } catch {
    const fallback = buildDeterministicFallback(message, context);
    return {
      content: fallback,
      metadata: {
        model: "deterministic-fallback",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: Date.now() - startedAt,
        confidence: "medium",
        disclaimer,
      },
    };
  }
}

export async function generateMonthlyInsights(userId: string): Promise<
  { type: string; title: string; content: string; score?: number }[]
> {
  const context = await getFinancialContext(userId);
  const { currency, currentMonth, monthlyIncome } = context;

  const prompt = `Analyze this user's financial data and generate 3-5 specific, actionable insights:

Monthly Income: ${formatCurrency(monthlyIncome, currency)}
This Month's Income: ${formatCurrency(currentMonth?.totalIncome ?? 0, currency)}
This Month's Expenses: ${formatCurrency(currentMonth?.totalExpenses ?? 0, currency)}
Savings Rate: ${currentMonth?.savingsRate.toFixed(1)}%
Top Spending: ${currentMonth?.topCategories.map((c) => `${c.name}: ${formatCurrency(c.amount, currency)}`).join(", ")}
Total Debt: ${formatCurrency(context.activeDebts ?? 0, currency)}

Return a JSON array of insights with this structure:
[{"type": "SPENDING_PATTERN|SAVINGS_OPPORTUNITY|BUDGET_OPTIMIZATION|ANOMALY_DETECTED", "title": "Short title", "content": "1-2 sentence actionable insight", "score": 0.0-1.0}]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    return data.insights ?? [];
  } catch {
    return [];
  }
}

function buildDeterministicFallback(message: string, context: FinancialContext) {
  const income = context.currentMonth?.totalIncome ?? 0;
  const expenses = context.currentMonth?.totalExpenses ?? 0;
  const savings = income - expenses;
  const top = context.currentMonth?.topCategories?.slice(0, 3) ?? [];

  const lines = [
    "I could not reach AI services right now, so here is a deterministic summary:",
    `- This month income: ${formatCurrency(income, context.currency)}`,
    `- This month expenses: ${formatCurrency(expenses, context.currency)}`,
    `- Net savings: ${formatCurrency(savings, context.currency)}`,
    `- Savings rate: ${(context.currentMonth?.savingsRate ?? 0).toFixed(1)}%`,
  ];

  if (top.length > 0) {
    lines.push("- Top spending categories:");
    top.forEach((item) => {
      lines.push(`  - ${item.name}: ${formatCurrency(item.amount, context.currency)}`);
    });
  }

  if (/debt/i.test(message)) {
    lines.push("- Suggestion: prioritize the highest-interest debt while making minimum payments on others.");
  } else if (/save|saving|goal/i.test(message)) {
    lines.push("- Suggestion: set an automatic transfer right after payday and trim your top discretionary category by 10-15%.");
  } else {
    lines.push("- Suggestion: review your top spending category and set a concrete weekly cap.");
  }

  lines.push("Educational guidance only, not financial, tax, or investment advice.");
  return lines.join("\n");
}

export { openai };
