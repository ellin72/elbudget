"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import type { TransactionWithCategory } from "@/types";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  transactions: TransactionWithCategory[];
  currency?: string;
}

export default function RecentTransactions({ transactions, currency = "NAD" }: Props) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Transactions</h3>
        <Link href="/transactions" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No transactions yet. Add your first transaction!
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                tx.type === "INCOME" && "bg-green-100 dark:bg-green-900/30",
                tx.type === "EXPENSE" && "bg-red-100 dark:bg-red-900/30",
                tx.type === "TRANSFER" && "bg-blue-100 dark:bg-blue-900/30",
              )}>
                {tx.type === "INCOME" && <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />}
                {tx.type === "EXPENSE" && <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />}
                {tx.type === "TRANSFER" && <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.category?.name ?? "Uncategorized"} · {formatRelativeTime(tx.date)}
                </p>
              </div>
              <p className={cn(
                "text-sm font-semibold tabular-nums flex-shrink-0",
                tx.type === "INCOME" && "text-green-600 dark:text-green-400",
                tx.type === "EXPENSE" && "text-red-600 dark:text-red-400",
                tx.type === "TRANSFER" && "text-blue-600 dark:text-blue-400",
              )}>
                {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                {formatCurrency(Number(tx.amount), currency as any)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
