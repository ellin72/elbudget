import { apiError } from "@/lib/server/api";

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();

function readIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function enforceRateLimit(
  request: Request,
  keyPrefix: string,
  options: { max: number; windowMs: number }
) {
  const ip = readIp(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const bucket = memoryStore.get(key);
  if (!bucket || now >= bucket.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (bucket.count >= options.max) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    const response = apiError(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429,
      { retryAfterSec }
    );
    response.headers.set("Retry-After", String(retryAfterSec));
    return response;
  }

  bucket.count += 1;
  memoryStore.set(key, bucket);
  return null;
}

export function consumeRateLimitByKey(
  key: string,
  options: { max: number; windowMs: number }
) {
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true as const, retryAfterSec: 0 };
  }

  if (bucket.count >= options.max) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false as const, retryAfterSec };
  }

  bucket.count += 1;
  memoryStore.set(key, bucket);
  return { allowed: true as const, retryAfterSec: 0 };
}
