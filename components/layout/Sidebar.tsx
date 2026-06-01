"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  CreditCard,
  FileText,
  LayoutDashboard,
  PiggyBank,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: TrendingUp },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useUIStore();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-border bg-card",
          "hidden lg:flex"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow flex-shrink-0">
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">Elbudget</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard">
              <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
            </Link>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  "nav-item",
                  active && "active",
                  sidebarCollapsed ? "justify-center px-2" : ""
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 pt-2 border-t border-border space-y-0.5">
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-full flex items-center justify-center py-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Expand sidebar"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          )}
          {bottomItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  "nav-item",
                  active && "active",
                  sidebarCollapsed ? "justify-center px-2" : ""
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>
      </motion.aside>

      {/* Mobile Sidebar (slides in) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col border-r border-border bg-card lg:hidden"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
                  <PiggyBank className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg gradient-text">Elbudget</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn("nav-item", active && "active")}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="px-2 pb-4 pt-2 border-t border-border">
              {bottomItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn("nav-item", pathname === href && "active")}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
