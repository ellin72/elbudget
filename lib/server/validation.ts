import { apiError } from "@/lib/server/api";
import { z } from "zod";

export async function parseAndValidate<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: Response }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError("BAD_REQUEST", "Invalid JSON payload.", 400),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError("BAD_REQUEST", "Invalid request data.", 400, parsed.error.issues),
    };
  }

  return { ok: true, data: parsed.data };
}
