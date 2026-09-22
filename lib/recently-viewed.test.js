import test from 'node:test';
import assert from 'node:assert/strict';
import { builtinTools } from './toolData.js';

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateRecentlyViewedPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }
  const { tool_slug, tool_type = 'ai_tool' } = payload;
  if (!tool_slug || !SAFE_SLUG.test(tool_slug)) {
    return { valid: false, error: 'Valid tool_slug is required' };
  }
  const validToolType = tool_type === 'builtin_tool' ? 'builtin_tool' : 'ai_tool';
  return { valid: true, tool_slug, tool_type: validToolType };
}

function updateRecentlyViewedHistory(existingHistory = [], newRecord, maxLimit = 20) {
  const filtered = existingHistory.filter((item) => item.tool_slug !== newRecord.tool_slug);
  const updated = [newRecord, ...filtered];
  return updated.slice(0, maxLimit);
}

function resolveToolMetadata(record, allAiTools = [], builtinToolsList = []) {
  if (record.tool_type === 'builtin_tool') {
    const builtin = builtinToolsList.find((t) => t.id === record.tool_slug);
    return {
      name: builtin ? builtin.name : record.tool_slug,
      category: builtin ? builtin.category : 'Built-in Tool',
      href: `/tool/${record.tool_slug}`,
      type: 'Built-in Tool',
    };
  }
  const aiTool = allAiTools.find((t) => t.slug === record.tool_slug);
  return {
    name: aiTool ? aiTool.name : record.tool_slug,
    category: aiTool ? aiTool.category : 'AI Tool',
    href: `/ai-tools/tool/${record.tool_slug}`,
    type: 'AI Tool',
  };
}

test('validateRecentlyViewedPayload validates slug format and assigns default type', () => {
  assert.equal(validateRecentlyViewedPayload({ tool_slug: 'cursor' }).valid, true);
  assert.equal(validateRecentlyViewedPayload({ tool_slug: 'cursor' }).tool_type, 'ai_tool');

  assert.equal(
    validateRecentlyViewedPayload({ tool_slug: 'color-palette-generator', tool_type: 'builtin_tool' }).tool_type,
    'builtin_tool'
  );

  assert.equal(validateRecentlyViewedPayload({ tool_slug: 'INVALID_SLUG!!' }).valid, false);
  assert.equal(validateRecentlyViewedPayload({}).valid, false);
  assert.equal(validateRecentlyViewedPayload(null).valid, false);
});

test('updateRecentlyViewedHistory prevents duplicate entries and bumps revisited tool to top', () => {
  const initialHistory = [
    { tool_slug: 'claude', tool_type: 'ai_tool', viewed_at: '2026-09-10T10:00:00Z' },
    { tool_slug: 'v0', tool_type: 'ai_tool', viewed_at: '2026-09-10T09:00:00Z' },
    { tool_slug: 'cursor', tool_type: 'ai_tool', viewed_at: '2026-09-10T08:00:00Z' },
  ];

  // Re-visit 'cursor' at 11:00:00Z
  const revisitedRecord = {
    tool_slug: 'cursor',
    tool_type: 'ai_tool',
    viewed_at: '2026-09-10T11:00:00Z',
  };

  const updated = updateRecentlyViewedHistory(initialHistory, revisitedRecord);

  // Total length must remain 3 (no duplicate entry)
  assert.equal(updated.length, 3);
  // 'cursor' must now be at index 0
  assert.equal(updated[0].tool_slug, 'cursor');
  assert.equal(updated[0].viewed_at, '2026-09-10T11:00:00Z');
  // 'claude' should be at index 1 and 'v0' at index 2
  assert.equal(updated[1].tool_slug, 'claude');
  assert.equal(updated[2].tool_slug, 'v0');
});

test('updateRecentlyViewedHistory respects maximum history limit', () => {
  const history = Array.from({ length: 25 }, (_, i) => ({
    tool_slug: `tool-${i}`,
    tool_type: 'ai_tool',
    viewed_at: new Date(Date.now() - i * 60000).toISOString(),
  }));

  const newTool = {
    tool_slug: 'brand-new-tool',
    tool_type: 'ai_tool',
    viewed_at: new Date().toISOString(),
  };

  const updated = updateRecentlyViewedHistory(history, newTool, 20);
  assert.equal(updated.length, 20, 'History must be capped at 20 items');
  assert.equal(updated[0].tool_slug, 'brand-new-tool');
});

