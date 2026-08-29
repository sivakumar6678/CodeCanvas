import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToolToCanonical } from './canonical-tool-schema.js';

test('Comparison matrix helper resolves canonical features, pricing, and pros/cons', () => {
  const toolA = normalizeToolToCanonical({
    name: 'Cursor',
    slug: 'cursor',
    category: 'development',
    pricing: 'Freemium',
    features: ['AI Code Completion', 'Chat in Editor'],
    pros: ['Fast', 'VS Code Native'],
    cons: ['Requires API Key for some features'],
    bestFor: ['Developers', 'Engineers'],
    useCases: ['Refactoring', 'Bug fixing'],
    freeTrial: true
  });

  const toolB = normalizeToolToCanonical({
    name: 'Copilot',
    slug: 'copilot',
    category: 'development',
    pricingModel: 'Paid',
    keyFeatures: ['Inline Suggestions', 'Multi-language'],
    pros: ['Integrated with GitHub'],
    cons: ['Limited contextual awareness'],
    best_for: ['General coding'],
    use_cases: ['Autocomplete'],
    hasFree: false
  });

  assert.equal(toolA.pricingModel, 'Freemium');
  assert.equal(toolB.pricingModel, 'Paid');
  assert.equal(toolA.hasFree, true);
  assert.equal(toolB.hasFree, false);
  assert.deepEqual(toolA.keyFeatures, ['AI Code Completion', 'Chat in Editor']);
  assert.deepEqual(toolB.keyFeatures, ['Inline Suggestions', 'Multi-language']);
  assert.deepEqual(toolA.bestFor, ['Developers', 'Engineers']);
  assert.deepEqual(toolB.bestFor, ['General coding']);
});

