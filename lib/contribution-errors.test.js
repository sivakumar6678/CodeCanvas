import test from 'node:test';
import assert from 'node:assert/strict';
import { getToolSuggestionInsertFailure } from './contribution-errors.js';

test('tool suggestion insert reports an actionable migration message for schema errors', () => {
  for (const code of ['42P01', '42703', 'PGRST204', 'PGRST205']) {
    const failure = getToolSuggestionInsertFailure({ code });
    assert.equal(failure.status, 503);
    assert.match(failure.error, /data\/contributions_schema\.sql/);
  }
});

test('tool suggestion insert reports RLS permission errors without weakening policy', () => {
  const failure = getToolSuggestionInsertFailure({ code: '42501' });
  assert.equal(failure.status, 403);
  assert.match(failure.error, /authenticated insert policy/i);
});

test('tool suggestion insert keeps unexpected database failures generic', () => {
  const failure = getToolSuggestionInsertFailure({ code: 'XX000' });
  assert.equal(failure.status, 500);
  assert.match(failure.error, /try again/i);
});
