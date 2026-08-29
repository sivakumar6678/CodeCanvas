/**
 * Canonical Tool Schema Definition and Normalization
 * 
 * This file defines the single source of truth for tool field names and types.
 * All tools should conform to this schema, with normalization handling legacy variants.
 */

export const ALLOWED_PRICING = ['Free', 'Freemium', 'Free / Freemium', 'Paid', 'Contact for pricing'];

export const CANONICAL_TOOL_FIELDS = {
  // Identity
  id: 'string',
  name: 'string',
  slug: 'string',

  // Categorization
  category: 'string',
  subCategory: 'string',

  // Content
  description: 'string (short, for cards)',
  fullOverview: 'string (full, for detail page)',

  // URLs
  website: 'string (HTTP/HTTPS URL)',
  logoImageUrl: 'string (image URL)',
  bannerImageUrl: 'string (image URL)',

  // Details
  keyFeatures: 'string[]',
  pros: 'string[]',
  cons: 'string[]',
  pricingModel: 'string',
  platforms: 'string[]',
  tags: 'string[]',
  useCases: 'string[]',
  bestFor: 'string[]',

  // Status
  featured: 'boolean',
  new: 'boolean',
  verified: 'boolean',
  hasFree: 'boolean',

  // Metadata
  createdDate: 'ISO 8601 timestamp',
};

/**
 * Safely coerce a value to a trimmed string. Returns '' for null, undefined, or non-strings.
 */
export function safeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return '';
}

/**
 * Normalize a string or array of strings into a string array.
 */
function normalizeStringArray(value, delimiter = /\n|,/) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    return value.split(delimiter).map((item) => item.trim()).filter((item) => item.length > 0);
  }
  return [];
}

/**
 * Normalize pricing string to match ALLOWED_PRICING casing if possible.
 */
