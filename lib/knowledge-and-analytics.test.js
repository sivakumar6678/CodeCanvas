import test from 'node:test';
import assert from 'node:assert/strict';

const mockKnowledgeBase = [
  {
    id: 'code-review-assistant',
    title: 'Code Review Assistant',
    description: 'Perform strict pull request reviews with security, performance, and best practice checks.',
    prompt_content: 'Act as a principal engineer reviewing this pull request...',
    category: 'Development',
    type: 'prompt',
    ai_model: 'Claude 3.5 Sonnet',
    use_case: 'code-review',
    tags: ['code-quality', 'security', 'best-practices'],
    views: 120,
    copies: 45,
    saves: 18,
  },
  {
    id: 'slash-compact-history',
    title: 'Slash Command: Compact Context',
    description: 'Compress lengthy conversation history while retaining key architectural decisions.',
    prompt_content: '/compact Summarize architectural choices and active state',
    category: 'Productivity',
    type: 'shortcut',
    ai_model: 'Claude Code',
    use_case: 'workflow-automation',
    tags: ['terminal', 'cli', 'productivity'],
    views: 85,
    copies: 30,
    saves: 12,
  },
  {
    id: 'chain-of-density',
    title: 'Chain of Density Summarization',
    description: 'Iteratively generate entity-dense summaries without increasing overall word length.',
    prompt_content: 'Perform 5 iterations of Chain of Density summarization on the following text...',
    category: 'Writing',
    type: 'technique',
    ai_model: 'GPT-4o',
    use_case: 'content-creation',
    tags: ['summarization', 'prompting-technique'],
    views: 200,
    copies: 90,
    saves: 40,
  },
  {
    id: 'vibe-coding-workflow',
    title: 'Vibe Coding Fast Prototyping Trick',
    description: 'Rapidly bootstrap full-stack apps with minimal upfront boilerplate.',
    prompt_content: 'Initialize a clean Next.js 15 App Router structure with Tailwind and Supabase...',
    category: 'Development',
    type: 'trick',
    ai_model: 'Cursor',
    use_case: 'mvp-building',
    tags: ['nextjs', 'rapid-prototyping', 'fullstack'],
    views: 310,
    copies: 150,
    saves: 75,
  }
];

function filterKnowledge(items, { query = '', category = '', model = '', type = '', useCase = '', tag = '' } = {}) {
  const q = query.trim().toLowerCase();
  const cat = category.trim().toLowerCase();
  const mdl = model.trim().toLowerCase();
  const typ = type.trim().toLowerCase();
  const uc = useCase.trim().toLowerCase();
  const tg = tag.trim().toLowerCase();

  return items.filter((item) => {
    if (q) {
      const matchQuery =
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.prompt_content?.toLowerCase().includes(q);
      if (!matchQuery) return false;
    }
    if (cat && item.category?.toLowerCase() !== cat) return false;
    if (mdl && item.ai_model?.toLowerCase() !== mdl) return false;
    if (typ && item.type?.toLowerCase() !== typ) return false;
    if (uc) {
      const itemUc = (item.use_case || '').toLowerCase();
      if (!itemUc.includes(uc)) return false;
    }
    if (tg) {
      const itemTags = Array.isArray(item.tags)
        ? item.tags.map((t) => String(t).toLowerCase())
        : (item.tags || '').toLowerCase().split(',').map((s) => s.trim());
      if (!itemTags.some((t) => t.includes(tg))) return false;
    }
    return true;
  });
}

function extractKnowledgeFacets(items) {
  const categories = new Set();
  const models = new Set();
  const types = new Set();
  const useCases = new Set();
  const tags = new Set();

  for (const item of items) {
    if (item.category) categories.add(item.category);
    if (item.ai_model) models.add(item.ai_model);
    if (item.type) types.add(item.type);
    if (item.use_case) useCases.add(item.use_case);
    if (Array.isArray(item.tags)) {
      item.tags.forEach((t) => tags.add(t));
    }
  }

  return {
    categories: Array.from(categories).sort(),
    models: Array.from(models).sort(),
    types: Array.from(types).sort(),
    useCases: Array.from(useCases).sort(),
    tags: Array.from(tags).sort(),
  };
}

