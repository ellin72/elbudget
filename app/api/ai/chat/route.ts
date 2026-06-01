import { apiOk, unexpectedApiError } from "@/lib/server/api";
import { requireUserId } from "@/lib/server/auth";
import { parseAndValidate } from "@/lib/server/validation";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { sendAIConversationTurn } from "@/lib/services/ai.service";
import { aiChatSchema } from "@/lib/validations";
import { enforceAiChatQuota } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "ai-chat", {
      max: 25,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const authResult = await requireUserId();
    if (!authResult.ok) return authResult.response;

    const quota = await enforceAiChatQuota(authResult.userId);
    if (!quota.allowed) {
      return apiOk({
        blocked: true,
        reason: "AI monthly limit reached",
        plan: quota.plan,
        usage: {
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
        },
      }, { status: 429 });
    }

    const parsed = await parseAndValidate(request, aiChatSchema);
    if (!parsed.ok) return parsed.response;

    const data = await sendAIConversationTurn(authResult.userId, {
      message: parsed.data.message,
      conversationId: parsed.data.conversationId,
    });

    return apiOk({
      ...data,
      usage: {
        used: quota.used + 1,
        limit: quota.limit,
        remaining: quota.remaining === null ? null : Math.max(0, quota.remaining - 1),
      },
      plan: quota.plan,
    });
  } catch (error) {
    return unexpectedApiError(error);
  }
}
