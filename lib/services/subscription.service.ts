import { prisma } from "@/lib/prisma";
import { PLAN_FEATURES } from "@/types";

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

export async function setSubscriptionFromStripe(params: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: string;
  status?: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date | null;
}) {
  if (!params.stripeCustomerId && !params.stripeSubscriptionId) {
    return null;
  }

  const existing = await prisma.subscription.findFirst({
    where: {
      OR: [
        params.stripeCustomerId ? { stripeCustomerId: params.stripeCustomerId } : undefined,
        params.stripeSubscriptionId ? { stripeSubscriptionId: params.stripeSubscriptionId } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.subscription.update({
    where: { id: existing.id },
    data: {
      plan: params.plan ?? existing.plan,
      status: params.status ?? existing.status,
      stripeCustomerId: params.stripeCustomerId ?? existing.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId ?? existing.stripeSubscriptionId,
      currentPeriodStart: params.currentPeriodStart ?? existing.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd ?? existing.currentPeriodEnd,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? existing.cancelAtPeriodEnd,
      trialEnd: params.trialEnd ?? existing.trialEnd,
    },
  });
}

export function mapStripePriceToPlan(stripePriceId?: string | null) {
  if (!stripePriceId) return "FREE";
  if (stripePriceId.toLowerCase().includes("business")) return "BUSINESS";
  return "PREMIUM";
}

export function getPlanCapabilities(plan: string) {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.FREE;
}
