import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_TOOL_SUBMISSION_BODY_BYTES,
  parseToolSubmissionRequest,
  ToolSubmissionRequestError,
} from './tool-submission-request.js';

const key = 'f7c0662c-2cf3-4f75-b91f-2e5e9a80cb6e';

test('submission parser reads JSON payloads and idempotency keys', async () => {
  const request = new Request('https://codecanvas.test/api/contributions/tools', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idempotencyKey: key, name: 'Tool' }),
  });
  const parsed = await parseToolSubmissionRequest(request);
  assert.equal(parsed.idempotencyKey, key);
  assert.equal(parsed.payload.name, 'Tool');
  assert.equal(parsed.payload.logoImageUrl, undefined);
});

test('submission parser preserves optional image URLs in JSON payloads', async () => {
  const imageUrls = {
    logoImageUrl: 'https://cdn.example/tool-logo.png',
    bannerImageUrl: 'https://cdn.example/tool-banner.webp',
  };
  const request = new Request('https://codecanvas.test/api/contributions/tools', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...imageUrls, idempotencyKey: key }),
  });
  const parsed = await parseToolSubmissionRequest(request);
  assert.deepEqual(
    { logoImageUrl: parsed.payload.logoImageUrl, bannerImageUrl: parsed.payload.bannerImageUrl },
    imageUrls
  );
});

test('submission parser rejects multipart file uploads', async () => {
  const form = new FormData();
  form.append('payload', JSON.stringify({ name: 'Tool' }));
  form.append('idempotencyKey', key);
  const request = new Request('https://codecanvas.test/api/contributions/tools', {
    method: 'POST',
    body: form,
  });
  await assert.rejects(parseToolSubmissionRequest(request), /file uploads are not supported/i);
});

test('submission parser rejects missing keys, malformed bodies, and oversized payloads', async () => {
  const missingKey = new Request('https://codecanvas.test/api/contributions/tools', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Tool' }),
  });
  await assert.rejects(parseToolSubmissionRequest(missingKey), /idempotency key/i);

  const malformed = new Request('https://codecanvas.test/api/contributions/tools', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  await assert.rejects(parseToolSubmissionRequest(malformed), /valid JSON/i);

  const oversized = new Request('https://codecanvas.test/api/contributions/tools', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': String(MAX_TOOL_SUBMISSION_BODY_BYTES + 1),
    },
    body: '{}',
  });
  await assert.rejects(parseToolSubmissionRequest(oversized), (error) =>
    error instanceof ToolSubmissionRequestError && error.status === 413
  );
});
