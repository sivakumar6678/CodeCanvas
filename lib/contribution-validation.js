export const CONTRIBUTION_STATUSES = ['pending', 'approved', 'rejected'];
export const CONTRIBUTION_TYPES = ['prompt', 'trick', 'slash-command', 'technique'];

export function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function cleanTags(value) {
  const tags = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return [...new Set(tags.map((tag) => cleanText(tag, 40)).filter(Boolean))].slice(0, 20);
}

export function validateUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function validateToolSuggestion(payload) {
  if (!payload || typeof payload !== 'object') return 'A suggestion is required';
  if (!cleanText(payload.tool_name, 120)) return 'Tool name is required';
  if (!validateUrl(payload.website_url)) return 'A valid HTTP or HTTPS website URL is required';
  if (!cleanText(payload.category, 80)) return 'Category is required';
  if (!cleanText(payload.description, 1000)) return 'Description is required';
  if (!cleanText(payload.pricing, 80)) return 'Pricing is required';
  if (!cleanText(payload.recommendation_reason, 1000)) return 'Recommendation reason is required';
  if (!payload.is_anonymous && !cleanText(payload.display_name, 80)) return 'Display name is required unless anonymous';
  return null;
}

export function validatePromptSubmission(payload) {
  if (!payload || typeof payload !== 'object') return 'A prompt is required';
  for (const [field, label] of [['title', 'Prompt title'], ['prompt_content', 'Prompt content'], ['ai_model', 'AI/model'], ['category', 'Category'], ['use_case', 'Use case'], ['description', 'Description']]) {
    if (!cleanText(payload[field], field === 'prompt_content' ? 10000 : 500)) return `${label} is required`;
  }
  if (!payload.is_anonymous && !cleanText(payload.display_name, 80)) return 'Display name is required unless anonymous';
  if (payload.type && !CONTRIBUTION_TYPES.includes(payload.type)) return 'Invalid contribution type';
  return null;
}

export function serializeToolSuggestion(payload, userId) {
  return {
    user_id: userId,
    tool_name: cleanText(payload.tool_name, 120),
    website_url: cleanText(payload.website_url, 500),
    category: cleanText(payload.category, 80).toLowerCase(),
    subcategory: cleanText(payload.subcategory, 80),
    description: cleanText(payload.description, 1000),
    pricing: cleanText(payload.pricing, 80),
    tags: cleanTags(payload.tags),
    recommendation_reason: cleanText(payload.recommendation_reason, 1000),
    display_name: payload.is_anonymous ? 'Anonymous contributor' : cleanText(payload.display_name, 80),
    is_anonymous: Boolean(payload.is_anonymous),
    status: 'pending',
  };
}

export function serializePromptSubmission(payload, userId) {
  return {
    user_id: userId,
    title: cleanText(payload.title, 160),
    type: CONTRIBUTION_TYPES.includes(payload.type) ? payload.type : 'prompt',
    prompt_content: cleanText(payload.prompt_content, 10000),
    ai_model: cleanText(payload.ai_model, 120),
    category: cleanText(payload.category, 80).toLowerCase(),
    use_case: cleanText(payload.use_case, 160),
    use_cases: cleanTags(payload.use_cases || payload.use_case),
    tags: cleanTags(payload.tags),
    description: cleanText(payload.description, 500),
    display_name: payload.is_anonymous ? 'Anonymous contributor' : cleanText(payload.display_name, 80),
    is_anonymous: Boolean(payload.is_anonymous),
    contributor: { displayName: payload.is_anonymous ? 'Anonymous contributor' : cleanText(payload.display_name, 80) },
    status: 'pending',
  };
}