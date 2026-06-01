"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const payload = await res.json();
    if (!res.ok) {
      toast.error(payload?.error?.message || "Failed to reset password");
      return;
    }

    setDone(true);
    toast.success("Password reset successful. You can sign in now.");
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground">
          The password reset link is invalid. Request a new one from the forgot password page.
        </p>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Go to forgot password
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Password updated</h1>
        <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium">New password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm"
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirm password</label>
          <input
            type="password"
            {...register("confirmPassword")}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Update password
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
