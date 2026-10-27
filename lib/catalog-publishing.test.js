import test from 'node:test';
import assert from 'node:assert/strict';
import { findExistingPublishedTool } from './catalog-publishing.js';

const original = {
  id: 'tool-1793086304649',
  name: 'Pictory AI',
  slug: 'pictory-ai-mvqdafex',
  website: 'https://pictory.ai',
};
const publishedBySubmission = {
  id: 'tool-submission-suggestion-1',
  name: 'Another Tool',
  slug: 'another-tool',
  website: 'https://another.example',
};

test('repeat publication reuses the stable suggestion id or published slug', () => {
  assert.equal(
    findExistingPublishedTool([publishedBySubmission], 'suggestion-1', null, { name: 'Other', website: 'https://other.example' }),
    publishedBySubmission
  );
  assert.equal(
    findExistingPublishedTool([original], 'another-suggestion', original.slug, { name: 'Other', website: 'https://other.example' }),
    original
  );
});

test('a repeated contribution with the same normalized name and website does not create another catalog entry', () => {
  assert.equal(
    findExistingPublishedTool(
      [original],
      'new-suggestion',
      null,
      { name: 'Pictory-AI', website: 'https://www.pictory.ai/' }
    ),
    original
  );
});

test('different products on the same website remain separate', () => {
  assert.equal(
    findExistingPublishedTool(
      [original],
      'new-suggestion',
      null,
      { name: 'Pictory Studio', website: 'https://pictory.ai' }
    ),
    null
  );
});
