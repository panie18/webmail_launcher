import { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";

interface RateLimitOptions {
  max?: number;
  window?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new LRUCache<string, RateLimitEntry>({
  max: 10000,
  ttl: 1000 * 60 * 15,
});

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; headers: Record<string, string> }> {
  const { max = 100, window = 60000 } = options;

  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "anonymous";
  const key = `${ip}:${request.nextUrl.pathname}`;

  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    cache.set(key, { count: 1, resetAt: now + window });
    return {
      success: true,
      headers: {
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": String(max - 1),
        "X-RateLimit-Reset": String(Math.ceil((now + window) / 1000)),
      },
    };
  }

  entry.count++;
  cache.set(key, entry);

  const remaining = Math.max(0, max - entry.count);

  if (entry.count > max) {
    return {
      success: false,
      headers: {
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
      },
    };
  }

  return {
    success: true,
    headers: {
      "X-RateLimit-Limit": String(max),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
    },
  };
}
