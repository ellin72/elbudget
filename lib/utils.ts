import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Currency } from "@/types";

// ─── TAILWIND ─────────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── CURRENCY ─────────────────────────────────────────────────────────────────

const currencySymbols: Record<Currency, string> = {
  NAD: "N$",
  USD: "$",
  ZAR: "R",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
};

const currencyLocales: Record<Currency, string> = {
  NAD: "en-NA",
  USD: "en-US",
  ZAR: "en-ZA",
  EUR: "de-DE",
  GBP: "en-GB",
  AUD: "en-AU",
  CAD: "en-CA",
};

export function formatCurrency(
  amount: number | string,
  currency: Currency = "NAD",
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currencySymbols[currency]}0.00`;

  if (currency === "NAD") {
    const formatted = new Intl.NumberFormat(currencyLocales[currency], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
      style: "decimal",
    }).format(num);
    return `${currencySymbols.NAD}${formatted}`;
  }

  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}

export function formatCompactCurrency(
  amount: number | string,
  currency: Currency = "NAD"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currencySymbols[currency]}0`;

  if (Math.abs(num) >= 1_000_000) {
    return `${currencySymbols[currency]}${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${currencySymbols[currency]}${(num / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(num, currency);
}

export function getCurrencySymbol(currency: Currency = "NAD"): string {
  return currencySymbols[currency] ?? "N$";
}

// ─── DATES ────────────────────────────────────────────────────────────────────

export function formatDate(
  date: Date | string,
  pattern: string = "MMM d, yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateShort(date: Date | string): string {
  return formatDate(date, "MMM d");
}

export function formatDateFull(date: Date | string): string {
  return formatDate(date, "MMMM d, yyyy");
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

export function getMonthRange(
  year: number,
  month: number
): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

// ─── NUMBERS ──────────────────────────────────────────────────────────────────

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return clampPercent((current / total) * 100);
}

export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ─── FINANCIAL ────────────────────────────────────────────────────────────────

export function calculateMonthlyInterest(
  balance: number,
  annualRate: number
): number {
  return roundTo((balance * (annualRate / 100)) / 12);
}

export function calculateDebtPayoffMonths(
  balance: number,
  monthlyPayment: number,
  annualRate: number
): number {
  if (monthlyPayment <= 0) return Infinity;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(balance / monthlyPayment);
  const months = Math.log(
    monthlyPayment / (monthlyPayment - balance * monthlyRate)
  ) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

export function calculate5030_20(income: number): {
  needs: number;
  wants: number;
  savings: number;
} {
  return {
    needs: roundTo(income * 0.5),
    wants: roundTo(income * 0.3),
    savings: roundTo(income * 0.2),
  };
}

export function calculateFinancialHealthScore(data: {
  savingsRate: number;
  debtToIncomeRatio: number;
  budgetAdherence: number;
  emergencyFundMonths: number;
}): { score: number; grade: string; color: string } {
  const { savingsRate, debtToIncomeRatio, budgetAdherence, emergencyFundMonths } = data;

  let score = 0;
  // Savings rate (0-30 points) - 20%+ is excellent
  score += Math.min(30, (savingsRate / 20) * 30);
  // Debt-to-income (0-30 points) - lower is better
  score += Math.max(0, 30 - (debtToIncomeRatio / 43) * 30);
  // Budget adherence (0-25 points)
  score += (budgetAdherence / 100) * 25;
  // Emergency fund (0-15 points) - 6 months is ideal
  score += Math.min(15, (emergencyFundMonths / 6) * 15);

  const finalScore = Math.round(clampPercent(score));

  let grade: string;
  let color: string;
  if (finalScore >= 85) { grade = "Excellent"; color = "#10b981"; }
  else if (finalScore >= 70) { grade = "Good"; color = "#3b82f6"; }
  else if (finalScore >= 55) { grade = "Fair"; color = "#f59e0b"; }
  else if (finalScore >= 40) { grade = "Needs Work"; color = "#ef4444"; }
  else { grade = "Critical"; color = "#dc2626"; }

  return { score: finalScore, grade, color };
}

// ─── COLORS ───────────────────────────────────────────────────────────────────

export const CATEGORY_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#14b8a6", "#06b6d4", "#3b82f6", "#a855f7",
];

export const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#14b8a6", "#06b6d4",
];

export function getProgressColor(percent: number): string {
  if (percent >= 90) return "#ef4444";
  if (percent >= 75) return "#f59e0b";
  if (percent >= 50) return "#3b82f6";
  return "#10b981";
}

// ─── STRING ───────────────────────────────────────────────────────────────────

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function generateAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`;
}

// ─── ARRAY ────────────────────────────────────────────────────────────────────

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const group = String(item[key]);
    return { ...groups, [group]: [...(groups[group] || []), item] };
  }, {} as Record<string, T[]>);
}

export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => sum + Number(item[key] ?? 0), 0);
}

// ─── MISC ─────────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function isServer(): boolean {
  return typeof window === "undefined";
}
