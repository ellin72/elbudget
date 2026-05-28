"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, CreditCard, Loader2, TrendingDown, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { debtSchema, type DebtInput } from "@/lib/validations";
import { formatCurrency, calculatePercentage, calculateDebtPayoffMonths } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

async function fetchDebts() {
  const res = await fetch("/api/debts");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const DEBT_TYPE_LABELS: Record<string, string> = {
  CREDIT_CARD: "Credit Card", STUDENT_LOAN: "Student Loan", CAR_LOAN: "Car Loan",
  MORTGAGE: "Mortgage", PERSONAL_LOAN: "Personal Loan", MEDICAL: "Medical", OTHER: "Other",
};

function DebtCard({ debt, currency }: { debt: any; currency: string }) {
  const paid = debt.originalAmount - debt.balance;
  const pct = calculatePercentage(paid, debt.originalAmount);
  const monthsLeft = calculateDebtPayoffMonths(debt.balance, debt.minimumPayment, debt.interestRate);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{debt.name}</h3>
          <span className="text-xs text-muted-foreground">{DEBT_TYPE_LABELS[debt.type] ?? debt.type}</span>
        </div>
        <div className="text-right">
          <p className="font-bold text-destructive">{formatCurrency(debt.balance, currency as any)}</p>
          <p className="text-xs text-muted-foreground">remaining</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Paid off: {formatCurrency(paid, currency as any)}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Rate", value: `${debt.interestRate}%` },
          { label: "Min. Payment", value: formatCurrency(debt.minimumPayment, currency as any) },
          { label: "Est. Payoff", value: monthsLeft < 120 ? `${monthsLeft}mo` : ">10yr" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-muted/50 rounded-xl p-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DebtForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<DebtInput>({ resolver: zodResolver(debtSchema) });
  const mutation = useMutation({
    mutationFn: async (data: DebtInput) => {
      const res = await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["debts"] }); toast.success("Debt added!"); onClose(); },
    onError: () => toast.error("Failed to add debt"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-3xl border border-border p-6 w-full max-w-md z-10 space-y-4">
        <h2 className="text-lg font-semibold">Add Debt</h2>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Debt Name</label>
            <input {...register("name")} placeholder="e.g. Student Loan" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select {...register("type")} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {Object.entries(DEBT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "originalAmount", label: "Total Amount", placeholder: "0.00" },
              { name: "minimumPayment", label: "Min. Payment", placeholder: "0.00" },
              { name: "interestRate", label: "Interest Rate (%)", placeholder: "0.00" },
            ].map(({ name, label, placeholder }) => (
              <div key={name} className="space-y-1">
                <label className="text-sm font-medium">{label}</label>
                <input {...register(name as any, { valueAsNumber: true })} type="number" step="0.01" placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-accent text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add Debt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DebtsPage() {
  const { currency } = useUIStore();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["debts"], queryFn: fetchDebts });
  const debts = data?.data ?? [];
  const totalDebt = debts.reduce((s: number, d: any) => s + d.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Debt Management</h2>
          <p className="text-sm text-muted-foreground">Track and pay off your debts strategically</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-glow">
          <Plus className="w-4 h-4" /> Add Debt
        </button>
      </div>

      {debts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-4">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Total Outstanding Debt</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt, currency as any)}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <CreditCard className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground">No debts tracked. Add one to monitor your payoff progress.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Add Debt</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {debts.map((debt: any) => <DebtCard key={debt.id} debt={debt} currency={currency} />)}
        </div>
      )}

      {showForm && <DebtForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