export function normalizePricingModel(pricing) {
  if (!pricing || typeof pricing !== 'string') return '';
  const trimmed = pricing.trim();
  const match = ALLOWED_PRICING.find((p) => p.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

/**
 * Normalize tool record to canonical schema.
 * Handles legacy field names and inconsistent types without data loss.
 */
export function normalizeToolToCanonical(tool) {
  if (!tool || typeof tool !== 'object' || Array.isArray(tool)) return tool;

  const normalized = { ...tool };

  // ──────────────────────────────────────────────────────
  // Image URLs: Accept logo/logoImage/logoImageUrl variants
  // ──────────────────────────────────────────────────────
  if (!normalized.logoImageUrl) {
    if (typeof normalized.logo === 'string') normalized.logoImageUrl = normalized.logo.trim();
    else if (typeof normalized.logoImage === 'string') normalized.logoImageUrl = normalized.logoImage.trim();
  } else if (typeof normalized.logoImageUrl === 'string') {
    normalized.logoImageUrl = normalized.logoImageUrl.trim();
  }
  normalized.logoImageUrl = normalized.logoImageUrl || '';

  if (!normalized.bannerImageUrl) {
    if (typeof normalized.banner === 'string') normalized.bannerImageUrl = normalized.banner.trim();
    else if (typeof normalized.bannerImage === 'string') normalized.bannerImageUrl = normalized.bannerImage.trim();
  } else if (typeof normalized.bannerImageUrl === 'string') {
    normalized.bannerImageUrl = normalized.bannerImageUrl.trim();
  }
  normalized.bannerImageUrl = normalized.bannerImageUrl || '';

  // ──────────────────────────────────────────────────────
  // Overview: Accept overview/fullOverview variants
  // ──────────────────────────────────────────────────────
  if (!normalized.fullOverview) {
    if (typeof normalized.overview === 'string') normalized.fullOverview = normalized.overview.trim();
  } else if (typeof normalized.fullOverview === 'string') {
    normalized.fullOverview = normalized.fullOverview.trim();
  }
  normalized.fullOverview = normalized.fullOverview || '';

  // ──────────────────────────────────────────────────────
  // Description: Ensure it exists (fallback to overview if needed)
  // ──────────────────────────────────────────────────────
  if (!normalized.description && typeof normalized.overview === 'string') {
    normalized.description = normalized.overview.trim();
  }
  normalized.description = normalized.description ? String(normalized.description).trim() : '';

  // ──────────────────────────────────────────────────────
  // Features: Accept features/keyFeatures variants
  // ──────────────────────────────────────────────────────
  const features = normalizeStringArray(normalized.keyFeatures ?? normalized.features ?? []);
  normalized.keyFeatures = features;

  // ──────────────────────────────────────────────────────
  // Array fields: Normalize all variants
  // ──────────────────────────────────────────────────────
  const platforms = normalizeStringArray(normalized.platforms ?? normalized.platform ?? []);
  const useCases = normalizeStringArray(normalized.useCases ?? normalized.use_cases ?? []);
  const pros = normalizeStringArray(normalized.pros ?? []);
  const cons = normalizeStringArray(normalized.cons ?? []);
  const tags = normalizeStringArray(normalized.tags ?? []);
  const bestFor = normalizeStringArray(normalized.bestFor ?? normalized.best_for ?? []);

  normalized.platforms = platforms;
  normalized.useCases = useCases;
  normalized.pros = pros;
  normalized.cons = cons;
  normalized.tags = tags;
  normalized.bestFor = bestFor;

  // ──────────────────────────────────────────────────────
  // Pricing: Accept pricing/pricingModel variants
  // ──────────────────────────────────────────────────────
  const rawPricing = normalized.pricingModel || normalized.pricing;
  normalized.pricingModel = normalizePricingModel(rawPricing);

  // ──────────────────────────────────────────────────────
  // Free Trial: Accept freeTrial/hasFree variants
  // ──────────────────────────────────────────────────────
  if (normalized.hasFree === undefined) {
    normalized.hasFree = Boolean(normalized.freeTrial);
  } else {
    normalized.hasFree = Boolean(normalized.hasFree);
  }

  // ──────────────────────────────────────────────────────
  // Remove legacy names - output canonical names ONLY
  // ──────────────────────────────────────────────────────
  delete normalized.logo;
  delete normalized.logoImage;
  delete normalized.banner;
  delete normalized.bannerImage;
  delete normalized.overview;
  delete normalized.features;
  delete normalized.platform;
  delete normalized.pricing;
  delete normalized.freeTrial;
  delete normalized.use_cases;
  delete normalized.best_for;

  return normalized;
}

/**
 * Convert tool object to canonical field names for storage/API
 */
export function toCanonicalNames(tool) {
  const normalized = normalizeToolToCanonical(tool);
  return {
    id: normalized.id,
    name: safeString(normalized.name),
    slug: safeString(normalized.slug),
    category: safeString(normalized.category),
    subCategory: safeString(normalized.subCategory),
    description: safeString(normalized.description),
    fullOverview: safeString(normalized.fullOverview),
    website: safeString(normalized.website),
    logoImageUrl: safeString(normalized.logoImageUrl),
    bannerImageUrl: safeString(normalized.bannerImageUrl),
    keyFeatures: Array.isArray(normalized.keyFeatures) ? normalized.keyFeatures : [],
    pros: Array.isArray(normalized.pros) ? normalized.pros : [],
    cons: Array.isArray(normalized.cons) ? normalized.cons : [],
    pricingModel: safeString(normalized.pricingModel),
    platforms: Array.isArray(normalized.platforms) ? normalized.platforms : [],
    tags: Array.isArray(normalized.tags) ? normalized.tags : [],
    useCases: Array.isArray(normalized.useCases) ? normalized.useCases : [],
    bestFor: Array.isArray(normalized.bestFor) ? normalized.bestFor : [],
    featured: Boolean(normalized.featured),
    new: Boolean(normalized.new),
    verified: Boolean(normalized.verified),
    hasFree: Boolean(normalized.hasFree),
    createdDate: normalized.createdDate || new Date().toISOString(),
    ...(normalized.suggestedBy ? { suggestedBy: normalized.suggestedBy } : {}),
    ...(normalized.status ? { status: normalized.status } : {}),
  };
}

/**
 * Maps a tool (raw, legacy, or canonical) to the Edit Tool form state format.
 * Textarea and text input array fields are formatted into string format.
 */
export function toolToFormState(tool, categories = []) {
  if (!tool) {
    return {
      name: '',
      slug: '',
      category: categories[0]?.slug || '',
      subCategory: '',
      website: '',
      logoImageUrl: '',
      bannerImageUrl: '',
      description: '',
      fullOverview: '',
      keyFeatures: '',
      pros: '',
      cons: '',
      pricingModel: 'Free',
      platforms: '',
      tags: '',
      useCases: '',
      bestFor: '',
      featured: false,
      new: true,
      verified: false,
      hasFree: false,
      freeTrial: false,
      id: '',
      createdDate: '',
      status: 'active',
    };
  }

  const normalized = normalizeToolToCanonical(tool);

  const formatLineArray = (val) => (Array.isArray(val) ? val.join('\n') : typeof val === 'string' ? val : '');
  const formatCommaArray = (val) => (Array.isArray(val) ? val.join(', ') : typeof val === 'string' ? val : '');

  const hasFreeVal = normalized.hasFree !== undefined ? Boolean(normalized.hasFree) : Boolean(normalized.freeTrial);

  return {
    id: normalized.id || '',
    originalSlug: normalized.slug || '',
    originalCategory: normalized.category || '',
    name: normalized.name || '',
    slug: normalized.slug || '',
    category: normalized.category || categories[0]?.slug || '',
    subCategory: normalized.subCategory || '',
    website: normalized.website || '',
    logoImageUrl: normalized.logoImageUrl || '',
    bannerImageUrl: normalized.bannerImageUrl || '',
    description: normalized.description || '',
    fullOverview: normalized.fullOverview || '',
    keyFeatures: formatLineArray(normalized.keyFeatures),
    pros: formatLineArray(normalized.pros),
    cons: formatLineArray(normalized.cons),
    pricingModel: normalized.pricingModel || 'Free',
    platforms: formatCommaArray(normalized.platforms),
    tags: formatCommaArray(normalized.tags),
    useCases: formatLineArray(normalized.useCases),
    bestFor: formatLineArray(normalized.bestFor),
    featured: Boolean(normalized.featured),
    new: Boolean(normalized.new),
    verified: Boolean(normalized.verified),
    hasFree: hasFreeVal,
    freeTrial: hasFreeVal,
    createdDate: normalized.createdDate || '',
    status: normalized.status || 'active',
  };
}

/**
 * Converts Edit Tool form state back to canonical tool payload.
 * String inputs for arrays are cleanly parsed into arrays of trimmed strings.
 */
export function formStateToTool(formData) {
  if (!formData || typeof formData !== 'object') return {};

  const parseLineArray = (val) => {
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split('\n').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const parseCommaArray = (val) => {
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const hasFreeValue = Boolean(formData.hasFree || formData.freeTrial);

  const payload = {
    id: formData.id || undefined,
    name: safeString(formData.name),
    slug: safeString(formData.slug),
    category: safeString(formData.category),
    subCategory: safeString(formData.subCategory),
    description: safeString(formData.description),
    fullOverview: safeString(formData.fullOverview),
    website: safeString(formData.website),
    logoImageUrl: safeString(formData.logoImageUrl),
    bannerImageUrl: safeString(formData.bannerImageUrl),
    keyFeatures: parseLineArray(formData.keyFeatures),
    pros: parseLineArray(formData.pros),
    cons: parseLineArray(formData.cons),
    pricingModel: normalizePricingModel(formData.pricingModel),
    platforms: parseCommaArray(formData.platforms),
    tags: parseCommaArray(formData.tags),
    useCases: parseLineArray(formData.useCases),
    bestFor: parseLineArray(formData.bestFor),
    featured: Boolean(formData.featured),
    new: Boolean(formData.new),
    verified: Boolean(formData.verified),
    hasFree: hasFreeValue,
    createdDate: formData.createdDate || new Date().toISOString(),
    ...(formData.status ? { status: formData.status } : {}),
  };

  return payload;
}

/**
 * Validate required fields
 */
export function validateCanonicalTool(tool) {
  const required = ['id', 'name', 'slug', 'description', 'website', 'category', 'pricingModel'];
  const missing = required.filter((field) => !tool[field]);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}
