"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GoalWithContributions } from "@/types";
import { formatCurrency, calculatePercentage, getProgressColor } from "@/lib/utils";

interface Props {
  goals: GoalWithContributions[];
  currency?: string;
}

export default function SavingsProgress({ goals, currency = "NAD" }: Props) {
  if (goals.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Savings Challenges</h3>
          <Link href="/goals" className="text-xs text-primary hover:underline flex items-center gap-1">
            Create challenge <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="py-8 text-center text-muted-foreground text-sm">
          No challenges set yet. Create your first monthly savings challenge!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Savings Challenges</h3>
        <Link href="/goals" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-4">
        {goals.slice(0, 4).map((goal) => {
          const progress = calculatePercentage(Number(goal.currentAmount), Number(goal.targetAmount));
          const color = getProgressColor(progress);
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {goal.icon && <span className="text-lg">{goal.icon}</span>}
                  <p className="text-sm font-medium">{goal.name}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{progress.toFixed(0)}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(goal.currentAmount), currency as any)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(goal.targetAmount), currency as any)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
