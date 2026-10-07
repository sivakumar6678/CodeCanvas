import test from 'node:test';
import assert from 'node:assert/strict';

import { consumeRateLimit, getClientIdentifier } from './rate-limit.js';

test('getClientIdentifier prefers the first forwarded IP address', () => {
  const request = new Request('https://example.com/api/generate', {
    headers: {
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
      'x-real-ip': '10.0.0.2',
    },
  });

  assert.equal(getClientIdentifier(request), '203.0.113.9');
});

test('consumeRateLimit blocks over-limit requests and prunes stale entries', () => {
  const buckets = new Map();
  const request = new Request('https://example.com/api/generate', {
    headers: { 'x-forwarded-for': '198.51.100.44' },
  });

  const first = consumeRateLimit(request, buckets, { now: 1_000, windowMs: 5_000, maxRequests: 2 });
  const second = consumeRateLimit(request, buckets, { now: 2_000, windowMs: 5_000, maxRequests: 2 });
  const third = consumeRateLimit(request, buckets, { now: 3_000, windowMs: 5_000, maxRequests: 2 });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.equal(buckets.get('198.51.100.44').length, 2);

  const afterWindow = consumeRateLimit(request, buckets, { now: 8_000, windowMs: 5_000, maxRequests: 2 });
  assert.equal(afterWindow.allowed, true);
  assert.equal(buckets.get('198.51.100.44').length, 1);
});
