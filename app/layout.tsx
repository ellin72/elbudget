import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Elbudget – AI-Powered Personal Finance",
    template: "%s | Elbudget",
  },
  description:
    "Take control of your money with Elbudget — the AI-powered budgeting app that tracks income, expenses, savings, and debt all in one beautiful dashboard.",
  keywords: [
    "budget", "personal finance", "AI budgeting", "expense tracker",
    "savings goals", "debt management", "financial planning", "Namibia",
  ],
  authors: [{ name: "Elbudget" }],
  creator: "Elbudget",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elbudget.com",
    title: "Elbudget – AI-Powered Personal Finance",
    description: "Your intelligent financial companion",
    siteName: "Elbudget",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elbudget – AI-Powered Personal Finance",
    description: "Your intelligent financial companion",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
