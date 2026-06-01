"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Target, Loader2, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { goalSchema, type GoalInput } from "@/lib/validations";
import { formatCurrency, getProgressColor, calculatePercentage } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { format, differenceInDays, endOfMonth } from "date-fns";

async function fetchGoals() {
  const res = await fetch("/api/goals");
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

function GoalCard({ goal, currency }: { goal: any; currency: string }) {
  const queryClient = useQueryClient();
  const [contributing, setContributing] = useState(false);
  const [amount, setAmount] = useState("");
  const pct = calculatePercentage(goal.currentAmount, goal.targetAmount);
  const color = getProgressColor(pct);
  const daysLeft = goal.targetDate ? differenceInDays(new Date(goal.targetDate), new Date()) : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), date: new Date().toISOString().split("T")[0] }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Contribution added!");
      setContributing(false);
      setAmount("");
    },
    onError: () => toast.error("Failed to add contribution"),
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{goal.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly savings challenge</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${pct >= 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Saved</span>
          <span className="font-medium">{formatCurrency(goal.currentAmount, currency as any)} / {formatCurrency(goal.targetAmount, currency as any)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color === "green" ? "bg-green-500" : color === "yellow" ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      {daysLeft !== null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {daysLeft > 0 ? `${daysLeft} days remaining to win this challenge` : "Challenge deadline passed"}
        </div>
      )}

      {contributing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={!amount || mutation.isPending}
            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
          </button>
          <button onClick={() => setContributing(false)} className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-accent">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setContributing(true)}
          className="w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Progress
        </button>
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
