import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { logAuditEvent } from "@/lib/server/audit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, "auth-forgot-password", {
    max: 10,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  }

  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: { email, token, expires },
  });

  // In production, send an email here. For now, log the reset link.
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
  console.log(`[Password Reset] Reset link for ${email}: ${resetUrl}`);

  await logAuditEvent({
    userId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    resource: "auth",
    request: req,
  });

  return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
}
