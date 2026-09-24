import test from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateGroups, mergeToolFields } from './catalog-duplicates.js';

test('findDuplicateGroups detects exact and likely duplicate identities', () => {
  const groups = findDuplicateGroups([
    { id: 'one', slug: 'one', name: 'Alpha Tool', website: 'https://alpha.example.com' },
    { id: 'two', slug: 'two', name: 'Alpha Tool', website: 'https://www.alpha.example.com/' },
    { id: 'three', slug: 'three', name: 'Different Tool', website: 'https://different.example.com' },
    { id: 'three', slug: 'different-copy', name: 'Different Copy', website: 'https://different.example.com' },
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].kind, 'likely');
  assert.ok(groups[0].matches[1].matchedBy.includes('website'));
  assert.equal(groups[1].kind, 'exact');
});

test('mergeToolFields protects curated fields from empty incoming values', () => {
  const merged = mergeToolFields(
    { name: 'Existing', website: 'https://existing.example.com', logoImageUrl: 'https://existing.example.com/logo.png', description: 'Old' },
    { name: 'New', website: '', logoImageUrl: null, description: 'New description' },
    ['name', 'website', 'logoImageUrl', 'description'],
  );

  assert.equal(merged.name, 'New');
  assert.equal(merged.description, 'New description');
  assert.equal(merged.website, 'https://existing.example.com');
  assert.equal(merged.logoImageUrl, 'https://existing.example.com/logo.png');
});
