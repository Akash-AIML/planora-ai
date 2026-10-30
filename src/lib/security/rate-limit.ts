export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
}

interface ClientBucket {
  tokens: number[];
  lastCleanup: number;
}

// In-memory bucket store
const ipStore = new Map<string, ClientBucket>();
let lastGlobalCleanup = Date.now();
const GLOBAL_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = { maxRequests: 20, windowMs: 60 * 1000 };

/**
 * Periodically purge stale entries from memory
 */
function cleanupExpiredBuckets(windowMs: number) {
  const now = Date.now();
  if (now - lastGlobalCleanup < GLOBAL_CLEANUP_INTERVAL_MS) return;
  lastGlobalCleanup = now;

  for (const [key, bucket] of ipStore.entries()) {
    const validTokens = bucket.tokens.filter((t) => now - t < windowMs);
    if (validTokens.length === 0) {
      ipStore.delete(key);
    } else {
      bucket.tokens = validTokens;
    }
  }
}

/**
 * Sliding window rate limiter for endpoint protection.
 * Protects against DoS, brute force attacks, and automated API abuse.
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): RateLimitResult {
  cleanupExpiredBuckets(config.windowMs);

  const now = Date.now();
  const bucket = ipStore.get(clientId) || { tokens: [], lastCleanup: now };

  // Filter tokens within the sliding window
  bucket.tokens = bucket.tokens.filter((timestamp) => now - timestamp < config.windowMs);

  const currentCount = bucket.tokens.length;

  if (currentCount >= config.maxRequests) {
    const oldestToken = bucket.tokens[0] || now;
    const resetMs = oldestToken + config.windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));

    return {
      allowed: false,
      current: currentCount,
      remaining: 0,
      resetMs,
      retryAfterSeconds,
    };
  }

  // Record this request
  bucket.tokens.push(now);
  ipStore.set(clientId, bucket);

  const remaining = Math.max(0, config.maxRequests - bucket.tokens.length);
  const resetMs = config.windowMs;

  return {
    allowed: true,
    current: bucket.tokens.length,
    remaining,
    resetMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Clears the rate limiter store (useful for automated testing)
 */
export function resetRateLimitStore(): void {
  ipStore.clear();
  lastGlobalCleanup = Date.now();
}
