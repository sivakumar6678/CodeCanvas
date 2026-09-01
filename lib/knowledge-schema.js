/**
 * Schema definitions, normalization, and validation for AI Knowledge Items
 */

export const ALLOWED_KNOWLEDGE_TYPES = [
  'prompt',
  'trick',
  'shortcut',
  'slash-command',
  'technique',
  'guide',
  'tip',
];

export const KNOWLEDGE_TYPE_LABELS = {
  prompt: 'Prompt',
  trick: 'Trick',
  shortcut: 'Shortcut',
  'slash-command': 'Shortcut / Slash Command',
  technique: 'Technique',
  guide: 'Guide',
  tip: 'Guide / Tip',
};

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(text) {
  if (!text || typeof text !== 'string') return `item-${Date.now()}`;
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || `item-${Date.now()}`;
}

export function normalizeKnowledgeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  let id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim().toLowerCase() : slugify(title);
  if (!SAFE_SLUG.test(id)) {
    id = slugify(id || title);
  }

  let type = typeof raw.type === 'string' ? raw.type.trim().toLowerCase() : 'prompt';
  if (!ALLOWED_KNOWLEDGE_TYPES.includes(type)) {
    if (type.includes('slash') || type.includes('command') || type.includes('shortcut')) {
      type = 'shortcut';
    } else if (type.includes('trick')) {
      type = 'trick';
    } else if (type.includes('technique')) {
      type = 'technique';
    } else if (type.includes('guide') || type.includes('tip')) {
      type = 'guide';
    } else {
      type = 'prompt';
    }
  }

  const prompt_content = typeof raw.prompt_content === 'string'
    ? raw.prompt_content.trim()
    : typeof raw.content === 'string'
    ? raw.content.trim()
    : typeof raw.prompt === 'string'
    ? raw.prompt.trim()
    : '';

  const ai_model = typeof raw.ai_model === 'string'
    ? raw.ai_model.trim()
    : typeof raw.model === 'string'
    ? raw.model.trim()
    : 'Universal';

  const category = typeof raw.category === 'string' && raw.category.trim()
    ? raw.category.trim()
    : 'Development';

  const description = typeof raw.description === 'string'
    ? raw.description.trim()
    : '';

  const use_case = typeof raw.use_case === 'string'
    ? raw.use_case.trim()
    : typeof raw.useCase === 'string'
    ? raw.useCase.trim()
    : '';

  let tags = [];
  if (Array.isArray(raw.tags)) {
    tags = raw.tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof raw.tags === 'string' && raw.tags.trim()) {
    tags = raw.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  let use_cases = [];
  if (Array.isArray(raw.use_cases)) {
    use_cases = raw.use_cases.map((u) => String(u).trim()).filter(Boolean);
  } else if (Array.isArray(raw.useCases)) {
    use_cases = raw.useCases.map((u) => String(u).trim()).filter(Boolean);
  } else if (typeof raw.use_cases === 'string' && raw.use_cases.trim()) {
    use_cases = raw.use_cases.split(',').map((u) => u.trim()).filter(Boolean);
  }

  if (use_case && !use_cases.includes(use_case)) {
    use_cases.unshift(use_case);
  }

  const display_name = typeof raw.display_name === 'string' && raw.display_name.trim()
    ? raw.display_name.trim()
    : typeof raw.author === 'string' && raw.author.trim()
    ? raw.author.trim()
    : 'CodeCraft Studio';

  const is_anonymous = Boolean(raw.is_anonymous);
  const created_date = typeof raw.created_date === 'string' && raw.created_date.trim()
    ? raw.created_date.trim()
    : new Date().toISOString().split('T')[0];

  return {
    id,
    title,
    type,
    prompt_content,
    ai_model,
    category,
    use_case: use_case || (use_cases[0] || 'General'),
    use_cases,
    tags,
    description,
    display_name,
    is_anonymous,
    created_date,
  };
}

export function validateKnowledgeItem(item) {
  if (!item || typeof item !== 'object') return 'Item payload must be an object';
  if (!item.title || typeof item.title !== 'string' || item.title.trim().length < 3) {
    return 'Title is required (at least 3 characters)';
  }
  if (!item.prompt_content || typeof item.prompt_content !== 'string' || item.prompt_content.trim().length < 5) {
    return 'Prompt content or instructions are required (at least 5 characters)';
  }
  if (!ALLOWED_KNOWLEDGE_TYPES.includes(item.type)) {
    return `Content type must be one of: ${ALLOWED_KNOWLEDGE_TYPES.join(', ')}`;
  }
  return null;
}
