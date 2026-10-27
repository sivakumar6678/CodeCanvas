import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCatalogForMutation,
  softDeleteCatalogTool,
  upsertCatalogTools,
  visibleCatalogTools,
} from './catalog-persistence-core.js';

function createSupabase(rows = []) {
  const state = { rows, upsertCalls: 0, updateCalls: 0, failRead: false };
  return {
    state,
    from() {
      return {
        select() {
          const filters = {};
          const query = {
            eq(field, value) {
              filters[field] = value;
              return query;
            },
            order: async () => ({
              data: state.failRead ? null : state.rows.filter((row) =>
                Object.entries(filters).every(([field, value]) => row[field] === value)
              ),
              error: state.failRead ? { message: 'database unavailable' } : null,
            }),
            maybeSingle: async () => ({
              data: state.rows.find((row) => row.slug === filters.slug) || null,
              error: null,
            }),
          };
          return query;
        },
        async upsert(nextRows, options = {}) {
          state.upsertCalls += 1;
          for (const next of nextRows) {
            const existingIndex = state.rows.findIndex((row) => row.slug === next.slug);
            if (existingIndex < 0) state.rows.push(next);
            else if (!options.ignoreDuplicates) state.rows[existingIndex] = next;
          }
          return { error: null };
        },
        update(values) {
          return {
            eq: async (field, value) => {
              state.updateCalls += 1;
              const row = state.rows.find((item) => item[field] === value);
              if (row) Object.assign(row, values);
              return { error: null };
            },
          };
        },
      };
    },
  };
}

test('empty persistent catalog is seeded once from the local catalog', async () => {
  const supabase = createSupabase();
  const fallback = [{ id: 'tool-1', slug: 'tool-one', category: 'development' }];

  assert.deepEqual(await loadCatalogForMutation(supabase, fallback), fallback);
  assert.equal(supabase.state.upsertCalls, 1);
  assert.deepEqual(await loadCatalogForMutation(supabase, [{ slug: 'not-seeded' }]), fallback);
  assert.equal(supabase.state.upsertCalls, 1);
});

test('deleted catalog records stay as tombstones and are not exposed as active tools', async () => {
  const supabase = createSupabase([{
    slug: 'tool-one',
    published: true,
    data: { id: 'tool-1', slug: 'tool-one', status: 'deleted' },
  }]);

  assert.deepEqual(visibleCatalogTools(supabase.state.rows), []);
  assert.deepEqual(await loadCatalogForMutation(supabase, [{ slug: 'tool-one' }]), []);
  assert.equal(supabase.state.upsertCalls, 0);
});

test('soft delete preserves a persistent tombstone instead of removing the row', async () => {
  const supabase = createSupabase([{
    slug: 'tool-one',
    published: true,
    data: { id: 'tool-1', slug: 'tool-one' },
  }]);

  assert.equal(await softDeleteCatalogTool(supabase, 'tool-one'), true);
  assert.equal(supabase.state.rows.length, 1);
  assert.equal(supabase.state.rows[0].published, true);
  assert.equal(supabase.state.rows[0].data.status, 'deleted');
  assert.equal(supabase.state.updateCalls, 1);
});

test('a deleted final catalog entry does not trigger a JSON fallback restore', async () => {
  const supabase = createSupabase();
  const fallback = [{ id: 'tool-1', slug: 'tool-one', category: 'development' }];
  await loadCatalogForMutation(supabase, fallback);

  await softDeleteCatalogTool(supabase, 'tool-one');
  const current = await loadCatalogForMutation(supabase, fallback);

  assert.deepEqual(current, []);
  assert.equal(supabase.state.rows.length, 1);
  assert.equal(supabase.state.rows[0].data.status, 'deleted');
  assert.equal(supabase.state.upsertCalls, 1);
});

test('catalog bootstrap fails rather than falling back after a database read error', async () => {
  const supabase = createSupabase();
  supabase.state.failRead = true;

  await assert.rejects(
    loadCatalogForMutation(supabase, [{ slug: 'tool-one' }]),
    (error) => error.message === 'database unavailable'
  );
  assert.equal(supabase.state.upsertCalls, 0);
});

test('catalog upsert propagates database errors so a failed import cannot appear successful', async () => {
  const supabase = createSupabase();
  const databaseError = { code: '42501', message: 'row-level security violation' };
  supabase.from = () => ({
    upsert: async () => ({ error: databaseError }),
  });

  await assert.rejects(
    upsertCatalogTools(supabase, [{ slug: 'tool-one', category: 'development' }]),
    (error) => error === databaseError
  );
});

test('catalog upsert sends large imports as one complete batch', async () => {
  const supabase = createSupabase();
  const tools = Array.from({ length: 1000 }, (_, index) => ({
    id: `tool-${index}`,
    slug: `tool-${index}`,
    category: 'development',
  }));
  let writtenRows = [];
  let options;
  supabase.from = () => ({
    upsert: async (rows, upsertOptions) => {
      writtenRows = rows;
      options = upsertOptions;
      return { error: null };
    },
  });

  await upsertCatalogTools(supabase, tools);

  assert.equal(writtenRows.length, tools.length);
  assert.deepEqual(options, { onConflict: 'slug', ignoreDuplicates: false });
  assert.equal(writtenRows[999].slug, 'tool-999');
});
