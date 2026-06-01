import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { verifySync } from "otplib";
import { consumeRateLimitByKey } from "@/lib/server/rate-limit";
import { logAuditEvent } from "@/lib/server/audit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase();
        const attemptKey = `auth-login:${email}`;
        const rateLimit = consumeRateLimitByKey(attemptKey, {
          max: 10,
          windowMs: 60_000,
        });
        if (!rateLimit.allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          await logAuditEvent({
            userId: user.id,
            action: "LOGIN_FAILED",
            resource: "auth",
            metadata: { reason: "invalid_password" },
          });
          return null;
        }

        if (user.twoFactorEnabled) {
          const code = String(credentials.twoFactorCode ?? "").trim();
          if (!user.twoFactorSecret || !code) {
            await logAuditEvent({
              userId: user.id,
              action: "LOGIN_FAILED",
              resource: "auth",
              metadata: { reason: "missing_2fa_code" },
            });
            return null;
          }

          const verifyResult = verifySync({
            token: code,
            secret: user.twoFactorSecret,
            strategy: "totp",
          });
          const valid2FA =
            typeof verifyResult === "boolean" ? verifyResult : verifyResult.valid;

          if (!valid2FA) {
            await logAuditEvent({
              userId: user.id,
              action: "LOGIN_FAILED",
              resource: "auth",
              metadata: { reason: "invalid_2fa_code" },
            });
            return null;
          }
        }

        await logAuditEvent({
          userId: user.id,
          action: "LOGIN_SUCCESS",
          resource: "auth",
          metadata: {
            provider: "credentials",
            twoFactorEnabled: user.twoFactorEnabled,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          onboardingDone: user.onboardingDone,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.onboardingDone = (user as any).onboardingDone;
        token.twoFactorEnabled = (user as any).twoFactorEnabled;
      }
      if (trigger === "update" && session) {
        token.onboardingDone = session.onboardingDone;
        token.name = session.name;
        token.twoFactorEnabled = (session as any).twoFactorEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).onboardingDone = token.onboardingDone;
        (session.user as any).twoFactorEnabled = token.twoFactorEnabled;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    async createUser({ user }) {
      // Create default subscription for new users
      await prisma.subscription.create({
        data: {
          userId: user.id!,
          plan: "FREE",
          status: "ACTIVE",
        },
      });

      // Seed default categories
      const defaultCategories = [
        { name: "Salary", icon: "💼", color: "#10b981", type: "INCOME" as const },
        { name: "Freelance", icon: "💻", color: "#3b82f6", type: "INCOME" as const },
        { name: "Business", icon: "🏢", color: "#8b5cf6", type: "INCOME" as const },
        { name: "Investments", icon: "📈", color: "#f59e0b", type: "INCOME" as const },
        { name: "Other Income", icon: "💰", color: "#06b6d4", type: "INCOME" as const },
        { name: "Food & Dining", icon: "🍽️", color: "#ef4444", type: "EXPENSE" as const },
        { name: "Transport", icon: "🚗", color: "#f97316", type: "EXPENSE" as const },
        { name: "Rent & Housing", icon: "🏠", color: "#84cc16", type: "EXPENSE" as const },
        { name: "Utilities", icon: "⚡", color: "#f59e0b", type: "EXPENSE" as const },
        { name: "Healthcare", icon: "🏥", color: "#ec4899", type: "EXPENSE" as const },
        { name: "Education", icon: "📚", color: "#6366f1", type: "EXPENSE" as const },
        { name: "Entertainment", icon: "🎬", color: "#a855f7", type: "EXPENSE" as const },
        { name: "Shopping", icon: "🛍️", color: "#14b8a6", type: "EXPENSE" as const },
        { name: "Debt Payment", icon: "💳", color: "#dc2626", type: "EXPENSE" as const },
        { name: "Savings", icon: "💾", color: "#10b981", type: "EXPENSE" as const },
        { name: "Family", icon: "👨‍👩‍👧", color: "#f97316", type: "EXPENSE" as const },
        { name: "Personal Care", icon: "🧴", color: "#ec4899", type: "EXPENSE" as const },
        { name: "Groceries", icon: "🛒", color: "#84cc16", type: "EXPENSE" as const },
      ];

      await prisma.category.createMany({
        data: defaultCategories.map((cat) => ({
          ...cat,
          isDefault: true,
          userId: user.id!,
        })),
      });
    },
  },
});