test('resolveToolMetadata enriches both AI tools and built-in developer tools', () => {
  const mockAiTools = [
    { slug: 'cursor', name: 'Cursor IDE', category: 'AI Development' },
  ];

  const aiRecord = { tool_slug: 'cursor', tool_type: 'ai_tool' };
  const aiResolved = resolveToolMetadata(aiRecord, mockAiTools, builtinTools);
  assert.equal(aiResolved.name, 'Cursor IDE');
  assert.equal(aiResolved.category, 'AI Development');
  assert.equal(aiResolved.href, '/ai-tools/tool/cursor');
  assert.equal(aiResolved.type, 'AI Tool');

  const builtinRecord = { tool_slug: 'color-palette-generator', tool_type: 'builtin_tool' };
  const builtinResolved = resolveToolMetadata(builtinRecord, mockAiTools, builtinTools);
  assert.equal(builtinResolved.name, 'Color Palette Generator');
  assert.equal(builtinResolved.href, '/tool/color-palette-generator');
  assert.equal(builtinResolved.type, 'Built-in Tool');
});

test('End-to-end flow: view tool -> appears in history -> revisit tool -> timestamp/order updates -> refresh/re-fetch -> history remains', () => {
  // Step 1: Simulate persistent storage (e.g. Supabase table)
  let databaseStorage = [];

  const simulateUpsert = (record) => {
    const existingIndex = databaseStorage.findIndex(
      (item) => item.tool_slug === record.tool_slug && item.user_id === record.user_id
    );
    if (existingIndex >= 0) {
      databaseStorage[existingIndex] = { ...databaseStorage[existingIndex], ...record };
    } else {
      databaseStorage.push(record);
    }
  };

  const simulateQuery = (userId) => {
    return databaseStorage
      .filter((item) => item.user_id === userId)
      .sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at))
      .slice(0, 20);
  };

  const userId = 'user-123';

  // 1. User views tool A ('cursor') at 10:00
  simulateUpsert({
    user_id: userId,
    tool_slug: 'cursor',
    tool_type: 'ai_tool',
    viewed_at: '2026-09-10T10:00:00Z',
  });

  let history = simulateQuery(userId);
  assert.equal(history.length, 1);
  assert.equal(history[0].tool_slug, 'cursor');
  assert.equal(history[0].viewed_at, '2026-09-10T10:00:00Z');

  // 2. User views tool B ('v0') at 10:05
  simulateUpsert({
    user_id: userId,
    tool_slug: 'v0',
    tool_type: 'ai_tool',
    viewed_at: '2026-09-10T10:05:00Z',
  });

  history = simulateQuery(userId);
  assert.equal(history.length, 2);
  assert.equal(history[0].tool_slug, 'v0');
  assert.equal(history[1].tool_slug, 'cursor');

  // 3. User views tool C ('color-palette-generator') at 10:10
  simulateUpsert({
    user_id: userId,
    tool_slug: 'color-palette-generator',
    tool_type: 'builtin_tool',
    viewed_at: '2026-09-10T10:10:00Z',
  });

  history = simulateQuery(userId);
  assert.equal(history.length, 3);
  assert.equal(history[0].tool_slug, 'color-palette-generator');
  assert.equal(history[1].tool_slug, 'v0');
  assert.equal(history[2].tool_slug, 'cursor');

  // 4. Revisit tool A ('cursor') at 10:15 -> updates timestamp, no duplicate, bumped to index 0
  simulateUpsert({
    user_id: userId,
    tool_slug: 'cursor',
    tool_type: 'ai_tool',
    viewed_at: '2026-09-10T10:15:00Z',
  });

  history = simulateQuery(userId);
  assert.equal(history.length, 3, 'No duplicate entry created on revisit');
  assert.equal(history[0].tool_slug, 'cursor', 'Revisited tool bumped to the top');
  assert.equal(history[0].viewed_at, '2026-09-10T10:15:00Z', 'Timestamp updated to revisit time');
  assert.equal(history[1].tool_slug, 'color-palette-generator');
  assert.equal(history[2].tool_slug, 'v0');

  // 5. Simulate page refresh / re-login: re-query database
  const refreshedHistory = simulateQuery(userId);
  assert.equal(refreshedHistory.length, 3);
  assert.equal(refreshedHistory[0].tool_slug, 'cursor');
  assert.equal(refreshedHistory[1].tool_slug, 'color-palette-generator');
  assert.equal(refreshedHistory[2].tool_slug, 'v0');

  // 6. Clear history
  databaseStorage = databaseStorage.filter((item) => item.user_id !== userId);
  const clearedHistory = simulateQuery(userId);
  assert.equal(clearedHistory.length, 0, 'History cleared successfully');
});