function validateAnalyticsEventPayload({ event_type, tool_slug, prompt_id, user_id }) {
  const allowedEvents = ['view', 'click', 'copy', 'save', 'remove'];
  if (!allowedEvents.includes(event_type)) {
    return { valid: false, error: `Invalid event_type: ${event_type}` };
  }
  if (!tool_slug && !prompt_id) {
    return { valid: false, error: 'Event payload must specify either tool_slug or prompt_id' };
  }
  return { valid: true };
}

test('filterKnowledge filters by search query and type', () => {
  const results = filterKnowledge(mockKnowledgeBase, { query: 'summarization', type: 'technique' });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'chain-of-density');
});

test('filterKnowledge filters by useCase and tag', () => {
  const results = filterKnowledge(mockKnowledgeBase, { useCase: 'mvp-building', tag: 'rapid-prototyping' });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'vibe-coding-workflow');
});

test('filterKnowledge filters by category and AI model', () => {
  const results = filterKnowledge(mockKnowledgeBase, { category: 'Development', model: 'Claude 3.5 Sonnet' });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'code-review-assistant');
});

test('extractKnowledgeFacets collects unique facet lists', () => {
  const facets = extractKnowledgeFacets(mockKnowledgeBase);
  assert.deepEqual(facets.types, ['prompt', 'shortcut', 'technique', 'trick']);
  assert.ok(facets.categories.includes('Development'));
  assert.ok(facets.models.includes('Claude Code'));
  assert.ok(facets.useCases.includes('workflow-automation'));
  assert.ok(facets.tags.includes('security'));
});

test('validateAnalyticsEventPayload validates telemetry events', () => {
  assert.deepEqual(validateAnalyticsEventPayload({ event_type: 'copy', prompt_id: 'code-review-assistant' }), { valid: true });
  assert.deepEqual(validateAnalyticsEventPayload({ event_type: 'click', tool_slug: 'cursor' }), { valid: true });
  assert.equal(validateAnalyticsEventPayload({ event_type: 'invalid-event', prompt_id: '123' }).valid, false);
  assert.equal(validateAnalyticsEventPayload({ event_type: 'view' }).valid, false);
});

test('analytics validation rejects malformed tool slugs', async () => {
  const { isSafeAnalyticsSlug, validateAnalyticsPayload } = await import('./analytics.js');
  assert.equal(isSafeAnalyticsSlug('cursor'), true);
  assert.equal(isSafeAnalyticsSlug('cursor-ai-2'), true);
  assert.equal(isSafeAnalyticsSlug('cursor/../admin'), false);
  assert.equal(isSafeAnalyticsSlug('javascript:alert(1)'), false);
  assert.equal(validateAnalyticsPayload({ event_type: 'tool_view', entity_type: 'tool', entity_id: 'cursor/../admin' }).valid, false);
});

test('groupKnowledgeType maps all 5 content types and handles subtypes', async () => {
  const { groupKnowledgeType, PRIMARY_KNOWLEDGE_TYPES, validateKnowledgeItem } = await import('./knowledge-schema.js');
  const { default: defaultPrompts } = await import('../data/default-prompts.json', { with: { type: 'json' } });

  assert.equal(PRIMARY_KNOWLEDGE_TYPES.length, 5);
  assert.equal(groupKnowledgeType('prompt'), 'prompt');
  assert.equal(groupKnowledgeType('trick'), 'trick');
  assert.equal(groupKnowledgeType('shortcut'), 'shortcut');
  assert.equal(groupKnowledgeType('slash-command'), 'shortcut');
  assert.equal(groupKnowledgeType('technique'), 'technique');
  assert.equal(groupKnowledgeType('guide'), 'guide');
  assert.equal(groupKnowledgeType('tip'), 'guide');

  // Verify all default prompts conform to schema and represent all 5 groups
  const observedGroups = new Set();
  assert.ok(defaultPrompts.length >= 15);
  for (const item of defaultPrompts) {
    assert.equal(validateKnowledgeItem(item), null);
    observedGroups.add(groupKnowledgeType(item.type));
  }
  assert.equal(observedGroups.has('prompt'), true);
  assert.equal(observedGroups.has('trick'), true);
  assert.equal(observedGroups.has('shortcut'), true);
  assert.equal(observedGroups.has('technique'), true);
  assert.equal(observedGroups.has('guide'), true);
});

