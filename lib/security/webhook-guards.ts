const seenWebhookKeys = new Map<string, number>();

export function isFreshTimestamp(
  timestamp: string | null | undefined,
  maxAgeSeconds = 300
) {
  if (!timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.abs(nowSeconds - ts) <= maxAgeSeconds;
}

export function markAndCheckReplay(key: string, ttlSeconds = 600) {
  const now = Date.now();
  const expiresAt = seenWebhookKeys.get(key);
  if (expiresAt && expiresAt > now) return true;
  seenWebhookKeys.set(key, now + ttlSeconds * 1000);
  return false;
}
