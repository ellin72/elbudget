import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
): Promise<string> {
  const { currency, monthlyIncome, currentMonth } = context;
  const sym = formatCurrency(0, currency).replace("0.00", "").trim();

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
- Give specific, personalized recommendations based on their data
- Use bullet points for lists
- Keep responses under 300 words unless a detailed analysis is requested
- You can discuss budgeting, saving, debt management, investing, and general financial planning
- Do not give specific investment advice or guarantee returns
- Respond in plain markdown format`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? "I apologize, I couldn't generate a response. Please try again.";
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

export { openai };
