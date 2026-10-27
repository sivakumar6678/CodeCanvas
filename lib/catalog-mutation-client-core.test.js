import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCatalogMutationClient } from './catalog-mutation-client-core.js';

const user = { id: 'admin-id' };
const sessionClient = { name: 'session' };
const adminClient = { name: 'service-role' };

test('uses the server-only admin client after server-side admin authorization', () => {
  assert.equal(selectCatalogMutationClient({
    user,
    isAdmin: true,
    profile: null,
    sessionClient,
    adminClient,
  }), adminClient);
});

test('uses the session client only when the database profile satisfies catalog RLS', () => {
  assert.equal(selectCatalogMutationClient({
    user,
    isAdmin: true,
    profile: { role: 'admin' },
    sessionClient,
    adminClient: null,
  }), sessionClient);
});

test('rejects admin identities not recognized by the catalog RLS when service role is unavailable', () => {
  assert.equal(selectCatalogMutationClient({
    user,
    isAdmin: true,
    profile: { role: 'user' },
    sessionClient,
    adminClient: null,
  }), null);
});

test('never returns a catalog mutation client to unauthenticated or non-admin callers', () => {
  for (const auth of [
    { user: null, isAdmin: true, profile: { role: 'admin' } },
    { user, isAdmin: false, profile: { role: 'admin' } },
  ]) {
    assert.equal(selectCatalogMutationClient({
      ...auth,
      sessionClient,
      adminClient,
    }), null);
  }
});
