import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
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

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: { email, token, expires },
  });

  // In production, send an email here. For now, log the reset link.
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  console.log(`[Password Reset] Reset link for ${email}: ${resetUrl}`);

  return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
}
