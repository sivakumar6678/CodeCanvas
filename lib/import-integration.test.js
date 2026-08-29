import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { normalizeToolToCanonical, toCanonicalNames, toolToFormState, formStateToTool } from './canonical-tool-schema.js';
import { classifyToolRecords, validateToolRecords } from './tool-json-validation.js';

test('Comprehensive JSON import pipeline and form mapping test', async () => {
  // 1. Load actual categories and a sample of real catalog tools
  const categories = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/categories.json'), 'utf8'));
  const devTools = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/ai-tools/development.json'), 'utf8'));
  const categoryFiles = (await fs.readdir(path.join(process.cwd(), 'data/ai-tools'))).filter(f => f.endsWith('.json'));

  // 2. Prepare test batch containing:
  // - 1 existing tool update (GitHub Copilot)
  // - 1 new tool (Test New Tool)
  // - 1 invalid record (missing website)
  // - 1 duplicate identity conflict
  const existingToolToUpdate = {
    ...devTools[0],
    description: 'Updated Copilot Description',
    pricingModel: 'Paid',
    keyFeatures: ['Feature 1', 'Feature 2', 'Feature 3']
  };

  const newToolToAdd = {
    name: 'Pipeline New Tool',
    slug: 'pipeline-new-tool',
    category: 'development',
    subCategory: 'testing',
    description: 'A tool for automated testing pipelines',
    fullOverview: 'Detailed overview of the testing pipeline tool',
    website: 'https://pipeline-tool.test',
    logoImageUrl: 'https://pipeline-tool.test/logo.png',
    bannerImageUrl: 'https://pipeline-tool.test/banner.png',
    keyFeatures: ['Automated tests', 'Fast feedback'],
    pros: ['Speed', 'Coverage'],
    cons: ['Setup time'],
    pricingModel: 'Free',
    platforms: ['Web', 'CLI'],
    tags: ['Testing', 'Automation'],
    useCases: ['CI/CD testing', 'Unit test generation'],
    bestFor: ['QA engineers', 'Developers'],
    featured: false,
    new: true,
    verified: true,
    hasFree: true,
  };

  const invalidRecord = {
    name: 'Broken Tool',
    slug: 'broken-tool',
    category: 'development',
    description: 'No website URL provided',
    pricingModel: 'Free'
  };

  const duplicateNewTool = {
    ...newToolToAdd,
    name: 'Duplicate Pipeline New Tool'
  };

  const uploadBatch = [existingToolToUpdate, newToolToAdd, invalidRecord, duplicateNewTool];

  // 3. Test Normalization
  const normalizedBatch = uploadBatch.map(r => toCanonicalNames(normalizeToolToCanonical(r)));
  assert.equal(normalizedBatch.length, 4);

  // 4. Test Preview Classification
  const classification = classifyToolRecords(normalizedBatch, {
    categories,
    categoryFiles,
    existingTools: devTools
  });

  assert.equal(classification.records.length, 4, 'Records array must be present for client state');
  assert.equal(classification.existingTools.length, 1, 'Should find 1 existing tool');
  assert.equal(classification.newTools.length, 2, 'Should find 2 new tool candidates');
  assert.equal(classification.invalidRecords.length, 1, 'Should find 1 invalid record');
  assert.equal(classification.conflicts.length, 1, 'Should find 1 conflict for duplicate uploaded slug');

  // 5. Test Form Mapping (Open Edit Tool)
  // Verify ALL fields map into form state
  const formStateExisting = toolToFormState(devTools[0], categories);
  assert.ok(formStateExisting.name, 'Name should be populated');
  assert.ok(formStateExisting.slug, 'Slug should be populated');
  assert.ok(formStateExisting.category, 'Category should be populated');
  assert.ok(formStateExisting.description, 'Description should be populated');
  assert.ok(formStateExisting.fullOverview, 'Full overview should be populated from legacy overview');
  assert.ok(formStateExisting.keyFeatures.includes('Real-time code suggestions'), 'Key features should be populated from legacy features');
  assert.ok(formStateExisting.pros.length > 0, 'Pros should be populated');
  assert.ok(formStateExisting.cons.length > 0, 'Cons should be populated');
  assert.equal(formStateExisting.pricingModel, 'Paid', 'Pricing should map from legacy pricing');
  assert.ok(formStateExisting.platforms.includes('VS Code'), 'Platforms should map from legacy platform');
  assert.ok(formStateExisting.tags.includes('AI'), 'Tags should map');
  assert.ok(formStateExisting.useCases.includes('Inline code completion'), 'Use cases should map');
  assert.ok(formStateExisting.bestFor.includes('Beginners'), 'Best for should map');
  assert.equal(formStateExisting.hasFree, true, 'hasFree should map from freeTrial');
  assert.equal(formStateExisting.freeTrial, true, 'freeTrial should map from freeTrial');
  assert.equal(formStateExisting.featured, true);
  assert.equal(formStateExisting.verified, true);

  // Edit form state & convert back
  formStateExisting.keyFeatures += '\nNew Line Feature';
  const savedTool = formStateToTool(formStateExisting);
  assert.ok(savedTool.keyFeatures.includes('New Line Feature'), 'Saved tool should contain updated feature array');
  assert.equal(savedTool.fullOverview, formStateExisting.fullOverview);
  assert.equal(savedTool.pricingModel, 'Paid');

  // Verify new tool form state
  const formStateNew = toolToFormState(newToolToAdd, categories);
  assert.equal(formStateNew.name, 'Pipeline New Tool');
  assert.equal(formStateNew.bestFor, 'QA engineers\nDevelopers');
  assert.equal(formStateNew.platforms, 'Web, CLI');
  const savedNewTool = formStateToTool(formStateNew);
  assert.deepEqual(savedNewTool.bestFor, ['QA engineers', 'Developers']);
  assert.deepEqual(savedNewTool.platforms, ['Web', 'CLI']);
});

