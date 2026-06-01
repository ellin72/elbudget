import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, unexpectedApiError } from "@/lib/server/api";
import { parseAndValidate } from "@/lib/server/validation";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { registerServerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, "auth-register", {
      max: 10,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const parsed = await parseAndValidate(request, registerServerSchema);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return apiError("CONFLICT", "Email already in use", 409);
    }

    const hashedPassword = await hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: hashedPassword,
      },
    });

    return apiOk({ success: true }, { status: 201 });
  } catch (error) {
    return unexpectedApiError(error);
  }
}
