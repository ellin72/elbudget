"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations";

const BUDGET_STYLES = [
  {
    id: "RULE_50_30_20",
    name: "50/30/20 Rule",
    desc: "50% needs, 30% wants, 20% savings",
    icon: "🎯",
  },
  {
    id: "ZERO_BASED",
    name: "Zero-Based",
    desc: "Every dollar has a job",
    icon: "💯",
  },
  {
    id: "ENVELOPE",
    name: "Envelope Method",
    desc: "Allocate cash to envelopes",
    icon: "✉️",
  },
  { id: "CUSTOM", name: "Custom", desc: "Build your own system", icon: "⚡" },
];

const CURRENCIES = [
  { value: "NAD", label: "Namibian Dollar (N$)", flag: "🇳🇦" },
  { value: "USD", label: "US Dollar ($)", flag: "🇺🇸" },
  { value: "ZAR", label: "South African Rand (R)", flag: "🇿🇦" },
  { value: "EUR", label: "Euro (€)", flag: "🇪🇺" },
  { value: "GBP", label: "British Pound (£)", flag: "🇬🇧" },
];

const STEPS = [
  { title: "Income Setup", desc: "Tell us about your income" },
  { title: "Budget Style", desc: "Choose your approach" },
  { title: "Currency", desc: "Select your currency" },
  { title: "All Set!", desc: "You're ready to go" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(0);

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } =
    useForm<OnboardingInput>({
      resolver: zodResolver(onboardingSchema),
      defaultValues: {
        monthlyIncome: 0,
        budgetStyle: "RULE_50_30_20",
        currency: "NAD",
      },
    });

  const selectedStyle = watch("budgetStyle");
  const selectedCurrency = watch("currency");

  const onSubmit = async (data: OnboardingInput) => {
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        toast.error("Failed to save settings");
        return;
      }

      await update({ onboardingDone: true });
      setStep(3);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={i} className={`flex items-center ${i < 2 ? "flex-1" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {Math.min(step + 1, 3)} of 3 — {STEPS[step]?.desc}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome! 👋</h1>
                <p className="text-muted-foreground">
                  Let&apos;s start with your monthly income
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">N$</span>
                  <input
                    {...register("monthlyIncome")}
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 text-xl font-semibold rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Include salary, freelance, or any regular income. You can
                  change this later.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Salary Date (optional)</label>
                <select
                  {...register("salaryDate")}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select day of month</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-glow"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold mb-1">Choose your budget style</h1>
                <p className="text-muted-foreground">
                  How do you want to manage your money?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {BUDGET_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setValue("budgetStyle", style.id as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedStyle === style.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl">{style.icon}</span>
                    <p className="font-semibold text-sm mt-2">{style.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{style.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-accent transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-glow"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold mb-1">Choose your currency</h1>
                <p className="text-muted-foreground">
                  We&apos;ll use this for all your transactions and reports
                </p>
              </div>

              <div className="space-y-2">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.value}
                    type="button"
                    onClick={() => setValue("currency", currency.value as any)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedCurrency === currency.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl">{currency.flag}</span>
                    <span className="text-sm font-medium">{currency.label}</span>
                    {selectedCurrency === currency.value && (
                      <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-accent transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Complete Setup <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">You&apos;re all set! 🎉</h1>
                <p className="text-muted-foreground">
                  Your Elbudget account is ready. Let&apos;s start your financial
                  journey!
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-glow"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
