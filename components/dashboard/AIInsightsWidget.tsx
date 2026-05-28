"use client";

import { Brain, TrendingDown, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import type { AIInsight } from "@prisma/client";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  insights: AIInsight[];
}

const INSIGHT_CONFIG: Record<string, { icon: typeof Brain; color: string; bg: string }> = {
  SPENDING_ALERT: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
  SAVINGS_OPPORTUNITY: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
  BUDGET_WARNING: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
  GOAL_PROGRESS: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  GENERAL_TIP: { icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
};

export default function AIInsightsWidget({ insights }: Props) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-xl bg-brand-gradient flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="font-semibold">AI Insights</h3>
        <span className="text-xs text-muted-foreground ml-auto">This month</span>
      </div>

      {insights.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-sm">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No insights yet. Add more transactions to get AI analysis!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.slice(0, 3).map((insight) => {
            const config = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG.GENERAL_TIP;
            const Icon = config.icon;
            return (
              <div key={insight.id} className={cn("flex gap-3 p-3 rounded-xl", config.bg)}>
                <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {insight.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
