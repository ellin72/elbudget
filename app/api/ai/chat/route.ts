import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAIResponse, getFinancialContext } from "@/lib/ai";
import { aiChatSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = aiChatSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { message, conversationId } = parsed.data;

  let conversation;
  if (conversationId) {
    conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: { userId: session.user.id, title: message.slice(0, 60) },
      include: { messages: true },
    });
  }

  // Save user message
  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: message },
  });

  // Build message history for GPT
  const history = (conversation.messages ?? []).map((m: any) => ({
    role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));

  const context = await getFinancialContext(session.user.id);
  const aiReply = await generateAIResponse(message, history, context);

  // Save assistant message
  const saved = await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "ASSISTANT", content: aiReply },
  });

  return NextResponse.json({
    data: {
      conversationId: conversation.id,
      message: { id: saved.id, role: "ASSISTANT", content: aiReply, createdAt: saved.createdAt },
    },
  });
}
