import { apiOk, unexpectedApiError } from "@/lib/server/api";
import { requireUserId } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const authResult = await requireUserId();
    if (!authResult.ok) return authResult.response;

    const recentSecurityEvents = await prisma.auditLog.findMany({
      where: {
        userId: authResult.userId,
        action: {
          in: [
            "LOGIN_SUCCESS",
            "LOGIN_FAILED",
            "PASSWORD_RESET_REQUESTED",
            "PASSWORD_RESET_COMPLETED",
            "TWO_FACTOR_ENABLED",
            "TWO_FACTOR_DISABLED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const currentDevice = {
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      activeNow: true,
    };

    return apiOk({
      currentDevice,
      recentSecurityEvents,
    });
  } catch (error) {
    return unexpectedApiError(error);
  }
}
