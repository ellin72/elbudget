import { apiError, apiOk, unexpectedApiError } from "@/lib/server/api";
import { requireUserId } from "@/lib/server/auth";
import { parseAndValidate } from "@/lib/server/validation";
import { twoFactorCodeSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { verifySync } from "otplib";
import { logAuditEvent } from "@/lib/server/audit";

export async function POST(request: Request) {
  try {
    const authResult = await requireUserId();
    if (!authResult.ok) return authResult.response;

    const parsed = await parseAndValidate(request, twoFactorCodeSchema);
    if (!parsed.ok) return parsed.response;

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return apiError("BAD_REQUEST", "2FA is not enabled.", 400);
    }

    const verifyResult = verifySync({
      token: parsed.data.code,
      secret: user.twoFactorSecret,
      strategy: "totp",
    });
    const isValid = typeof verifyResult === "boolean" ? verifyResult : verifyResult.valid;

    if (!isValid) {
      await logAuditEvent({
        userId: authResult.userId,
        action: "TWO_FACTOR_DISABLE_FAILED",
        resource: "auth",
        request,
      });
      return apiError("BAD_REQUEST", "Invalid authenticator code.", 400);
    }

    await prisma.user.update({
      where: { id: authResult.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await logAuditEvent({
      userId: authResult.userId,
      action: "TWO_FACTOR_DISABLED",
      resource: "auth",
      request,
    });

    return apiOk({ enabled: false });
  } catch (error) {
    return unexpectedApiError(error);
  }
}
