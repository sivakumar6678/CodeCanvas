import { ALLOWED_PRICING, normalizePricingModel } from './canonical-tool-schema.js';
import { getCatalogFileForCategory } from './catalog-categories.js';

export const CONTRIBUTION_STATUSES = ['pending', 'approved', 'rejected'];
export const CONTRIBUTION_TYPES = [
  'prompt',
  'trick',
  'shortcut',
  'slash-command',
  'technique',
  'guide',
  'tip',
];

export const CONTRIBUTION_TYPE_LABELS = {
  tool: 'AI Tool',
  prompt: 'Prompt',
  trick: 'Trick',
  shortcut: 'Shortcut / Slash Command',
  'slash-command': 'Shortcut / Slash Command',
  technique: 'Technique',
  guide: 'Guide / Tip',
  tip: 'Guide / Tip',
};

export function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function cleanTags(value) {
  const tags = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return [...new Set(tags.map((tag) => cleanText(tag, 40)).filter(Boolean))].slice(0, 20);
}

function cleanStringList(value, maxLength = 200, maxItems = 30) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\r?\n/)
      : [];
  return [...new Set(items.map((item) => cleanText(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

function getToolField(payload, canonical, legacy) {
  return payload[canonical] ?? payload[legacy];
}

function normalizeToolCategory(value) {
  const category = cleanText(value, 80).toLowerCase();
  const legacyCategories = {
    'design & ui': 'design',
    'image & art': 'image',
    'video & animation': 'video',
    'audio & music': 'audio-voice',
    'writing & content': 'writing',
    'marketing & seo': 'marketing-seo',
    'data & analytics': 'data-ai',
    'research & science': 'research-ai',
    'chat & assistants': 'ai-assistants',
    automation: 'no-code-automation',
  };
  return legacyCategories[category] || category;
}

export function normalizeToolSuggestion(payload) {
  const fullOverview = cleanText(
    [payload.fullOverview, payload.full_overview, payload.recommendation_reason]
      .find((value) => typeof value === 'string' && value.trim()),
    10000
  );
  const displayName = cleanText(payload.display_name, 80);

  return {
    name: cleanText(getToolField(payload, 'name', 'tool_name'), 120),
    website: cleanText(getToolField(payload, 'website', 'website_url'), 500),
    category: normalizeToolCategory(payload.category),
    subCategory: cleanText(getToolField(payload, 'subCategory', 'subcategory'), 80),
    description: cleanText(payload.description, 1000),
    fullOverview,
    keyFeatures: cleanStringList(getToolField(payload, 'keyFeatures', 'key_features')),
    pros: cleanStringList(payload.pros),
    cons: cleanStringList(payload.cons),
    pricingModel: normalizePricingModel(getToolField(payload, 'pricingModel', 'pricing')),
    platforms: cleanStringList(payload.platforms, 80),
    tags: cleanTags(payload.tags),
    useCases: cleanStringList(getToolField(payload, 'useCases', 'use_cases')),
    bestFor: cleanStringList(getToolField(payload, 'bestFor', 'best_for')),
    logoImageUrl: cleanText(getToolField(payload, 'logoImageUrl', 'logo_image_url') ?? payload.logo, 2000),
    bannerImageUrl: cleanText(getToolField(payload, 'bannerImageUrl', 'banner_image_url') ?? payload.banner, 2000),
    displayName: payload.is_anonymous ? 'Anonymous contributor' : displayName,
    isAnonymous: Boolean(payload.is_anonymous),
    recommendationReason: cleanText(payload.recommendation_reason || fullOverview, 10000),
  };
}

export function validateToolSuggestion(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'A tool suggestion is required';

  const stringFields = [
    ['name', 'tool_name', 'Tool name', 120],
    ['website', 'website_url', 'Official website URL', 500],
    ['category', 'category', 'Category', 80],
    ['subCategory', 'subcategory', 'Subcategory', 80],
    ['description', 'description', 'Short description', 1000],
    ['fullOverview', 'full_overview', 'Full overview', 10000],
    ['pricingModel', 'pricing', 'Pricing model', 80],
    ['logoImageUrl', 'logo_image_url', 'Logo image URL', 2000],
    ['bannerImageUrl', 'banner_image_url', 'Banner image URL', 2000],
    ['display_name', 'display_name', 'Display name', 80],
  ];
  for (const [canonical, legacy, label, maxLength] of stringFields) {
    const value = getToolField(payload, canonical, legacy);
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return `${label} must be text`;
    }
    if (typeof value === 'string' && value.length > maxLength) {
      return `${label} must be ${maxLength} characters or fewer`;
    }
  }
  if (payload.recommendation_reason !== undefined && typeof payload.recommendation_reason !== 'string') {
    return 'Recommendation reason must be text';
  }
  if (
    payload.recommendation_reason !== undefined &&
    payload.recommendation_reason.length > 10000
  ) {
    return 'Recommendation reason must be 10000 characters or fewer';
  }
  if (payload.is_anonymous !== undefined && typeof payload.is_anonymous !== 'boolean') {
    return 'Anonymous selection must be true or false';
  }

  const tool = normalizeToolSuggestion(payload);
  if (!tool.name) return 'Tool name is required';
  if (!tool.website || !validateUrl(tool.website)) return 'A valid HTTP or HTTPS official website URL is required';
  if (!tool.category) return 'Category is required';
  if (!getCatalogFileForCategory(tool.category)) return 'Choose a supported catalog category';
  if (!tool.description) return 'A short tool description is required';
  if (!tool.fullOverview) return 'A full tool overview is required';
  if (tool.logoImageUrl && !validateUrl(tool.logoImageUrl)) return 'Logo image URL must be a valid HTTP or HTTPS URL';
  if (tool.bannerImageUrl && !validateUrl(tool.bannerImageUrl)) return 'Banner image URL must be a valid HTTP or HTTPS URL';
  if (!tool.pricingModel || !ALLOWED_PRICING.includes(tool.pricingModel)) {
    return `Pricing model must be one of: ${ALLOWED_PRICING.join(', ')}`;
  }
  if (!payload.is_anonymous && !tool.displayName) return 'Display name is required unless anonymous';

  for (const [field, alias] of [
    ['keyFeatures', 'key_features'],
    ['pros', 'pros'],
    ['cons', 'cons'],
    ['platforms', 'platforms'],
    ['tags', 'tags'],
    ['useCases', 'use_cases'],
    ['bestFor', 'best_for'],
  ]) {
    const value = payload[field] ?? payload[alias];
    if (value !== undefined && value !== null && !Array.isArray(value) && typeof value !== 'string') {
      return `${field} must be a list of strings`;
    }
    if (Array.isArray(value) && value.some((item) => typeof item !== 'string')) {
      return `${field} must contain only strings`;
    }
    const items = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(field === 'tags' ? ',' : /\r?\n/)
        : [];
    const maxItems = field === 'tags' ? 20 : 30;
    if (items.length > maxItems) return `${field} must contain no more than ${maxItems} items`;
    const maxLength = field === 'tags' ? 40 : field === 'platforms' ? 80 : 200;
    if (items.some((item) => item.trim().length > maxLength)) {
      return `Each ${field} item must be ${maxLength} characters or fewer`;
    }
  }
  return null;
}

export function mapToolSuggestionToDatabase(payload) {
  const tool = normalizeToolSuggestion(payload);
  return {
    tool_name: tool.name,
    website_url: tool.website,
    category: tool.category,
    subcategory: tool.subCategory,
    description: tool.description,
    full_overview: tool.fullOverview,
    key_features: tool.keyFeatures,
    pros: tool.pros,
    cons: tool.cons,
    pricing: tool.pricingModel,
    platforms: tool.platforms,
    tags: tool.tags,
    use_cases: tool.useCases,
    best_for: tool.bestFor,
    logo_image_url: tool.logoImageUrl || null,
    banner_image_url: tool.bannerImageUrl || null,
    recommendation_reason: tool.recommendationReason,
    display_name: tool.displayName,
    is_anonymous: tool.isAnonymous,
  };
}

export function mapToolSuggestionToCatalogFields(payload) {
  const tool = normalizeToolSuggestion(payload);
  return {
    name: tool.name,
    website: tool.website,
    category: tool.category,
    subCategory: tool.subCategory,
    description: tool.description,
    fullOverview: tool.fullOverview,
    keyFeatures: tool.keyFeatures,
    pros: tool.pros,
    cons: tool.cons,
    pricingModel: tool.pricingModel,
    platforms: tool.platforms,
    tags: tool.tags,
    useCases: tool.useCases,
    bestFor: tool.bestFor,
    logoImageUrl: tool.logoImageUrl,
    bannerImageUrl: tool.bannerImageUrl,
    hasFree: ['Free', 'Freemium', 'Free / Freemium'].includes(tool.pricingModel),
    suggestedBy: tool.isAnonymous ? null : tool.displayName,
  };
}

export function validateUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function validatePromptSubmission(payload) {
  if (!payload || typeof payload !== 'object') return 'A submission is required';
  for (const [field, label] of [
    ['title', 'Title'],
    ['prompt_content', 'Content'],
    ['ai_model', 'AI Model / Platform'],
    ['category', 'Category'],
    ['use_case', 'Use case'],
    ['description', 'Description'],
  ]) {
    if (!cleanText(payload[field], field === 'prompt_content' ? 10000 : 500)) return `${label} is required`;
  }
  if (!payload.is_anonymous && !cleanText(payload.display_name, 80)) return 'Display name is required unless anonymous';
  if (payload.type && !CONTRIBUTION_TYPES.includes(payload.type)) return 'Invalid contribution type';
  return null;
}

export function serializeToolSuggestion(payload, userId, idempotency = {}) {
  const toolFields = mapToolSuggestionToDatabase(payload);
  if (!['logoImageUrl', 'logo_image_url', 'logo'].some((field) => Object.hasOwn(payload, field))) {
    delete toolFields.logo_image_url;
  }
  if (!['bannerImageUrl', 'banner_image_url', 'banner'].some((field) => Object.hasOwn(payload, field))) {
    delete toolFields.banner_image_url;
  }
  return {
    user_id: userId,
    ...toolFields,
    status: 'pending',
    ...(idempotency.key ? {
      idempotency_key: idempotency.key,
      request_hash: idempotency.requestHash,
    } : {}),
  };
}

export function serializePromptSubmission(payload, userId) {
  const type = CONTRIBUTION_TYPES.includes(payload.type) ? payload.type : 'prompt';
  const platform = cleanText(payload.platform || payload.ai_model || 'Universal', 120);

  return {
    user_id: userId,
    title: cleanText(payload.title, 160),
    type,
    prompt_content: cleanText(payload.prompt_content, 10000),
    ai_model: cleanText(payload.ai_model, 120),
    platform,
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