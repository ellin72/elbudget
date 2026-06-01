"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  confidence?: "low" | "medium" | "high";
  disclaimer?: string;
}

export default function AIAssistantPage() {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || payload?.reason || "Failed to send message");
      }
      if (payload?.data?.blocked) {
        throw new Error(`${payload.data.reason}. Upgrade plan or wait for monthly reset.`);
      }
      return payload;
    },
    onSuccess: (data) => {
      setConversationId(data.data.conversationId);
      setMessages((prev) => [...prev, data.data.message]);
    },
    onError: () => toast.error("Failed to get AI response"),
  });

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "USER",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    mutation.mutate(input.trim());
    setInput("");
  };

  const suggestions = [
    "How am I spending this month?",
    "Help me create a savings plan",
    "Analyze my budget and give tips",
    "How can I pay off my debt faster?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> AI Financial Assistant
        </h2>
        <p className="text-sm text-muted-foreground">Ask anything about your finances — powered by GPT-4o mini</p>
        <p className="text-xs text-muted-foreground mt-1">
          AI responses are educational only and not financial, investment, or tax advice.
        </p>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your AI Money Coach</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                  I have access to your financial data and can give personalized advice.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const userMsg: Message = {
                        id: Date.now().toString(),
                        role: "USER",
                        content: s,
                        createdAt: new Date().toISOString(),
                      };
                      setMessages((prev) => [...prev, userMsg]);
                      mutation.mutate(s);
                    }}
                    className="px-4 py-3 rounded-xl border border-border text-sm hover:bg-accent text-left transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "USER" && "flex-row-reverse")}>
              <div className={cn(
                "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center",
                msg.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {msg.role === "USER" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === "USER"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}>
                {msg.content}
                {msg.role === "ASSISTANT" && (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {msg.confidence ? `Confidence: ${msg.confidence}. ` : ""}
                    {msg.disclaimer ?? "Educational guidance only."}
                  </div>
                )}
              </div>
            </div>
          ))}

          {mutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about your finances…"
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || mutation.isPending}
              aria-label="Send message"
              className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shadow-glow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
