import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import { AppError } from "@/lib/errors/app-error";

export interface RateLimitConfig {
  requests: number;
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
}

/**
 * Centralized Rate Limit Definitions
 * All limits defined in one place rather than scattered across endpoints.
 */
export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  ADMIN_LOGIN: { requests: 5, window: "15 m" },
  PASSWORD_RESET: { requests: 3, window: "1 h" },
  CAFE_CREATION: { requests: 20, window: "1 h" },
  ADMIN_MUTATION: { requests: 60, window: "1 m" },
  PUBLIC_API: { requests: 100, window: "1 m" },
  CUSTOMER_OTP: { requests: 4, window: "10 m" },
};

// In-memory fallback tracking for local development when Upstash is unconfigured
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a given identifier (e.g., client IP or User ID)
 */
export async function checkRateLimit(
  ruleKey: keyof typeof RATE_LIMIT_RULES,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const rule = RATE_LIMIT_RULES[ruleKey];

  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(rule.requests, rule.window),
      prefix: `@upgradecafe/rl/${ruleKey}`,
    });

    const result = await ratelimit.limit(identifier);

    if (!result.success) {
      throw new AppError({
        code: "RATE_LIMITED",
        message: `Too many requests for ${ruleKey}. Please try again later.`,
        statusCode: 429,
        details: {
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        },
      });
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Local development fallback
  const now = Date.now();
  const windowMs = parseWindowToMs(rule.window);
  const key = `${ruleKey}:${identifier}`;
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: rule.requests, remaining: rule.requests - 1, reset: now + windowMs };
  }

  if (record.count >= rule.requests) {
    throw new AppError({
      code: "RATE_LIMITED",
      message: `Too many requests. Please try again later.`,
      statusCode: 429,
      details: {
        limit: rule.requests,
        remaining: 0,
        reset: record.resetAt,
      },
    });
  }

  record.count += 1;
  return {
    success: true,
    limit: rule.requests,
    remaining: rule.requests - record.count,
    reset: record.resetAt,
  };
}

function parseWindowToMs(window: `${number} s` | `${number} m` | `${number} h` | `${number} d`): number {
  const [val, unit] = window.split(" ");
  const num = parseInt(val, 10);
  switch (unit) {
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}
