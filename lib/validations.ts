import { z } from "zod";

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── ONBOARDING ───────────────────────────────────────────────────────────────

export const onboardingSchema = z.object({
  monthlyIncome: z.coerce.number().min(0, "Income must be positive"),
  salaryDate: z.coerce.number().min(1).max(31).optional(),
  budgetStyle: z.enum(["RULE_50_30_20", "ZERO_BASED", "ENVELOPE", "CUSTOM"]),
  currency: z.enum(["NAD", "USD", "ZAR", "EUR", "GBP", "AUD", "CAD"]),
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(200),
  categoryId: z.string().cuid().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(500).optional().nullable(),
  tags: z.array(z.string()).optional(),
  merchantName: z.string().max(100).optional().nullable(),
  recurringId: z.string().optional().nullable(),
});

export const transactionFilterSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "ALL"]).optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export const budgetItemSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.string().cuid().optional().nullable(),
  allocatedAmount: z.coerce.number().positive("Amount must be positive"),
  color: z.string().optional(),
});

export const budgetSchema = z.object({
  name: z.string().min(1, "Budget name is required").max(100),
  period: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  startDate: z.string().min(1, "Start date is required"),
  style: z.enum(["RULE_50_30_20", "ZERO_BASED", "ENVELOPE", "CUSTOM"]),
  items: z.array(budgetItemSchema).min(1, "Add at least one budget item"),
});

// ─── GOALS ────────────────────────────────────────────────────────────────────

export const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().optional(),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  targetDate: z.string().optional().nullable(),
  monthlyContrib: z.coerce.number().min(0).optional().nullable(),
  priority: z.coerce.number().min(1).max(5).default(1),
  color: z.string().optional(),
});

export const goalContributionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().max(200).optional().nullable(),
  date: z.string().optional(),
});

// ─── DEBTS ────────────────────────────────────────────────────────────────────

export const debtSchema = z.object({
  name: z.string().min(1, "Debt name is required").max(100),
  type: z.enum([
    "CREDIT_CARD", "PERSONAL_LOAN", "MORTGAGE", "AUTO_LOAN",
    "STUDENT_LOAN", "MEDICAL", "OTHER",
  ]),
  originalAmount: z.coerce.number().positive("Amount must be positive"),
  currentBalance: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0).max(100),
  minimumPayment: z.coerce.number().min(0),
  dueDate: z.coerce.number().min(1).max(31).optional().nullable(),
  lender: z.string().max(100).optional().nullable(),
  strategy: z.enum(["SNOWBALL", "AVALANCHE", "CUSTOM"]),
  startDate: z.string().optional(),
});

export const debtPaymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
  notes: z.string().max(200).optional().nullable(),
  date: z.string().optional(),
});

// ─── RECURRING ────────────────────────────────────────────────────────────────

export const recurringItemSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  nextDueDate: z.string().min(1),
  categoryId: z.string().cuid().optional().nullable(),
  icon: z.string().optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
  autoPost: z.boolean().default(false),
});

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export const userProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  currency: z.enum(["NAD", "USD", "ZAR", "EUR", "GBP", "AUD", "CAD"]).optional(),
  timezone: z.string().optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
  salaryDate: z.coerce.number().min(1).max(31).optional().nullable(),
  budgetStyle: z.enum(["RULE_50_30_20", "ZERO_BASED", "ENVELOPE", "CUSTOM"]).optional(),
  notifyEmail: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
});

// ─── CATEGORY ─────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
});

// ─── AI CHAT ──────────────────────────────────────────────────────────────────

export const aiChatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().cuid().optional(),
});

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type RecurringItemInput = z.infer<typeof recurringItemSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type AIChatInput = z.infer<typeof aiChatSchema>;
