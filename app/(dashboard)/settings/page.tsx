"use client";

import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/useUIStore";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, User, Bell, CreditCard, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userProfileSchema, type UserProfileInput } from "@/lib/validations";

const CURRENCY_OPTIONS = [
  { value: "NAD", label: "NAD (N$) – Namibian Dollar" },
  { value: "USD", label: "USD ($) – US Dollar" },
  { value: "ZAR", label: "ZAR (R) – South African Rand" },
  { value: "EUR", label: "EUR (€) – Euro" },
  { value: "GBP", label: "GBP (£) – British Pound" },
];

const NOTIFICATION_DEFAULTS = {
  budgetAlerts: true,
  aiInsights: true,
  goalMilestones: true,
  billReminders: true,
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { currency, setCurrency } = useUIStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"profile" | "notifications" | "subscription">("profile");
  const [notifications, setNotifications] = useState(NOTIFICATION_DEFAULTS);

  const { data: profileData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      monthlyIncome: undefined,
    },
  });

  useEffect(() => {
    if (!profileData) return;
    reset({
      name: profileData.name ?? "",
      monthlyIncome: profileData.monthlyIncome ?? undefined,
    });
    if (profileData.currency) {
      setCurrency(profileData.currency);
    }
  }, [profileData, reset, setCurrency]);

  const mutation = useMutation({
    mutationFn: async (data: UserProfileInput) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, currency }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const notifMutation = useMutation({
    mutationFn: async (prefs: typeof NOTIFICATION_DEFAULTS) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: prefs }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => toast.success("Notification preferences saved!"),
    onError: () => toast.error("Failed to save preferences"),
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "subscription", label: "Subscription", icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-semibold">Personal Information</h3>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            {[
              { name: "name", label: "Full Name", placeholder: "Your name" },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name} className="space-y-1.5">
                <label className="text-sm font-medium">{label}</label>
                <input {...register(name as any)} type={type ?? "text"} placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monthly Income</label>
              <input
                {...register("monthlyIncome", { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 25000"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.monthlyIncome && <p className="text-xs text-destructive">{errors.monthlyIncome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as any)}
                title="Currency"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {CURRENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <button type="submit" disabled={mutation.isPending}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </form>
        </div>
      )}

      {tab === "notifications" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-semibold">Notification Preferences</h3>
          <div className="space-y-4">
            {([
              { key: "budgetAlerts" as const, label: "Budget alerts", description: "Get notified when you're close to your budget limit" },
              { key: "aiInsights" as const, label: "AI insights", description: "Receive weekly AI-powered financial tips" },
              { key: "goalMilestones" as const, label: "Goal milestones", description: "Celebrate when you reach goal milestones" },
              { key: "billReminders" as const, label: "Bill reminders", description: "Reminders for upcoming recurring payments" },
            ]).map(({ key, label, description }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                  <input
                    type="checkbox"
                    aria-label={label}
                    className="sr-only peer"
                    checked={notifications[key]}
                    onChange={(e) => setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <div className="w-10 h-6 bg-muted peer-checked:bg-primary rounded-full peer-focus:ring-2 peer-focus:ring-ring transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={() => notifMutation.mutate(notifications)}
            disabled={notifMutation.isPending}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
          >
            {notifMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Preferences
          </button>
        </div>
      )}

      {tab === "subscription" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-semibold">Your Plan</h3>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-primary">Free Plan</p>
              <p className="text-sm text-muted-foreground">N$0 / month</p>
            </div>
            <Shield className="w-8 h-8 text-primary/40" />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {["Up to 100 transactions/month", "Basic AI insights (3/month)", "2 savings goals", "Basic reports"].map((f) => (
              <p key={f} className="flex items-center gap-2">✓ {f}</p>
            ))}
          </div>
          <button
            onClick={() => toast.info("Premium plan coming soon! We'll notify you when it launches.")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow"
          >
            Upgrade to Premium — N$149/month
          </button>
        </div>
      )}
    </div>
  );
}
