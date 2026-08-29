import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToolToCanonical, toCanonicalNames } from './canonical-tool-schema.js';

test('normalizeToolToCanonical maps legacy fields to canonical names', () => {
  const input = {
    id: 'tool-1',
    name: 'Example Tool',
    slug: 'example-tool',
    category: 'development',
    subCategory: 'code',
    description: 'Short summary',
    overview: 'Full overview text',
    website: 'https://example.com',
    logo: 'https://example.com/logo.png',
    banner: 'https://example.com/banner.png',
    features: ['Feature 1', 'Feature 2'],
    pros: ['Fast', 'Reliable'],
    cons: ['Pricey'],
    pricing: 'Free',
    freeTrial: true,
    platform: ['Web'],
    tags: ['ai', 'dev'],
    use_cases: ['writing'],
  };

  const normalized = normalizeToolToCanonical(input);

  assert.equal(normalized.logoImageUrl, 'https://example.com/logo.png');
  assert.equal(normalized.bannerImageUrl, 'https://example.com/banner.png');
  assert.equal(normalized.fullOverview, 'Full overview text');
  assert.deepEqual(normalized.keyFeatures, ['Feature 1', 'Feature 2']);
  assert.deepEqual(normalized.platforms, ['Web']);
  assert.deepEqual(normalized.useCases, ['writing']);
  assert.equal(normalized.pricingModel, 'Free');
  assert.equal(normalized.hasFree, true);
});

test('toCanonicalNames removes legacy aliases and keeps only canonical fields', () => {
  const input = {
    id: 'tool-2',
    name: 'Another Tool',
    slug: 'another-tool',
    category: 'writing',
    subCategory: 'copy',
    description: 'Short summary',
    fullOverview: 'Detailed overview',
    website: 'https://example.com',
    logoImageUrl: 'https://example.com/logo.png',
    bannerImageUrl: 'https://example.com/banner.png',
    keyFeatures: ['Feature 1'],
    pros: ['Good'],
    cons: ['Slow'],
    pricingModel: 'Freemium',
    platforms: ['Web', 'macOS'],
    tags: ['writing'],
    useCases: ['drafting'],
    featured: true,
    new: false,
    verified: true,
    hasFree: true,
    createdDate: '2026-08-29T00:00:00.000Z',
    logo: 'legacy-logo.png',
    banner: 'legacy-banner.png',
    overview: 'legacy-overview',
    features: ['legacy-feature'],
    pricing: 'Paid',
    freeTrial: false,
    platform: ['Android'],
  };

  const canonical = toCanonicalNames(input);

  assert.equal(canonical.logoImageUrl, 'https://example.com/logo.png');
  assert.equal(canonical.bannerImageUrl, 'https://example.com/banner.png');
  assert.deepEqual(canonical.keyFeatures, ['Feature 1']);
  assert.deepEqual(canonical.platforms, ['Web', 'macOS']);
  assert.equal(canonical.pricingModel, 'Freemium');
  assert.equal(canonical.hasFree, true);
  assert.deepEqual(Object.keys(canonical).includes('logo'), false);
  assert.deepEqual(Object.keys(canonical).includes('banner'), false);
  assert.deepEqual(Object.keys(canonical).includes('features'), false);
  assert.deepEqual(Object.keys(canonical).includes('pricing'), false);
  assert.deepEqual(Object.keys(canonical).includes('freeTrial'), false);
  assert.deepEqual(Object.keys(canonical).includes('platform'), false);
});
