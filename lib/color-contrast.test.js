import test from 'node:test';
import assert from 'node:assert/strict';
import { hexToRgb, getRelativeLuminance, getContrastRatio, getWcagRating, generateTailwindConfig } from './color-contrast.js';

test('hexToRgb parses 3-digit and 6-digit hex values', () => {
  assert.deepEqual(hexToRgb('#fff'), [255, 255, 255]);
  assert.deepEqual(hexToRgb('#000000'), [0, 0, 0]);
  assert.deepEqual(hexToRgb('#2563eb'), [37, 99, 235]);
});

test('getRelativeLuminance computes correct WCAG luminance', () => {
  assert.equal(getRelativeLuminance([0, 0, 0]), 0);
  assert.equal(getRelativeLuminance([255, 255, 255]), 1);
});

test('getContrastRatio computes black and white contrast as 21:1', () => {
  const ratio = getContrastRatio('#000000', '#ffffff');
  assert.equal(Math.round(ratio), 21);
});

test('getWcagRating classifies AAA, AA, and Fail thresholds', () => {
  assert.equal(getWcagRating(7.5), 'AAA');
  assert.equal(getWcagRating(4.8), 'AA');
  assert.equal(getWcagRating(3.2), 'Fail');
});

test('generateTailwindConfig formats valid JS config object', () => {
  const palette = ['#1e293b', '#3b82f6', '#10b981'];
  const config = generateTailwindConfig(palette);

  assert.match(config, /module\.exports/);
  assert.match(config, /"brand-100": "#1e293b"/);
  assert.match(config, /"brand-200": "#3b82f6"/);
  assert.match(config, /"brand-300": "#10b981"/);
});

