type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

export function consumeRateLimit(
  key: string,
  options: { windowMs: number; maxRequests: number }
) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || now >= current.resetAt) {
    const nextRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, nextRecord);
    return {
      allowed: true,
      remaining: Math.max(0, options.maxRequests - nextRecord.count),
      resetAt: nextRecord.resetAt,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return {
    allowed: current.count <= options.maxRequests,
    remaining: Math.max(0, options.maxRequests - current.count),
    resetAt: current.resetAt,
  };
}

export function getRequesterIp(headers: Headers) {
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  return "unknown";
}
