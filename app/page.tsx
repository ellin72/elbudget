import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Lock, PiggyBank, Shield, Sparkles, TrendingUp, Wallet, Zap } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get personalized recommendations and spending predictions powered by advanced AI.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Beautiful charts and reports that give you a clear picture of your financial health.",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: PiggyBank,
      title: "Savings Goals",
      description: "Set and track savings goals with automated contribution suggestions.",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: TrendingUp,
      title: "Debt Management",
      description: "Track and strategically pay off debts with snowball or avalanche methods.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Wallet,
      title: "Budget Planning",
      description: "Create budgets using 50/30/20, zero-based, or custom approaches.",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      icon: Zap,
      title: "Real-time Tracking",
      description: "Track income and expenses in real-time across all categories.",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "N$2M+", label: "Money Managed" },
    { value: "95%", label: "User Satisfaction" },
    { value: "4.9★", label: "App Rating" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-glass border-b border-border/40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl gradient-text">Elbudget</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-glow hover:shadow-glow"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-64 bg-gradient-to-t from-primary/5 to-transparent blur-2xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Financial Intelligence</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Master Your{" "}
            <span className="gradient-text">Finances</span>
            <br />
            with Intelligence
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
            Elbudget is your AI-powered financial companion. Track income, manage
            expenses, crush debt, and achieve savings goals — all in one beautiful
            dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-300 shadow-glow hover:shadow-glow hover:-translate-y-0.5 w-full sm:w-auto justify-center"
            >
              Start for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-border bg-card font-semibold text-base hover:bg-accent transition-all duration-200 w-full sm:w-auto justify-center"
            >
              See Demo
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Free forever • No credit card required • Setup in 2 minutes
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-6xl mx-auto mt-16 relative">
          <div className="rounded-3xl border border-border/50 bg-card shadow-2xl overflow-hidden relative">
            <div className="bg-gradient-to-br from-brand-600 via-purple-600 to-pink-600 p-1 rounded-3xl">
              <div className="bg-card rounded-[22px] p-6 lg:p-8">
                {/* Mock Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Balance", value: "N$24,580", change: "+12%", color: "from-brand-500 to-purple-500" },
                    { label: "Monthly Income", value: "N$15,000", change: "+5%", color: "from-green-500 to-emerald-500" },
                    { label: "Expenses", value: "N$8,420", change: "-8%", color: "from-orange-500 to-red-500" },
                    { label: "Savings", value: "N$6,580", change: "+18%", color: "from-blue-500 to-cyan-500" },
                  ].map((card, i) => (
                    <div key={i} className="rounded-2xl p-4 border border-border/50 bg-background/50 backdrop-blur-sm">
                      <p className="text-xs text-muted-foreground mb-2">{card.label}</p>
                      <p className="text-lg font-bold">{card.value}</p>
                      <p className={`text-xs mt-1 font-medium ${card.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                        {card.change} this month
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border/50 bg-background/50 p-4 h-40 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Income vs Expenses Chart</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/50 p-4 h-40 flex flex-col gap-3 justify-center px-6">
                    {["Food & Dining", "Transport", "Entertainment", "Utilities"].map((cat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"][i] }} />
                        <span className="text-xs text-muted-foreground flex-1">{cat}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${[70, 45, 30, 55][i]}%`, background: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"][i] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow underneath */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/20 blur-3xl rounded-full" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-border/50 bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-extrabold gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">thrive financially</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to help you take control of your money
              and build lasting wealth.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 px-4 bg-muted/30 border-y border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Bank-level Security</h3>
          </div>
          <p className="text-muted-foreground mb-8">
            Your financial data is protected with industry-leading encryption and
            security practices.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            {[
              "256-bit SSL Encryption",
              "GDPR Compliant",
              "Two-Factor Auth",
              "Zero Data Selling",
              "Regular Security Audits",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">
              Simple, <span className="gradient-text">transparent pricing</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free, upgrade when you need more power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="rounded-3xl border border-border p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <p className="text-muted-foreground text-sm">Perfect to get started</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">N$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {["Up to 3 budgets", "Basic expense tracking", "3 savings goals", "CSV exports", "Mobile app"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-3 rounded-xl border border-border hover:bg-accent font-medium transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="rounded-3xl border-2 border-primary p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Premium</h3>
                <p className="text-muted-foreground text-sm">For serious budgeters</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">N$149</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  "Unlimited budgets & goals",
                  "AI financial insights",
                  "Advanced reports & analytics",
                  "PDF, Excel, CSV exports",
                  "Debt payoff strategies",
                  "Priority support",
                  "Bank sync (coming soon)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-glow">
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-extrabold mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of users who have transformed their financial lives
            with Elbudget.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all duration-300 shadow-glow hover:-translate-y-1"
          >
            Start for Free Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">Elbudget</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Elbudget. All rights reserved. Built with ❤️ for financial freedom.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
