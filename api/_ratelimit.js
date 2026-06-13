// In-memory rate limiter — shared across requests within the same Vercel instance
// Not perfect across multiple instances, but stops the vast majority of abuse

const store = new Map();

function getKey(req, prefix) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';
  return `${prefix}:${ip}`;
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Check rate limit.
 * @param {object} req - Vercel request object
 * @param {string} prefix - unique key prefix (e.g. 'login', 'register')
 * @param {number} limit - max attempts allowed
 * @param {number} windowMs - window in milliseconds
 * @returns {{ allowed: boolean, retryAfter: number }} retryAfter in seconds
 */
export function checkRateLimit(req, prefix, limit, windowMs) {
  cleanup();
  const key = getKey(req, prefix);
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}
