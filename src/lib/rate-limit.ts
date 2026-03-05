type RateLimitOptions = {
  max: number;
  windowMs: number;
};

type Entry = {
  count: number;
  resetAt: number;
};

export function createRateLimiter({ max, windowMs }: RateLimitOptions) {
  const store = new Map<string, Entry>();

  return {
    check(key: string) {
      const now = Date.now();
      const current = store.get(key);

      if (!current || current.resetAt <= now) {
        const next = { count: 1, resetAt: now + windowMs };
        store.set(key, next);
        return { allowed: true, remaining: max - 1, resetAt: next.resetAt };
      }

      if (current.count >= max) {
        return { allowed: false, remaining: 0, resetAt: current.resetAt };
      }

      current.count += 1;
      store.set(key, current);

      return { allowed: true, remaining: max - current.count, resetAt: current.resetAt };
    },
  };
}

export const contactRateLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });
export const weddingRateLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });
