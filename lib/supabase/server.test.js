import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseCookieAdapter } from './server.js';

test('createSupabaseCookieAdapter supports Next.js cookie stores without getAll', () => {
  const calls = [];
  const cookieStore = {
    set(name, value, options) {
      calls.push({ method: 'set', name, value, options });
    },
  };

  const adapter = createSupabaseCookieAdapter(cookieStore);

  assert.deepEqual(adapter.getAll(), []);
  adapter.setAll([{ name: 'session', value: 'abc', options: { httpOnly: true } }]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'session');
  assert.equal(calls[0].value, 'abc');
});
