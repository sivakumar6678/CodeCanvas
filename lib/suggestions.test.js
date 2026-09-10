import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateToolSuggestion,
  validatePromptSubmission,
  serializeToolSuggestion,
  serializePromptSubmission,
  cleanTags,
  CONTRIBUTION_TYPES,
  CONTRIBUTION_TYPE_LABELS,
} from './contribution-validation.js';
import { getCatalogFileForCategory } from './catalog-categories.js';
import { normalizeToolToCanonical, toCanonicalNames } from './canonical-tool-schema.js';

test('validateToolSuggestion validates required fields and urls', () => {
  const validSuggestion = {
    tool_name: 'AI Code Reviewer',
    website_url: 'https://codereview.ai',
    category: 'development',
    description: 'An AI-powered automated code review tool.',
    pricing: 'Freemium',
    display_name: 'Alice Dev',
    is_anonymous: false,
    recommendation_reason: 'Helps teams catch bugs before PR merge.',
  };

  assert.equal(validateToolSuggestion(validSuggestion), null, 'Valid suggestion should have no error');

  const invalidUrl = {
    ...validSuggestion,
    website_url: 'not-a-valid-url',
  };
  assert.match(validateToolSuggestion(invalidUrl), /website/i, 'Should reject invalid website URL');

  const missingName = {
    ...validSuggestion,
    tool_name: '',
  };
  assert.match(validateToolSuggestion(missingName), /name/i, 'Should reject missing tool name');
});

test('validatePromptSubmission validates all 6 knowledge content types', () => {
  const typesToTest = ['prompt', 'trick', 'shortcut', 'slash-command', 'technique', 'guide', 'tip'];

  for (const type of typesToTest) {
    const valid = {
      title: `Super ${type} for coding`,
      type,
      prompt_content: 'Act as an expert developer and generate clean solutions...',
      ai_model: 'Claude 3.5 Sonnet',
      platform: 'Claude 3.5 Sonnet',
      category: 'ai-development',
      use_case: 'Code generation',
      description: 'Useful knowledge item.',
      display_name: 'Bob Coder',
      is_anonymous: false,
    };

    assert.equal(validatePromptSubmission(valid), null, `Type "${type}" should be valid`);
    assert.ok(CONTRIBUTION_TYPES.includes(type));
    assert.ok(CONTRIBUTION_TYPE_LABELS[type]);
  }

  const invalidType = {
    title: 'Unknown asset',
    type: 'unsupported-type',
    prompt_content: 'Some text',
    ai_model: 'GPT-4o',
    category: 'development',
    use_case: 'Testing',
    description: 'Description',
    display_name: 'Bob',
  };
  assert.match(validatePromptSubmission(invalidType), /type/i, 'Should reject unsupported content type');

  const missingContent = {
    title: 'Missing content test',
    type: 'trick',
    prompt_content: '',
    ai_model: 'GPT-4o',
    category: 'development',
    use_case: 'Testing',
    description: 'Description',
    display_name: 'Bob',
  };
  assert.match(validatePromptSubmission(missingContent), /content/i, 'Should reject empty content');
});

test('serializePromptSubmission sets default status pending and formats contributor', () => {
  const raw = {
    title: 'Next.js 16 Trick',
    type: 'trick',
    prompt_content: 'Use Turbopack flags for instant rebuilds.',
    ai_model: 'Cursor',
    platform: 'Cursor',
    category: 'ai-development',
    use_case: 'Performance',
    tags: 'performance, turbo, nextjs',
    description: 'Faster builds.',
    display_name: 'Alice Dev',
    is_anonymous: false,
  };

  const serialized = serializePromptSubmission(raw, 'user-123');
  assert.equal(serialized.user_id, 'user-123');
  assert.equal(serialized.status, 'pending');
  assert.equal(serialized.type, 'trick');
  assert.equal(serialized.platform, 'Cursor');
  assert.equal(serialized.contributor.displayName, 'Alice Dev');
  assert.deepEqual(serialized.tags, ['performance', 'turbo', 'nextjs']);
});

test('serializeToolSuggestion serializes tool fields with status pending', () => {
  const raw = {
    tool_name: 'Super Agent',
    website_url: 'https://superagent.ai',
    category: 'ai-development',
    subcategory: 'coding-agents',
    description: 'Autonomous coding agent.',
    pricing: 'Paid',
    tags: ['agent', 'cli'],
    recommendation_reason: 'Automates complex tasks.',
    display_name: '',
    is_anonymous: true,
  };

  const serialized = serializeToolSuggestion(raw, 'user-456');
  assert.equal(serialized.user_id, 'user-456');
  assert.equal(serialized.status, 'pending');
  assert.equal(serialized.display_name, 'Anonymous contributor');
  assert.equal(serialized.is_anonymous, true);
});

test('publishTool formats canonical tool with category mapping', () => {
  const suggestion = {
    tool_name: 'Community AI Tool',
    website_url: 'https://community-tool.dev',
    category: 'development',
    subcategory: 'automation',
    description: 'Great developer tool',
    pricing: 'Freemium',
    tags: ['AI', 'Automation', 'DevOps'],
    recommendation_reason: 'Speeds up automated workflow.',
    display_name: 'Alice Developer',
    is_anonymous: false,
  };

  const catalogFile = getCatalogFileForCategory(suggestion.category);
  assert.equal(catalogFile, 'ai-development.json', 'Category development must map to ai-development.json');

  const rawTool = {
    id: 'tool-test-123',
    name: suggestion.tool_name,
    slug: 'community-ai-tool',
    logoImageUrl: '',
    bannerImageUrl: '',
    description: suggestion.description,
    fullOverview: suggestion.recommendation_reason,
    keyFeatures: [],
    pros: [],
    cons: [],
    website: suggestion.website_url,
    category: suggestion.category,
    subCategory: suggestion.subcategory,
    pricingModel: suggestion.pricing,
    hasFree: true,
    platforms: [],
    tags: suggestion.tags,
    useCases: [],
    bestFor: [],
    featured: false,
    new: true,
    verified: false,
    suggestedBy: suggestion.display_name,
    createdDate: new Date().toISOString(),
  };

  const canonical = toCanonicalNames(normalizeToolToCanonical(rawTool));

  assert.equal(canonical.name, 'Community AI Tool');
  assert.equal(canonical.slug, 'community-ai-tool');
  assert.equal(canonical.pricingModel, 'Freemium');
  assert.equal(canonical.fullOverview, 'Speeds up automated workflow.');
  assert.equal(canonical.category, 'development');
  assert.equal(canonical.subCategory, 'automation');
  assert.equal(canonical.suggestedBy, 'Alice Developer');
  assert.equal(canonical.hasFree, true);
});
