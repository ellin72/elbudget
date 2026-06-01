"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Plus, Target, Loader2, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { goalSchema, type GoalInput } from "@/lib/validations";
import { formatCurrency, calculatePercentage } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { format, differenceInDays, endOfMonth } from "date-fns";

async function fetchGoals() {
  const res = await fetch("/api/goals");
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

function GoalCard({ goal, currency }: { goal: any; currency: string }) {
  const trackedAmount = Number(goal.challengeStatus?.monthlySavedAmount ?? goal.currentAmount ?? 0);
  const targetAmount = Number(goal.targetAmount ?? 0);
  const pct = calculatePercentage(trackedAmount, targetAmount);
  const achieved = Boolean(goal.challengeStatus?.isAchieved ?? (trackedAmount >= targetAmount));
  const shortfall = Number(goal.challengeStatus?.shortfall ?? Math.max(0, targetAmount - trackedAmount));
  const suggestions = goal.challengeStatus?.suggestions ?? [];
  const progressValue = Math.min(Math.max(pct, 0), 100);
  const daysLeft = goal.targetDate ? differenceInDays(new Date(goal.targetDate), new Date()) : null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{goal.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Auto-tracked from this month&apos;s savings</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${achieved ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Saved This Month</span>
          <span className="font-medium">{formatCurrency(trackedAmount, currency as any)} / {formatCurrency(targetAmount, currency as any)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <progress
            value={progressValue}
            max={100}
            className={`w-full h-2 [appearance:none] [&::-webkit-progress-bar]:bg-muted ${
              achieved
                ? "[&::-webkit-progress-value]:bg-green-500 [&::-moz-progress-bar]:bg-green-500"
                : "[&::-webkit-progress-value]:bg-red-500 [&::-moz-progress-bar]:bg-red-500"
            }`}
          />
        </div>
      </div>

      {daysLeft !== null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {daysLeft > 0 ? `${daysLeft} days remaining to win this challenge` : "Challenge deadline passed"}
        </div>
      )}

      {!achieved ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 space-y-2">
          <p className="font-medium">
            Challenge is behind by {formatCurrency(shortfall, currency as any)}.
          </p>
          {suggestions.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide opacity-80">Where to spend less (unbudgeted)</p>
              {suggestions.map((item: any) => (
                <p key={item.category}>
                  {item.category}: {formatCurrency(Number(item.amount), currency as any)}. {item.suggestion}
                </p>
              ))}
            </div>
          ) : (
            <p>No unbudgeted spending found this month. Focus on reducing discretionary expenses.</p>
          )}
          <Link
            href="/transactions?unbudgetedOnly=true"
            className="inline-flex items-center rounded-lg border border-red-300/70 px-2.5 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            Review Unbudgeted Transactions
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300">
          Challenge on track. Keep this momentum through month end.
        </div>
      )}
    </div>
  );
}

function GoalForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      targetDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
  });
  const mutation = useMutation({
    mutationFn: async (data: GoalInput) => {
      const res = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["goals"] }); toast.success("Goal created!"); onClose(); },
    onError: () => toast.error("Failed to create goal"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-3xl border border-border p-6 w-full max-w-md z-10 space-y-4">
        <h2 className="text-lg font-semibold">New Savings Challenge</h2>
        <p className="text-sm text-muted-foreground">Set a saving target and aim to complete it by month end.</p>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          {[
            { name: "name", label: "Challenge Name", placeholder: "e.g. Save N$5,000 by month end" },
            { name: "targetAmount", label: "Amount to Save", placeholder: "0.00", type: "number" },
            { name: "targetDate", label: "Deadline", type: "date" },
          ].map(({ name, label, placeholder, type }) => (
            <div key={name} className="space-y-1">
              <label className="text-sm font-medium">{label}</label>
              <input {...register(name as any, { valueAsNumber: type === "number" })} type={type ?? "text"} placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-accent text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Start Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const { currency } = useUIStore();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["goals"], queryFn: fetchGoals });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Savings Challenges</h2>
          <p className="text-sm text-muted-foreground">Set monthly targets and track your progress to the finish line</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-glow">
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : data?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Target className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground">No challenges yet. Create your first monthly savings challenge!</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Create Challenge</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((goal: any) => <GoalCard key={goal.id} goal={goal} currency={currency} />)}
        </div>
      )}

      {showForm && <GoalForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
