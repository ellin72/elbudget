import { apiError, apiOk, unexpectedApiError } from "@/lib/server/api";
import { requireUserId } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";
import { logAuditEvent } from "@/lib/server/audit";

export async function GET() {
  try {
    const authResult = await requireUserId();
    if (!authResult.ok) return authResult.response;

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true, email: true },
    });

    if (!user) {
      return apiError("NOT_FOUND", "User not found.", 404);
    }

    return apiOk({
      enabled: user.twoFactorEnabled,
      hasSecret: Boolean(user.twoFactorSecret),
      email: user.email,
    });
  } catch (error) {
    return unexpectedApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireUserId();
    if (!authResult.ok) return authResult.response;

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return apiError("NOT_FOUND", "User not found.", 404);
    }

    const secret = generateSecret();
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "Elbudget";
    const otpauth = generateURI({
      issuer: appName,
      label: user.email,
      secret,
      strategy: "totp",
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: authResult.userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
      },
    });

    await logAuditEvent({
      userId: authResult.userId,
      action: "TWO_FACTOR_SETUP_INITIATED",
      resource: "auth",
      request,
    });

    return apiOk({
      enabled: false,
      otpauth,
      qrCodeDataUrl,
      manualEntryKey: secret,
    });
  } catch (error) {
    return unexpectedApiError(error);
  }
}
