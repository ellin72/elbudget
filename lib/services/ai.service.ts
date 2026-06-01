import { prisma } from "@/lib/prisma";
import { generateAIResponse, getFinancialContext } from "@/lib/ai";
import { logAuditEvent } from "@/lib/server/audit";

export async function getOrCreateConversationForUser(userId: string, conversationId: string | undefined, firstMessage: string) {
  if (conversationId) {
    const existing = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.aIConversation.create({
    data: { userId, title: firstMessage.slice(0, 60) },
    include: { messages: true },
  });
}

export async function sendAIConversationTurn(userId: string, params: { conversationId?: string; message: string }) {
  const conversation = await getOrCreateConversationForUser(userId, params.conversationId, params.message);

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: params.message },
  });

  const history = (conversation.messages ?? [])
    .slice(-12)
    .map((m: { role: string; content: string }) => ({
    role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));

  const context = await getFinancialContext(userId);
  const aiResult = await generateAIResponse(params.message, history, context);

  const saved = await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "ASSISTANT", content: aiResult.content },
  });

  await logAuditEvent({
    userId,
    action: "AI_CHAT_RESPONSE_GENERATED",
    resource: "ai-chat",
    resourceId: conversation.id,
    metadata: {
      model: aiResult.metadata.model,
      promptTokens: aiResult.metadata.promptTokens,
      completionTokens: aiResult.metadata.completionTokens,
      totalTokens: aiResult.metadata.totalTokens,
      latencyMs: aiResult.metadata.latencyMs,
      confidence: aiResult.metadata.confidence,
      promptChars: params.message.length,
      responseChars: aiResult.content.length,
    },
  });

  return {
    conversationId: conversation.id,
    message: {
      id: saved.id,
      role: "ASSISTANT",
      content: aiResult.content,
      createdAt: saved.createdAt,
      confidence: aiResult.metadata.confidence,
      disclaimer: aiResult.metadata.disclaimer,
      usage: {
        model: aiResult.metadata.model,
        totalTokens: aiResult.metadata.totalTokens,
        latencyMs: aiResult.metadata.latencyMs,
      },
    },
  };
}
