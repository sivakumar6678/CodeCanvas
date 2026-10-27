import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogDatabaseFailure } from './catalog-errors.js';

test('maps RLS denial to a safe authorization response', () => {
  assert.deepEqual(catalogDatabaseFailure({ code: '42501' }), {
    status: 403,
    message: 'The database denied this catalog change. Verify the production admin profile or server-side catalog configuration.',
  });
});

test('maps unique catalog conflicts to HTTP 409', () => {
  assert.equal(catalogDatabaseFailure({ code: '23505' }).status, 409);
});

test('does not expose raw database errors to clients', () => {
  const failure = catalogDatabaseFailure({
    code: 'XX000',
    message: 'internal detail with user secret',
  });

  assert.equal(failure.status, 500);
  assert.equal(failure.message.includes('user secret'), false);
});
