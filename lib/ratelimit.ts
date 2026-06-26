import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function makeRedis() {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

const redis = makeRedis();

function makeLimiter(
  limiter: ConstructorParameters<typeof Ratelimit>[0]["limiter"],
  prefix: string,
) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter, prefix });
}

export const loginLimiter = makeLimiter(
  Ratelimit.slidingWindow(5, "15 m"),
  "rl:login",
);

export const registerLimiter = makeLimiter(
  Ratelimit.slidingWindow(3, "1 h"),
  "rl:register",
);

export async function checkLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<boolean> {
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(identifier);
    return success;
  } catch {
    // Redis unavailable — allow the request rather than blocking users
    return true;
  }
}
