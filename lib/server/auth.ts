import { auth } from "@/lib/auth";
import { apiError } from "@/lib/server/api";

export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: apiError("UNAUTHORIZED", "Unauthorized", 401),
    };
  }

  return {
    ok: true as const,
    userId: session.user.id,
  };
}

export function assertOwner(resourceUserId: string, userId: string) {
  if (resourceUserId !== userId) {
    return {
      ok: false as const,
      response: apiError("FORBIDDEN", "You do not have access to this resource.", 403),
    };
  }

  return { ok: true as const };
}