test('normalizeKnowledgeItem handles status and defaults to published', async () => {
  const { normalizeKnowledgeItem, filterKnowledge, extractKnowledgeFacets } = await import('./knowledge-schema.js');

  const defaultItem = normalizeKnowledgeItem({
    title: 'Test Prompt Item',
    prompt_content: 'Test prompt content instructions',
    category: 'Development',
  });
  assert.equal(defaultItem.status, 'published');

  const draftItem = normalizeKnowledgeItem({
    title: 'Draft Prompt Item',
    prompt_content: 'Test draft instructions',
    status: 'draft',
  });
  assert.equal(draftItem.status, 'draft');

  const publishedItem = normalizeKnowledgeItem({
    title: 'Published Item',
    prompt_content: 'Test published instructions',
    status: 'published',
  });
  assert.equal(publishedItem.status, 'published');

  // Test status filtering
  const items = [defaultItem, draftItem, publishedItem];
  const publishedOnly = filterKnowledge(items, { status: 'published' });
  assert.equal(publishedOnly.length, 2);

  const draftOnly = filterKnowledge(items, { status: 'draft' });
  assert.equal(draftOnly.length, 1);
  assert.equal(draftOnly[0].title, 'Draft Prompt Item');

  const allItems = filterKnowledge(items, { status: 'all' });
  assert.equal(allItems.length, 3);

  // Facet extraction
  const facets = extractKnowledgeFacets(items);
  assert.ok(facets.statuses.includes('published'));
  assert.ok(facets.statuses.includes('draft'));
});

test('analytics write client prefers service-role configuration and rejects anonymous writes without it', async () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret';

    const { getAnalyticsWriteClient } = await import(`./analytics.js?cache=${Date.now()}`);
    const anonClient = { from() { return { insert: () => ({ error: null }) }; } };
    const writeClient = getAnalyticsWriteClient(anonClient);

    assert.notEqual(writeClient, anonClient, 'Service-role backed analytics writes should prefer the admin client');
    assert.ok(writeClient && typeof writeClient.from === 'function');

    const { getAnalyticsWriteClient: noAdminClient } = await import(`./analytics.js?cache=${Date.now() + 1}`);
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal(noAdminClient({ from: () => ({ insert: () => ({ error: null }) }) }), null);
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;

    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});

test('prompt analytics payloads reject unsafe IDs and non-admin writes', async () => {
  const { validatePromptAnalyticsPayload, getAnalyticsWriteClient } = await import('./analytics.js');

  assert.equal(validatePromptAnalyticsPayload({ prompt_id: 'code-review-assistant', event_type: 'view' }).valid, true);
  assert.equal(validatePromptAnalyticsPayload({ prompt_id: '../admin', event_type: 'view' }).valid, false);
  assert.equal(validatePromptAnalyticsPayload({ prompt_id: 'code-review-assistant', event_type: 'delete' }).valid, false);
  assert.equal(getAnalyticsWriteClient(null), null);
});

test('validateAnalyticsPayload validates event types and sanitizes sensitive metadata', async () => {
  const { validateAnalyticsPayload, ALLOWED_EVENT_TYPES, sanitizeMetadata } = await import('./analytics.js');

  // Verify all allowed event types
  for (const eventType of ALLOWED_EVENT_TYPES) {
    const res = validateAnalyticsPayload({ event_type: eventType, entity_type: 'tool', entity_id: 'v0' });
    assert.equal(res.valid, true, `Event type ${eventType} should be valid`);
  }

  // Reject invalid event type
  const invalid = validateAnalyticsPayload({ event_type: 'unsupported_event' });
  assert.equal(invalid.valid, false);

  // Reject non-object payload
  assert.equal(validateAnalyticsPayload(null).valid, false);

  // Sanitization: sensitive keys are stripped
  const dirtyMetadata = {
    category: 'Development',
    rating: 5,
    user_email: 'secret@domain.com',
    auth_token: 'bearer-xyz',
    password_hash: '123456',
    ip_address: '127.0.0.1',
    valid_note: 'Great tool',
  };

  const clean = sanitizeMetadata(dirtyMetadata);
  assert.equal(clean.category, 'Development');
  assert.equal(clean.rating, 5);
  assert.equal(clean.valid_note, 'Great tool');
  assert.equal(clean.user_email, undefined, 'Email should be removed');
  assert.equal(clean.auth_token, undefined, 'Token should be removed');
  assert.equal(clean.password_hash, undefined, 'Password should be removed');
  assert.equal(clean.ip_address, undefined, 'IP should be removed');
});

