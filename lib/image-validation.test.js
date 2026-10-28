import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_STATUS,
  classifyImageUrl,
  isValidImageUrlString,
  probeImageUrl,
  clearImageProbeCache,
} from './image-validation.js';

test('isValidImageUrlString validates HTTP and HTTPS URLs', () => {
  assert.equal(isValidImageUrlString(null), false);
  assert.equal(isValidImageUrlString(''), false);
  assert.equal(isValidImageUrlString('   '), false);
  assert.equal(isValidImageUrlString('not-a-url'), false);
  assert.equal(isValidImageUrlString('ftp://example.com/logo.png'), false);
  assert.equal(isValidImageUrlString('javascript:alert(1)'), false);
  assert.equal(isValidImageUrlString('http://example.com/logo.png'), true);
  assert.equal(isValidImageUrlString('https://cdn.example.org/banner.jpg'), true);
});

test('classifyImageUrl identifies missing vs loading states synchronously', () => {
  clearImageProbeCache();
  assert.equal(classifyImageUrl(''), IMAGE_STATUS.MISSING);
  assert.equal(classifyImageUrl(null), IMAGE_STATUS.MISSING);
  assert.equal(classifyImageUrl('undefined'), IMAGE_STATUS.MISSING);
  assert.equal(classifyImageUrl('   '), IMAGE_STATUS.MISSING);
  assert.equal(classifyImageUrl('not-a-valid-url'), IMAGE_STATUS.MISSING);
  assert.equal(classifyImageUrl('https://example.com/logo.png'), IMAGE_STATUS.LOADING);
});

test('probeImageUrl handles missing URLs immediately', async () => {
  clearImageProbeCache();
  const res1 = await probeImageUrl('');
  assert.equal(res1, IMAGE_STATUS.MISSING);

  const res2 = await probeImageUrl(null);
  assert.equal(res2, IMAGE_STATUS.MISSING);

  const res3 = await probeImageUrl('invalid-url');
  assert.equal(res3, IMAGE_STATUS.MISSING);
});

test('probeImageUrl returns cached state without re-probing', async () => {
  clearImageProbeCache();
  // In Node.js environment without window/Image, probeImageUrl falls back to valid
  const url = 'https://example.com/test-cached-logo.png';
  const res1 = await probeImageUrl(url);
  assert.equal(res1, IMAGE_STATUS.VALID);

  // classifyImageUrl should now return the cached VALID state
  assert.equal(classifyImageUrl(url), IMAGE_STATUS.VALID);
});

