import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToolToCanonical, toCanonicalNames, toolToFormState, formStateToTool } from './canonical-tool-schema.js';
import { validateToolRecords, classifyToolRecords } from './tool-json-validation.js';

test('normalizeToolToCanonical maps all fields correctly from legacy JSON', () => {
  const legacyTool = {
    id: 'tool-001',
    name: 'Test Legacy Tool',
    slug: 'test-legacy-tool',
    overview: 'Full markdown overview of the tool',
    features: ['Feature A', 'Feature B'],
    pros: ['Fast', 'Accurate'],
    cons: ['Expensive'],
    pricing: 'Freemium',
    logo: 'https://example.com/logo.png',
    banner: 'https://example.com/banner.png',
    website: 'https://example.com',
    platform: ['Web', 'Windows'],
    tags: ['AI', 'Productivity'],
    use_cases: ['Drafting', 'Analysis'],
    best_for: ['Writers', 'Researchers'],
    featured: true,
    new: false,
    verified: true,
    freeTrial: true,
    category: 'writing',
    subCategory: 'content-generation',
    description: 'Short card description'
  };

  const normalized = normalizeToolToCanonical(legacyTool);

  assert.equal(normalized.fullOverview, 'Full markdown overview of the tool');
  assert.deepEqual(normalized.keyFeatures, ['Feature A', 'Feature B']);
  assert.deepEqual(normalized.pros, ['Fast', 'Accurate']);
  assert.deepEqual(normalized.cons, ['Expensive']);
  assert.equal(normalized.pricingModel, 'Freemium');
  assert.equal(normalized.logoImageUrl, 'https://example.com/logo.png');
  assert.equal(normalized.bannerImageUrl, 'https://example.com/banner.png');
  assert.equal(normalized.website, 'https://example.com');
  assert.deepEqual(normalized.platforms, ['Web', 'Windows']);
  assert.deepEqual(normalized.tags, ['AI', 'Productivity']);
  assert.deepEqual(normalized.useCases, ['Drafting', 'Analysis']);
  assert.deepEqual(normalized.bestFor, ['Writers', 'Researchers']);
  assert.equal(normalized.featured, true);
  assert.equal(normalized.new, false);
  assert.equal(normalized.verified, true);
  assert.equal(normalized.hasFree, true);
  assert.equal(normalized.category, 'writing');
  assert.equal(normalized.subCategory, 'content-generation');
  assert.equal(normalized.description, 'Short card description');
  assert.equal(normalized.name, 'Test Legacy Tool');
  assert.equal(normalized.slug, 'test-legacy-tool');
});

test('toolToFormState and formStateToTool round-trip correctly', () => {
  const tool = {
    id: 'tool-002',
    name: 'Roundtrip Tool',
    slug: 'roundtrip-tool',
    category: 'development',
    subCategory: 'code-editor',
    description: 'Great editor',
    fullOverview: 'Comprehensive overview text',
    website: 'https://roundtrip.example.com',
    logoImageUrl: 'https://roundtrip.example.com/logo.png',
    bannerImageUrl: 'https://roundtrip.example.com/banner.png',
    keyFeatures: ['Feature 1', 'Feature 2'],
    pros: ['Pro 1'],
    cons: ['Con 1'],
    pricingModel: 'Paid',
    platforms: ['macOS', 'Linux'],
    tags: ['IDE', 'Code'],
    useCases: ['Web dev', 'Backend'],
    bestFor: ['Fullstack devs'],
    featured: false,
    new: true,
    verified: true,
    hasFree: false,
    freeTrial: false,
  };

  const formState = toolToFormState(tool);

  assert.equal(formState.keyFeatures, 'Feature 1\nFeature 2');
  assert.equal(formState.pros, 'Pro 1');
  assert.equal(formState.cons, 'Con 1');
  assert.equal(formState.platforms, 'macOS, Linux');
  assert.equal(formState.tags, 'IDE, Code');
  assert.equal(formState.useCases, 'Web dev\nBackend');
  assert.equal(formState.bestFor, 'Fullstack devs');
  assert.equal(formState.fullOverview, 'Comprehensive overview text');
  assert.equal(formState.pricingModel, 'Paid');
  assert.equal(formState.hasFree, false);

  const backToTool = formStateToTool(formState);

  assert.deepEqual(backToTool.keyFeatures, ['Feature 1', 'Feature 2']);
  assert.deepEqual(backToTool.pros, ['Pro 1']);
  assert.deepEqual(backToTool.cons, ['Con 1']);
  assert.deepEqual(backToTool.platforms, ['macOS', 'Linux']);
  assert.deepEqual(backToTool.tags, ['IDE', 'Code']);
  assert.deepEqual(backToTool.useCases, ['Web dev', 'Backend']);
  assert.deepEqual(backToTool.bestFor, ['Fullstack devs']);
  assert.equal(backToTool.name, 'Roundtrip Tool');
  assert.equal(backToTool.slug, 'roundtrip-tool');
  assert.equal(backToTool.pricingModel, 'Paid');
});

