import Link from "next/link";
import { Wallet } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-purple-600 to-violet-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/3 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl text-white">Elbudget</span>
        </div>

        {/* Testimonial / Feature highlight */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Your AI-Powered
              <br />
              Financial Operating System
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Join thousands of users who have transformed their financial lives
              with intelligent budgeting, savings automation, and AI insights.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              "🎯 Set and crush financial goals",
              "🤖 AI-powered spending insights",
              "📊 Beautiful analytics dashboard",
              "🔒 Bank-grade security",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/80 text-sm">
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            {[
              { value: "10K+", label: "Users" },
              { value: "N$2M+", label: "Managed" },
              { value: "4.9★", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <p className="text-white/90 text-sm italic mb-3">
            &ldquo;Elbudget completely changed how I manage my money. I saved
            N$15,000 in just 6 months using the AI recommendations!&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
              M
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Maria N.</p>
              <p className="text-white/60 text-xs">Windhoek, Namibia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth forms */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">Elbudget</span>
        </div>

        <div className="w-full max-w-md">{children}</div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          By using Elbudget, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
