import { apiError, apiOk, unexpectedApiError } from "@/lib/server/api";
import { parseAndValidate } from "@/lib/server/validation";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { resetPasswordSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "auth-reset-password", {
      max: 10,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const parsed = await parseAndValidate(request, resetPasswordSchema);
    if (!parsed.ok) return parsed.response;

    const tokenHash = hashToken(parsed.data.token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
      return apiError("BAD_REQUEST", "Reset token is invalid or expired.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true },
    });

    if (!user) {
      return apiError("NOT_FOUND", "User not found.", 404);
    }

    const newPasswordHash = await hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_COMPLETED",
          resource: "auth",
          metadata: JSON.stringify({ method: "token" }),
        },
      }),
    ]);

    return apiOk({ success: true });
  } catch (error) {
    return unexpectedApiError(error);
  }
}
