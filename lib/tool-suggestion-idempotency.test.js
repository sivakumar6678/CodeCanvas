import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createToolSuggestionRequestHash,
  findToolSuggestionRequest,
  insertToolSuggestionOnce,
  ToolSuggestionIdempotencyConflict,
} from './tool-suggestion-idempotency.js';

const payload = {
  name: 'Safe Submit',
  website: 'https://safe-submit.example',
  category: 'development',
  description: 'A development tool.',
  fullOverview: 'A stable test contribution.',
  pricingModel: 'Freemium',
  display_name: 'Tester',
  is_anonymous: false,
};

function createSupabase(rows = []) {
  let inserted = 0;
  return {
    get inserted() { return inserted; },
    get rowCount() { return rows.length; },
    from() {
      return {
        select() {
          const filters = {};
          const query = {
            eq(field, value) {
              filters[field] = value;
              return query;
            },
            maybeSingle() {
              return Promise.resolve({
                data: rows.find((row) =>
                  row.user_id === filters.user_id && row.idempotency_key === filters.idempotency_key
                ) || null,
                error: null,
              });
            },
          };
          return query;
        },
        insert(row) {
          inserted += 1;
          const duplicate = rows.some((existing) =>
            existing.user_id === row.user_id && existing.idempotency_key === row.idempotency_key
          );
          if (duplicate) {
            return {
              select() {
                return {
                  single: () => Promise.resolve({ data: null, error: { code: '23505' } }),
                };
              },
            };
          }
          const stored = { id: `suggestion-${inserted}`, ...row };
          rows.push(stored);
          return {
            select() {
              return {
                single: () => Promise.resolve({ data: stored, error: null }),
              };
            },
          };
        },
      };
    },
  };
}

test('request hashes are stable and change when tool fields or image URLs change', () => {
  const withLogo = { ...payload, logoImageUrl: 'https://cdn.example/logo.png' };
  const first = createToolSuggestionRequestHash(withLogo);
  assert.equal(first, createToolSuggestionRequestHash({ ...withLogo }));
  assert.notEqual(first, createToolSuggestionRequestHash({ ...withLogo, name: 'Changed' }));
  assert.notEqual(
    first,
    createToolSuggestionRequestHash({ ...withLogo, logoImageUrl: 'https://cdn.example/other-logo.png' })
  );
});

test('repeated requests with the same user key return one stored suggestion', async () => {
  const supabase = createSupabase();
  const key = 'f7c0662c-2cf3-4f75-b91f-2e5e9a80cb6e';
  const hash = createToolSuggestionRequestHash(payload);

  const first = await insertToolSuggestionOnce(supabase, payload, 'user-1', key, hash);
  const retry = await insertToolSuggestionOnce(supabase, payload, 'user-1', key, hash);

  assert.equal(supabase.inserted, 1);
  assert.equal(first.duplicate, false);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.suggestion.id, first.suggestion.id);
});

test('idempotency keys are scoped to the authenticated user and reject changed request bodies', async () => {
  const supabase = createSupabase();
  const key = 'f7c0662c-2cf3-4f75-b91f-2e5e9a80cb6e';
  const hash = createToolSuggestionRequestHash(payload);
  await insertToolSuggestionOnce(supabase, payload, 'user-1', key, hash);

  const otherUser = await findToolSuggestionRequest(supabase, 'user-2', key, hash);
  assert.equal(otherUser, null);
  await assert.rejects(
    findToolSuggestionRequest(
      supabase,
      'user-1',
      key,
      createToolSuggestionRequestHash({ ...payload, name: 'Different Tool' })
    ),
    ToolSuggestionIdempotencyConflict
  );
});

test('concurrent retries converge on the unique user/key row', async () => {
  const supabase = createSupabase();
  const key = 'f7c0662c-2cf3-4f75-b91f-2e5e9a80cb6e';
  const hash = createToolSuggestionRequestHash(payload);
  const results = await Promise.all([
    insertToolSuggestionOnce(supabase, payload, 'user-1', key, hash),
    insertToolSuggestionOnce(supabase, payload, 'user-1', key, hash),
  ]);

  assert.equal(supabase.rowCount, 1);
  assert.equal(results[0].suggestion.id, results[1].suggestion.id);
  assert.equal(results.filter((result) => result.duplicate).length, 1);
});
