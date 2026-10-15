import type { Context, Next } from "hono";
import { CONSTANTS } from "../config/constants.js";
import { TooManyRequestsError } from "../utils/errors.js";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Periodically clean up stale entries every 2 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 2 * 60 * 1000).unref();

  return async function rateLimitMiddleware(c: Context, next: Next) {
    const now = Date.now();

    // Determine client identifier: authenticated user ID or remote IP
    const user = c.get("user");
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      "127.0.0.1";

    const key = options.keyGenerator
      ? options.keyGenerator(c)
      : user
      ? `user:${user.id}`
      : `ip:${ip}`;

    let record = store.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + options.windowMs,
      };
      store.set(key, record);
    }

    record.count++;

    const remaining = Math.max(0, options.maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    c.header("RateLimit-Limit", String(options.maxRequests));
    c.header("RateLimit-Remaining", String(remaining));
    c.header("RateLimit-Reset", String(resetSeconds));

    if (record.count > options.maxRequests) {
      throw new TooManyRequestsError(
        `Rate limit exceeded. Please retry after ${resetSeconds} seconds.`
      );
    }

    await next();
  };
}

// Preset rate limiters according to specification
export const authRateLimiter = createRateLimiter({
  windowMs: CONSTANTS.RATE_LIMITS.AUTH.WINDOW_MS,
  maxRequests: CONSTANTS.RATE_LIMITS.AUTH.MAX_REQUESTS,
  keyGenerator: (c) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      "127.0.0.1";
    return `auth:ip:${ip}`;
  },
});

export const chatRateLimiter = createRateLimiter({
  windowMs: CONSTANTS.RATE_LIMITS.CHAT.WINDOW_MS,
  maxRequests: CONSTANTS.RATE_LIMITS.CHAT.MAX_REQUESTS,
  keyGenerator: (c) => {
    const user = c.get("user");
    return user ? `chat:user:${user.id}` : `chat:ip:${c.req.header("x-forwarded-for") || "127.0.0.1"}`;
  },
});

export const testerRateLimiter = createRateLimiter({
  windowMs: CONSTANTS.RATE_LIMITS.TESTER.WINDOW_MS,
  maxRequests: CONSTANTS.RATE_LIMITS.TESTER.MAX_REQUESTS,
  keyGenerator: (c) => {
    const user = c.get("user");
    return user ? `tester:user:${user.id}` : `tester:ip:${c.req.header("x-forwarded-for") || "127.0.0.1"}`;
  },
});
