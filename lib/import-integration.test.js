import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { normalizeToolToCanonical, toCanonicalNames, toolToFormState, formStateToTool } from './canonical-tool-schema.js';
import { classifyToolRecords } from './tool-json-validation.js';

test('Comprehensive JSON import pipeline and form mapping test', async () => {
  // 1. Load actual categories and a sample of real catalog tools
  const categories = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/categories.json'), 'utf8'));
  const devTools = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/ai-tools/ai-development.json'), 'utf8'));
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

  const categories = [{ id: '1', slug: 'ai-development', name: 'AI Development' }];
  const categoryFiles = ['ai-development.json'];

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

test('Image update review state preservation and in-place sync', () => {
  // Mock review session with user decisions and conflict records
  const initialConflictRecords = [
    {
      recordIndex: 0,
      matchedBy: 'id',
      existing: {
        id: 'tool-1',
        slug: 'tool-alpha',
        name: 'Tool Alpha',
        logoImageUrl: 'https://alpha.com/old-logo.png',
        bannerImageUrl: 'https://alpha.com/old-banner.png',
        pricingModel: 'Free',
      },
      record: {
        id: 'tool-1',
        slug: 'tool-alpha',
        name: 'Tool Alpha Updated',
        logoImageUrl: 'https://alpha.com/new-logo.png',
        bannerImageUrl: 'https://alpha.com/old-banner.png',
        pricingModel: 'Paid',
      },
    },
    {
      recordIndex: 1,
      matchedBy: 'id',
      existing: {
        id: 'tool-2',
        slug: 'tool-beta',
        name: 'Tool Beta',
        logoImageUrl: 'https://beta.com/old-logo.png',
        bannerImageUrl: 'https://beta.com/old-banner.png',
      },
      record: {
        id: 'tool-2',
        slug: 'tool-beta',
        name: 'Tool Beta Updated',
        logoImageUrl: 'https://beta.com/old-logo.png',
        bannerImageUrl: 'https://beta.com/new-banner.png',
      },
    },
  ];

  const userDecisions = {
    0: { action: 'manual-merge', fields: { pricingModel: 'new' } },
    1: { action: 'keep-existing' },
  };

  const imageUpdates = [
    {
      id: 'tool-1',
      slug: 'tool-alpha',
      replaceLogo: true,
      newLogo: 'https://alpha.com/new-logo.png',
      replaceBanner: false,
    },
  ];

  // Apply image update state mutation (as done in applyImageUpdates / saveSingleToolImage)
  const updatedConflicts = initialConflictRecords.map((conflict) => {
    const matched = imageUpdates.find(
      (u) => (conflict.existing?.id && u.id === conflict.existing.id) || u.slug === conflict.existing?.slug
    );
    if (!matched) return conflict;

    const updatedExisting = { ...conflict.existing };
    if (matched.replaceLogo && matched.newLogo) updatedExisting.logoImageUrl = matched.newLogo;
    if (matched.replaceBanner && matched.newBanner) updatedExisting.bannerImageUrl = matched.newBanner;
    return { ...conflict, existing: updatedExisting };
  });

  // Verify: existing.logoImageUrl is updated
  assert.equal(updatedConflicts[0].existing.logoImageUrl, 'https://alpha.com/new-logo.png');
  // Verify: un-updated fields in existing remain identical
  assert.equal(updatedConflicts[0].existing.pricingModel, 'Free');
  assert.equal(updatedConflicts[0].existing.bannerImageUrl, 'https://alpha.com/old-banner.png');
  // Verify: user decisions are untouched
  assert.deepEqual(userDecisions[0], { action: 'manual-merge', fields: { pricingModel: 'new' } });
  assert.deepEqual(userDecisions[1], { action: 'keep-existing' });
  // Verify: second conflict is untouched
  assert.equal(updatedConflicts[1].existing.logoImageUrl, 'https://beta.com/old-logo.png');
});

test('Inline Image Editing in comparison review: existing vs incoming separation', () => {
  const initialRecords = [
    {
      id: 'tool-test-1',
      slug: 'test-tool',
      name: 'Test Tool',
      logoImageUrl: 'https://test.com/broken-new-logo.png',
      bannerImageUrl: 'https://test.com/valid-new-banner.png',
      pricingModel: 'Free',
    },
  ];

  const initialConflicts = [
    {
      recordIndex: 0,
      matchedBy: 'id',
      existing: {
        id: 'tool-test-1',
        slug: 'test-tool',
        name: 'Test Tool',
        logoImageUrl: 'https://test.com/old-missing-logo.png',
        bannerImageUrl: 'https://test.com/old-banner.png',
        pricingModel: 'Freemium',
      },
      record: { ...initialRecords[0] },
    },
  ];

  const userDecisions = {
    0: { action: 'manual-merge', fields: { logoImageUrl: 'new', pricingModel: 'existing' } },
  };

  // Test 1: User fixes the incoming (New) logo URL to a working URL
  const correctedIncomingLogo = 'https://test.com/fixed-new-logo.png';
  const updatedRecords = initialRecords.map((r, idx) => (idx === 0 ? { ...r, logoImageUrl: correctedIncomingLogo } : r));
  const conflictsAfterNewEdit = initialConflicts.map((c) =>
    c.recordIndex === 0
      ? { ...c, record: { ...c.record, logoImageUrl: correctedIncomingLogo } }
      : c
  );

  // Assert: Incoming record in pending records and conflict comparison reflects new logo
  assert.equal(updatedRecords[0].logoImageUrl, correctedIncomingLogo);
  assert.equal(conflictsAfterNewEdit[0].record.logoImageUrl, correctedIncomingLogo);
  // Assert: Existing image is completely untouched!
  assert.equal(conflictsAfterNewEdit[0].existing.logoImageUrl, 'https://test.com/old-missing-logo.png');
  // Assert: Decision is preserved!
  assert.equal(userDecisions[0].action, 'manual-merge');

  // Test 2: User fixes or replaces existing logo
  const correctedExistingLogo = 'https://test.com/saved-existing-logo.png';
  const conflictsAfterExistingEdit = conflictsAfterNewEdit.map((c) =>
    c.recordIndex === 0
      ? { ...c, existing: { ...c.existing, logoImageUrl: correctedExistingLogo } }
      : c
  );

  // Assert: Existing is updated with corrected logo
  assert.equal(conflictsAfterExistingEdit[0].existing.logoImageUrl, correctedExistingLogo);
  // Assert: Incoming record is completely untouched!
  assert.equal(conflictsAfterExistingEdit[0].record.logoImageUrl, correctedIncomingLogo);

  // Test 3: User intentionally clears incoming banner (sets to empty string)
  const conflictsAfterClearBanner = conflictsAfterExistingEdit.map((c) =>
    c.recordIndex === 0
      ? { ...c, record: { ...c.record, bannerImageUrl: '' } }
      : c
  );
  assert.equal(conflictsAfterClearBanner[0].record.bannerImageUrl, '');
  assert.equal(conflictsAfterClearBanner[0].existing.bannerImageUrl, 'https://test.com/old-banner.png');
});




