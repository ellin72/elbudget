import { prisma } from "@/lib/prisma";

function readIp(request?: Request) {
  if (!request) return null;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip") || null;
}

function readUserAgent(request?: Request) {
  return request?.headers.get("user-agent") || null;
}

export async function logAuditEvent(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  request?: Request;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      ipAddress: readIp(params.request),
      userAgent: readUserAgent(params.request),
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
