import { prisma } from "@/lib/prisma";
import { PLAN_FEATURES } from "@/types";

export type PlanName = "FREE" | "PREMIUM" | "BUSINESS";

function normalizePlan(plan?: string | null): PlanName {
  if (plan === "PREMIUM" || plan === "BUSINESS") return plan;
  return "FREE";
}

export async function getUserPlan(userId: string): Promise<PlanName> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  if (!subscription || subscription.status !== "ACTIVE") return "FREE";
  return normalizePlan(subscription.plan);
}

export async function getPlanFeaturesForUser(userId: string) {
  const plan = await getUserPlan(userId);
  return {
    plan,
    features: PLAN_FEATURES[plan],
  };
}

export async function enforceCreationLimit(
  userId: string,
  entity: "budgets" | "goals" | "debts"
): Promise<{ allowed: true; plan: PlanName } | { allowed: false; plan: PlanName; limit: number }> {
  const { plan, features } = await getPlanFeaturesForUser(userId);

  const limit =
    entity === "budgets"
      ? features.maxBudgets
      : entity === "goals"
        ? features.maxGoals
        : features.maxDebts;

  if (limit === null) return { allowed: true, plan };

  const count =
    entity === "budgets"
      ? await prisma.budget.count({ where: { userId } })
      : entity === "goals"
        ? await prisma.goal.count({ where: { userId } })
        : await prisma.debt.count({ where: { userId, isPaidOff: false } });

  if (count >= limit) {
    return { allowed: false, plan, limit };
  }

  return { allowed: true, plan };
}

export async function getAiUsageForCurrentMonth(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [assistantResponses, generatedInsights] = await Promise.all([
    prisma.aIMessage.count({
      where: {
        conversation: { userId },
        role: "ASSISTANT",
        createdAt: { gte: monthStart },
      },
    }),
    prisma.aIInsight.count({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  return { assistantResponses, generatedInsights };
}

export async function enforceAiChatQuota(userId: string) {
  const { plan, features } = await getPlanFeaturesForUser(userId);
  const { assistantResponses } = await getAiUsageForCurrentMonth(userId);

  if (features.aiMessagesPerMonth === null) {
    return {
      allowed: true as const,
      plan,
      remaining: null,
      used: assistantResponses,
      limit: null,
    };
  }

  const remaining = Math.max(0, features.aiMessagesPerMonth - assistantResponses);
  if (assistantResponses >= features.aiMessagesPerMonth) {
    return {
      allowed: false as const,
      plan,
      remaining: 0,
      used: assistantResponses,
      limit: features.aiMessagesPerMonth,
    };
  }

  return {
    allowed: true as const,
    plan,
    remaining,
    used: assistantResponses,
    limit: features.aiMessagesPerMonth,
  };
}

export async function enforceAiInsightsQuota(userId: string) {
  const { plan, features } = await getPlanFeaturesForUser(userId);
  const { generatedInsights } = await getAiUsageForCurrentMonth(userId);

  if (!features.aiInsights) {
    return {
      allowed: false as const,
      plan,
      remaining: 0,
      used: generatedInsights,
      limit: features.aiInsightsPerMonth,
    };
  }

  if (features.aiInsightsPerMonth === null) {
    return {
      allowed: true as const,
      plan,
      remaining: null,
      used: generatedInsights,
      limit: null,
    };
  }

  const remaining = Math.max(0, features.aiInsightsPerMonth - generatedInsights);
  if (generatedInsights >= features.aiInsightsPerMonth) {
    return {
      allowed: false as const,
      plan,
      remaining: 0,
      used: generatedInsights,
      limit: features.aiInsightsPerMonth,
    };
  }

  return {
    allowed: true as const,
    plan,
    remaining,
    used: generatedInsights,
    limit: features.aiInsightsPerMonth,
  };
}
