"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useUIStore } from "@/store/useUIStore";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, User, Bell, CreditCard, Shield, KeyRound } from "lucide-react";
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
  const [tab, setTab] = useState<"profile" | "notifications" | "subscription" | "security">("profile");
  const [notifications, setNotifications] = useState(NOTIFICATION_DEFAULTS);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [setupPayload, setSetupPayload] = useState<null | { qrCodeDataUrl: string; manualEntryKey: string }>(null);

  const { data: profileData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const twoFactorStatusQuery = useQuery({
    queryKey: ["two-factor-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/2fa/setup");
      if (!res.ok) throw new Error("Failed to load 2FA status");
      return res.json();
    },
  });

  const securityEventsQuery = useQuery({
    queryKey: ["security-events"],
    queryFn: async () => {
      const res = await fetch("/api/user/sessions");
      if (!res.ok) throw new Error("Failed to load security activity");
      return res.json();
    },
  });

  const { register, handleSubmit, reset, setFocus, formState: { errors } } = useForm<UserProfileInput>({
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

  useEffect(() => {
    if (tab !== "profile") return;
    if (!profileData) return;
    if ((profileData.monthlyIncome ?? 0) > 0) return;
    setTimeout(() => setFocus("monthlyIncome"), 0);
  }, [tab, profileData, setFocus]);

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
      queryClient.invalidateQueries({ queryKey: ["reports"] });
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
    { id: "security", label: "Security", icon: KeyRound },
  ] as const;

  const startTwoFactorSetup = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to start setup");
      return data;
    },
    onSuccess: (data) => {
      setSetupPayload({
        qrCodeDataUrl: data.data.qrCodeDataUrl,
        manualEntryKey: data.data.manualEntryKey,
      });
      toast.success("Scan the QR code with your authenticator app.");
      queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const verifyTwoFactor = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to verify code");
      return data;
    },
    onSuccess: () => {
      setSetupPayload(null);
      setTwoFactorCode("");
      toast.success("Two-factor authentication enabled.");
      queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      queryClient.invalidateQueries({ queryKey: ["security-events"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disableTwoFactor = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to disable 2FA");
      return data;
    },
    onSuccess: () => {
      setSetupPayload(null);
      setTwoFactorCode("");
      toast.success("Two-factor authentication disabled.");
      queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      queryClient.invalidateQueries({ queryKey: ["security-events"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

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
          {(profileData?.monthlyIncome ?? 0) <= 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
              Your monthly income is not set yet. Add it below so the dashboard can show accurate income and savings numbers.
            </div>
          )}
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            {[
              { name: "name", label: "Full Name", placeholder: "Your name" },
            ].map(({ name, label, placeholder }) => (
              <div key={name} className="space-y-1.5">
                <label className="text-sm font-medium">{label}</label>
                <input {...register(name as any)} type="text" placeholder={placeholder}
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
              <p className="font-semibold text-primary">{profileData?.subscription?.plan ?? "FREE"} Plan</p>
              <p className="text-sm text-muted-foreground">
                {profileData?.subscription?.plan === "PREMIUM" ? "N$149 / month" : "N$0 / month"}
              </p>
            </div>
            <Shield className="w-8 h-8 text-primary/40" />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              "Free: up to 3 budgets, 3 goals, and 5 active debts",
              "Free: AI assistant up to 30 responses/month and 3 generated AI insight batches/month",
              "Free: report history up to 6 months and CSV export",
              "Premium: unlimited limits, full report history (up to 12 months), PDF/XLSX exports",
              "Bank sync remains roadmap-only until officially released",
            ].map((f) => (
              <p key={f} className="flex items-center gap-2">✓ {f}</p>
            ))}
          </div>
          <button
            onClick={() => toast.info("Premium billing is in staged rollout. Contact support to join early access.")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow"
          >
            Request Premium Access
          </button>
        </div>
      )}

      {tab === "security" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-semibold">Security Controls</h3>
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">
              Adds a second verification step for email/password sign-ins.
            </p>
            <p className="text-xs">
              Status: {twoFactorStatusQuery.data?.data?.enabled ? "Enabled" : "Disabled"}
            </p>

            {!twoFactorStatusQuery.data?.data?.enabled && !setupPayload && (
              <button
                onClick={() => startTwoFactorSetup.mutate()}
                disabled={startTwoFactorSetup.isPending}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {startTwoFactorSetup.isPending ? "Preparing..." : "Set up 2FA"}
              </button>
            )}

            {setupPayload && (
              <div className="space-y-3 rounded-xl border border-border p-3">
                <Image
                  src={setupPayload.qrCodeDataUrl}
                  alt="2FA setup QR code"
                  width={176}
                  height={176}
                  className="w-44 h-44 rounded-lg border border-border"
                />
                <p className="text-xs text-muted-foreground break-all">
                  Manual key: {setupPayload.manualEntryKey}
                </p>
                <input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
                <button
                  onClick={() => verifyTwoFactor.mutate(twoFactorCode)}
                  disabled={verifyTwoFactor.isPending}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                >
                  {verifyTwoFactor.isPending ? "Verifying..." : "Verify and enable"}
                </button>
              </div>
            )}

            {twoFactorStatusQuery.data?.data?.enabled && (
              <div className="space-y-2">
                <input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code to disable"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
                <button
                  onClick={() => disableTwoFactor.mutate(twoFactorCode)}
                  disabled={disableTwoFactor.isPending}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"
                >
                  {disableTwoFactor.isPending ? "Disabling..." : "Disable 2FA"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-medium">Recent security activity</p>
            {securityEventsQuery.isLoading && <p className="text-xs text-muted-foreground">Loading security events...</p>}
            {!securityEventsQuery.isLoading && (
              <div className="space-y-2">
                {(securityEventsQuery.data?.data?.recentSecurityEvents ?? []).slice(0, 8).map((event: any) => (
                  <div key={event.id} className="text-xs border border-border rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                    <span className="font-medium">{event.action}</span>
                    <span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
