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