test('classifyToolRecords accurately classifies existing, new, invalid, and conflict records', () => {
  const existingTools = [
    {
      id: 'tool-100',
      name: 'Existing Tool One',
      slug: 'existing-tool-one',
      category: 'development',
      description: 'An existing tool',
      website: 'https://existing.com',
      pricingModel: 'Free'
    }
  ];

  const categories = [{ id: '1', slug: 'ai-development', name: 'AI Development' }, { id: '2', slug: 'creative-ai', name: 'Creative AI' }];
  const categoryFiles = ['ai-development.json', 'creative-ai.json'];

  const uploadedRecords = [
    // 1. Existing tool update
    {
      id: 'tool-100',
      name: 'Existing Tool One (Updated)',
      slug: 'existing-tool-one',
      category: 'development',
      description: 'Updated description',
      website: 'https://existing.com',
      pricingModel: 'Free'
    },
    // 2. New tool
    {
      name: 'Brand New Tool',
      slug: 'brand-new-tool',
      category: 'design',
      description: 'A new design tool',
      website: 'https://newdesign.com',
      pricingModel: 'Freemium'
    },
    // 3. Invalid tool (missing website)
    {
      name: 'Invalid Tool',
      slug: 'invalid-tool',
      category: 'development',
      description: 'Missing website',
      pricingModel: 'Free'
    },
    // 4. Conflict tool (duplicate uploaded slug)
    {
      name: 'Duplicate New Tool',
      slug: 'brand-new-tool',
      category: 'design',
      description: 'Another tool with duplicate slug',
      website: 'https://duplicate.com',
      pricingModel: 'Free'
    }
  ];

  const classified = classifyToolRecords(uploadedRecords, { categories, categoryFiles, existingTools });

  assert.equal(classified.records.length, 4);
  assert.equal(classified.existingTools.length, 1);
  assert.equal(classified.existingTools[0].record.name, 'Existing Tool One (Updated)');
  assert.equal(classified.newTools.length, 2);
  assert.equal(classified.invalidRecords.length, 1);
  assert.equal(classified.conflicts.length, 1);
});

test('classifyToolRecords detects selective image updates for existing tools', () => {
  const existingTools = [
    {
      id: 'tool-logo',
      slug: 'tool-logo',
      name: 'Tool Logo Test',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/old-logo.png',
      bannerImageUrl: 'https://test.com/same-banner.png'
    },
    {
      id: 'tool-banner',
      slug: 'tool-banner',
      name: 'Tool Banner Test',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/same-logo.png',
      bannerImageUrl: 'https://test.com/old-banner.png'
    },
    {
      id: 'tool-both',
      slug: 'tool-both',
      name: 'Tool Both Test',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/old-logo.png',
      bannerImageUrl: 'https://test.com/old-banner.png'
    },
    {
      id: 'tool-no-change',
      slug: 'tool-no-change',
      name: 'Tool No Change',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/current-logo.png',
      bannerImageUrl: 'https://test.com/current-banner.png'
    }
  ];

  const categories = [{ id: '1', slug: 'ai-development', name: 'AI Development' }];
  const categoryFiles = ['ai-development.json'];

  const uploadedRecords = [
    // 1. New Logo only
    {
      id: 'tool-logo',
      slug: 'tool-logo',
      name: 'Tool Logo Test',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/new-logo.png',
      bannerImageUrl: 'https://test.com/same-banner.png'
    },
    // 2. New Banner only
    {
      id: 'tool-banner',
      slug: 'tool-banner',
      name: 'Tool Banner Test',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/same-logo.png',
      bannerImageUrl: 'https://test.com/new-banner.png'
    },
    // 3. Both Logo and Banner changed
    {
      id: 'tool-both',
      slug: 'tool-both',
      name: 'Tool Both Test',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/new-logo.png',
      bannerImageUrl: 'https://test.com/new-banner.png'
    },
    // 4. Identical images (no changes)
    {
      id: 'tool-no-change',
      slug: 'tool-no-change',
      name: 'Tool No Change',
      category: 'development',
      description: 'Test tool',
      website: 'https://test.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://test.com/current-logo.png',
      bannerImageUrl: 'https://test.com/current-banner.png'
    }
  ];

  const classified = classifyToolRecords(uploadedRecords, { categories, categoryFiles, existingTools });

  assert.equal(classified.imageUpdates.length, 3, 'Should detect exactly 3 tools with image updates');
  
  const logoItem = classified.imageUpdates.find(u => u.slug === 'tool-logo');
  assert.equal(logoItem.hasLogoChange, true);
  assert.equal(logoItem.hasBannerChange, false);
  assert.equal(logoItem.newLogo, 'https://test.com/new-logo.png');

  const bannerItem = classified.imageUpdates.find(u => u.slug === 'tool-banner');
  assert.equal(bannerItem.hasLogoChange, false);
  assert.equal(bannerItem.hasBannerChange, true);
  assert.equal(bannerItem.newBanner, 'https://test.com/new-banner.png');

  const bothItem = classified.imageUpdates.find(u => u.slug === 'tool-both');
  assert.equal(bothItem.hasLogoChange, true);
  assert.equal(bothItem.hasBannerChange, true);
});