test('Selective Image Update Workflow - Detection, Selection, and Safe Normal Import', () => {
  const existingTools = [
    {
      id: 'tool-a',
      slug: 'tool-a',
      name: 'Tool Alpha',
      category: 'development',
      description: 'Alpha tool description',
      website: 'https://alpha.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://alpha.com/old-logo.png',
      bannerImageUrl: 'https://alpha.com/old-banner.png'
    },
    {
      id: 'tool-b',
      slug: 'tool-b',
      name: 'Tool Beta',
      category: 'development',
      description: 'Beta tool description',
      website: 'https://beta.com',
      pricingModel: 'Paid',
      logoImageUrl: 'https://beta.com/original-logo.png',
      bannerImageUrl: 'https://beta.com/original-banner.png'
    }
  ];

  const categories = [{ id: '1', slug: 'development', name: 'Development' }];
  const categoryFiles = ['development.json'];

  // Scenario 1: Upload JSON with new logo for Tool A, and new banner for Tool B
  const uploadedBatch = [
    {
      id: 'tool-a',
      slug: 'tool-a',
      name: 'Tool Alpha',
      category: 'development',
      description: 'Updated Alpha text',
      website: 'https://alpha.com',
      pricingModel: 'Free',
      logoImageUrl: 'https://alpha.com/new-logo.png',
      bannerImageUrl: 'https://alpha.com/old-banner.png'
    },
    {
      id: 'tool-b',
      slug: 'tool-b',
      name: 'Tool Beta',
      category: 'development',
      description: 'Updated Beta text',
      website: 'https://beta.com',
      pricingModel: 'Paid',
      logoImageUrl: 'https://beta.com/original-logo.png',
      bannerImageUrl: 'https://beta.com/new-banner.png'
    }
  ];

  const classified = classifyToolRecords(uploadedBatch, { categories, categoryFiles, existingTools });
  assert.equal(classified.imageUpdates.length, 2, 'Should detect 2 tools with image updates');

  // Test Normal Import: Normal import preserves existing images!
  const normalImportToolA = toCanonicalNames({
    ...uploadedBatch[0],
    logoImageUrl: existingTools[0].logoImageUrl || uploadedBatch[0].logoImageUrl,
    bannerImageUrl: existingTools[0].bannerImageUrl || uploadedBatch[0].bannerImageUrl
  });
  assert.equal(normalImportToolA.logoImageUrl, 'https://alpha.com/old-logo.png', 'Normal import must preserve existing logo');
  assert.equal(normalImportToolA.bannerImageUrl, 'https://alpha.com/old-banner.png', 'Normal import must preserve existing banner');

  // Test Selective Image Updates:
  // Scenario 4: Select only Logo for Tool A
  const toolAUpdates = {
    slug: 'tool-a',
    replaceLogo: true,
    newLogo: 'https://alpha.com/new-logo.png',
    replaceBanner: false,
    newBanner: 'https://alpha.com/old-banner.png'
  };

  const updatedToolA = { ...existingTools[0] };
  if (toolAUpdates.replaceLogo) updatedToolA.logoImageUrl = toolAUpdates.newLogo;
  if (toolAUpdates.replaceBanner) updatedToolA.bannerImageUrl = toolAUpdates.newBanner;

  assert.equal(updatedToolA.logoImageUrl, 'https://alpha.com/new-logo.png');
  assert.equal(updatedToolA.bannerImageUrl, 'https://alpha.com/old-banner.png');

  // Scenario 5: Select only Banner for Tool B
  const toolBUpdates = {
    slug: 'tool-b',
    replaceLogo: false,
    newLogo: 'https://beta.com/original-logo.png',
    replaceBanner: true,
    newBanner: 'https://beta.com/new-banner.png'
  };

  const updatedToolB = { ...existingTools[1] };
  if (toolBUpdates.replaceLogo) updatedToolB.logoImageUrl = toolBUpdates.newLogo;
  if (toolBUpdates.replaceBanner) updatedToolB.bannerImageUrl = toolBUpdates.newBanner;

  assert.equal(updatedToolB.logoImageUrl, 'https://beta.com/original-logo.png');
  assert.equal(updatedToolB.bannerImageUrl, 'https://beta.com/new-banner.png');

  // Scenario 6: Select neither
  const neitherUpdates = {
    slug: 'tool-a',
    replaceLogo: false,
    replaceBanner: false
  };
  const unselectedToolA = { ...existingTools[0] };
  if (neitherUpdates.replaceLogo) unselectedToolA.logoImageUrl = neitherUpdates.newLogo;
  if (neitherUpdates.replaceBanner) unselectedToolA.bannerImageUrl = neitherUpdates.newBanner;
  assert.equal(unselectedToolA.logoImageUrl, 'https://alpha.com/old-logo.png');
  assert.equal(unselectedToolA.bannerImageUrl, 'https://alpha.com/old-banner.png');

  // Scenario 9: JSON containing no image changes
  const identicalBatch = [existingTools[0], existingTools[1]];
  const classifiedIdentical = classifyToolRecords(identicalBatch, { categories, categoryFiles, existingTools });
  assert.equal(classifiedIdentical.imageUpdates.length, 0, 'No image updates detected when images are identical');
});


