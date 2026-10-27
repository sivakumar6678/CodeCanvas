import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminIdentity } from './access.js';

test('admin identity accepts only server-controlled role sources', () => {
  const user = {
    id: 'user-123',
    email: 'member@example.com',
    user_metadata: { role: 'admin' },
    app_metadata: {},
  };

  assert.equal(isAdminIdentity({ user: null, profile: null }), false);
  assert.equal(isAdminIdentity({ user, profile: null }), false);
  assert.equal(
    isAdminIdentity({ user: { ...user, app_metadata: { role: 'admin' } }, profile: null }),
    true
  );
  assert.equal(isAdminIdentity({ user, profile: { role: 'admin' } }), true);
});

test('admin identity honors the configured server-side email allowlist', () => {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = ' owner@example.com, ADMIN@example.com ';

  try {
    assert.equal(
      isAdminIdentity({ user: { email: 'admin@example.com', app_metadata: {} }, profile: null }),
      true
    );
    assert.equal(
      isAdminIdentity({ user: { email: 'member@example.com', app_metadata: {} }, profile: null }),
      false
    );
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  }
});
