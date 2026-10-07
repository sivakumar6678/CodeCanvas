export function getClientIdentifier(request) {
  if (!request || typeof request.headers?.get !== 'function') {
    return 'unknown';
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = request.headers.get('x-client-ip');

  const candidate = (forwardedFor?.split(',')[0]?.trim() || realIp || clientIp || 'unknown')
    .replace(/\s+/g, '')
    .replace(/[^\dA-Za-z:.]/g, '');

  return candidate || 'unknown';
}

export function pruneRateLimitBuckets(buckets, now = Date.now(), windowMs = 60_000) {
  for (const [key, timestamps] of buckets.entries()) {
    const active = Array.isArray(timestamps)
      ? timestamps.filter((timestamp) => now - timestamp < windowMs)
      : [];

    if (active.length === 0) {
      buckets.delete(key);
      continue;
    }

    buckets.set(key, active);
  }
}

export function consumeRateLimit(request, buckets, options = {}) {
  const now = options.now ?? Date.now();
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 10;

  pruneRateLimitBuckets(buckets, now, windowMs);

  const clientId = getClientIdentifier(request);
  const timestamps = buckets.get(clientId) || [];
  const active = timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (active.length >= maxRequests) {
    const retryAfterMs = Math.max(0, windowMs - (now - active[0]));
    return {
      allowed: false,
      clientId,
      retryAfterMs,
    };
  }

  active.push(now);
  buckets.set(clientId, active);

  return {
    allowed: true,
    clientId,
    retryAfterMs: 0,
  };
}
