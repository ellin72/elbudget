import { apiOk, unexpectedApiError } from "@/lib/server/api";
import { requireUserId } from "@/lib/server/auth";
import { getUserSubscription, getPlanCapabilities } from "@/lib/services/subscription.service";

export async function GET() {
  try {
    const authResult = await requireUserId();
    if (!authResult.ok) return authResult.response;

    const subscription = await getUserSubscription(authResult.userId);
    const plan = subscription?.plan || "FREE";

    return apiOk({
      subscription,
      capabilities: getPlanCapabilities(plan),
    });
  } catch (error) {
    return unexpectedApiError(error);
  }
}
