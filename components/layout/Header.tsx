"use client";

import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Moon, Plus, Search, Settings, Sun, User, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/budgets": "Budgets",
  "/goals": "Goals",
  "/debts": "Debts",
  "/recurring": "Recurring Items",
  "/ai-assistant": "AI Assistant",
  "/reports": "Reports",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Transactions", href: "/transactions" },
  { label: "Budgets", href: "/budgets" },
  { label: "Goals", href: "/goals" },
  { label: "Debts", href: "/debts" },
  { label: "Recurring Items", href: "/recurring" },
  { label: "AI Assistant", href: "/ai-assistant" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { setSidebarOpen, setTransactionModalOpen, notificationsOpen, setNotificationsOpen, unreadCount } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "Elbudget";

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filteredLinks = searchQuery.trim()
    ? QUICK_LINKS.filter((l) => l.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : QUICK_LINKS;

  return (
    <>
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search — hidden on mobile for brevity */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search pages"
          className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick add transaction */}
        <button
          onClick={() => setTransactionModalOpen(true)}
          aria-label="Add transaction"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-glow"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-accent transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
              {session?.user?.name ?? "User"}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border bg-card shadow-card z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Settings
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  Profile
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Search Modal */}
    {searchOpen && (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setSearchOpen(false)} />
        <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md z-10 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages…"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            <button onClick={() => setSearchOpen(false)} aria-label="Close search" className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 max-h-72 overflow-y-auto">
            {filteredLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
            ) : (
              filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  {link.label}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