test('computePopularCategories ranks categories by total engagement and assigns percentages', async () => {
  const { computePopularCategories } = await import('./analytics.js');

  const tools = [
    { slug: 'tool-1', category: 'AI Development' },
    { slug: 'tool-2', category: 'AI Development' },
    { slug: 'tool-3', category: 'Creative AI' },
    { slug: 'tool-4', category: 'Productivity' },
  ];

  const viewsBySlug = {
    'tool-1': 100,
    'tool-2': 50,
    'tool-3': 60,
    'tool-4': 20,
  };

  const categoryViewsCount = {
    'AI Development': 30,
  };

  const results = computePopularCategories(tools, viewsBySlug, categoryViewsCount);
  assert.equal(results.length, 3);
  assert.equal(results[0].name, 'AI Development');
  assert.equal(results[0].toolCount, 2);
  assert.equal(results[0].toolViews, 150);
  assert.equal(results[0].percentage, 100);

  // Subsequent categories should be sorted descending
  assert.ok(results[0].totalEngagement >= results[1].totalEngagement);
  assert.ok(results[1].totalEngagement >= results[2].totalEngagement);
});

test('computeMostSavedTools accurately aggregates saves and matches tool metadata', async () => {
  const { computeMostSavedTools } = await import('./analytics.js');

  const savedRecords = [
    { tool_slug: 'cursor' },
    { tool_slug: 'cursor' },
    { tool_slug: 'cursor' },
    { tool_slug: 'v0' },
    { tool_slug: 'v0' },
    { tool_slug: 'claude' },
  ];

  const allTools = [
    { slug: 'cursor', name: 'Cursor IDE', category: 'AI Development' },
    { slug: 'v0', name: 'v0 by Vercel', category: 'Creative AI' },
    { slug: 'claude', name: 'Claude', category: 'AI Assistants' },
  ];

  const mostSaved = computeMostSavedTools(savedRecords, allTools);
  assert.equal(mostSaved.length, 3);
  assert.equal(mostSaved[0].slug, 'cursor');
  assert.equal(mostSaved[0].name, 'Cursor IDE');
  assert.equal(mostSaved[0].saveCount, 3);
  assert.equal(mostSaved[1].slug, 'v0');
  assert.equal(mostSaved[1].saveCount, 2);
  assert.equal(mostSaved[2].slug, 'claude');
  assert.equal(mostSaved[2].saveCount, 1);
});

test('formatRecentActivity formats various event types with human-readable titles and links', async () => {
  const { formatRecentActivity } = await import('./analytics.js');

  const rawEvents = [
    { id: '1', event_type: 'tool_save', entity_id: 'cursor', occurred_at: '2026-09-10T10:00:00Z' },
    { id: '2', event_type: 'tool_review', entity_id: 'v0', metadata: { rating: 5 }, occurred_at: '2026-09-10T09:30:00Z' },
    { id: '3', event_type: 'search', entity_id: 'react agent', metadata: { count: 8 }, occurred_at: '2026-09-10T09:00:00Z' },
    { id: '4', event_type: 'knowledge_copy', entity_id: 'code-review-assistant', occurred_at: '2026-09-10T08:30:00Z' },
    { id: '5', event_type: 'contribution', entity_type: 'tool', entity_id: 'Devin AI', occurred_at: '2026-09-10T08:00:00Z' },
  ];

  const allTools = [
    { slug: 'cursor', name: 'Cursor IDE' },
    { slug: 'v0', name: 'v0 by Vercel' },
  ];

  const defaultPrompts = [
    { id: 'code-review-assistant', title: 'Code Review Assistant', type: 'prompt' },
  ];

  const activities = formatRecentActivity(rawEvents, allTools, defaultPrompts);
  assert.equal(activities.length, 5);

  assert.equal(activities[0].iconType, 'save');
  assert.match(activities[0].title, /Cursor IDE/);
  assert.equal(activities[0].link, '/ai-tools/tool/cursor');

  assert.equal(activities[1].iconType, 'review');
  assert.match(activities[1].title, /5★/);

  assert.equal(activities[2].iconType, 'search');
  assert.match(activities[2].title, /react agent/);
  assert.match(activities[2].subtitle, /8 results/);

  assert.equal(activities[3].iconType, 'copy');
  assert.match(activities[3].title, /Code Review Assistant/);
  assert.equal(activities[3].link, '/ai-knowledge/code-review-assistant');

  assert.equal(activities[4].iconType, 'contribution');
  assert.match(activities[4].title, /Devin AI/);
  assert.equal(activities[4].link, '/studio/contributions');
});

