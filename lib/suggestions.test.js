import test from 'node:test';
import assert from 'node:assert/strict';
import { validateToolSuggestion, validatePromptSubmission, cleanTags } from './contribution-validation.js';
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
    recommendation_reason: 'Helps teams catch bugs before PR merge.'
  };

  assert.equal(validateToolSuggestion(validSuggestion), null, 'Valid suggestion should have no error');

  const invalidUrl = {
    ...validSuggestion,
    website_url: 'not-a-valid-url'
  };
  assert.match(validateToolSuggestion(invalidUrl), /website/i, 'Should reject invalid website URL');

  const missingName = {
    ...validSuggestion,
    tool_name: ''
  };
  assert.match(validateToolSuggestion(missingName), /name/i, 'Should reject missing tool name');
});

test('validatePromptSubmission validates prompt content and types', () => {
  const validPrompt = {
    title: 'Generate React Components',
    type: 'prompt',
    prompt_content: 'Act as an expert React developer and generate a clean UI component...',
    ai_model: 'Claude 3.5 Sonnet',
    category: 'development',
    use_case: 'Component architecture',
    description: 'Generates robust accessible React components.',
    display_name: 'Bob Coder',
    is_anonymous: false
  };

  assert.equal(validatePromptSubmission(validPrompt), null, 'Valid prompt should have no error');

  const invalidType = {
    ...validPrompt,
    type: 'invalid-type'
  };
  assert.match(validatePromptSubmission(invalidType), /type/i, 'Should reject invalid content type');

  const missingContent = {
    ...validPrompt,
    prompt_content: ''
  };
  assert.match(validatePromptSubmission(missingContent), /content/i, 'Should reject empty prompt content');
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
    is_anonymous: false
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
    createdDate: new Date().toISOString()
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
