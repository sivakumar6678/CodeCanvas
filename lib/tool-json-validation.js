export const ALLOWED_PRICING = ['Free', 'Freemium', 'Free / Freemium', 'Paid', 'Contact for pricing'];
export const REQUIRED_TOOL_FIELDS = ['name', 'slug', 'description', 'website', 'category', 'pricingModel'];
import { getCatalogFileForCategory } from './catalog-categories.js';
import { normalizeToolToCanonical } from './canonical-tool-schema.js';

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function normalizeToolRecord(tool) {
  return normalizeToolToCanonical(tool);
}

export function validateToolRecords(records, { categories = [], categoryFiles = [], existingTools = [] } = {}) {
  const errors = [];
  const conflicts = [];
  const validCategories = new Set(categories.map((category) => category.slug));
  const existingIds = new Set(existingTools.map((tool) => normalizeToolRecord(tool).id).filter(Boolean));
  const existingSlugs = new Set(existingTools.map((tool) => normalizeToolRecord(tool).slug).filter(Boolean));
  const importIds = new Set();
  const importSlugs = new Set();
  const list = Array.isArray(records) ? records.map(normalizeToolRecord) : [normalizeToolRecord(records)];

  if (!Array.isArray(records) && (!records || typeof records !== 'object')) {
    return { valid: false, records: [], errors: ['The JSON root must be an object or array of tool objects.'], conflicts: [] };
  }

  list.forEach((tool, index) => {
    const label = `Record ${index + 1}`;
    if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
      errors.push(`${label}: must be an object.`);
      return;
    }
    REQUIRED_TOOL_FIELDS.forEach((field) => {
      if (typeof tool[field] !== 'string' || !tool[field].trim()) errors.push(`${label}: missing required field "${field}".`);
    });
    if (tool.id && typeof tool.id !== 'string') errors.push(`${label}: id must be a string.`);
    if (tool.slug && !isSlug(tool.slug)) errors.push(`${label}: slug must use lowercase letters, numbers, and hyphens.`);
    if (tool.website && !isHttpUrl(tool.website)) errors.push(`${label}: website must be a valid HTTP or HTTPS URL.`);
    if (tool.category && validCategories.size && !validCategories.has(tool.category)) {
      errors.push(`${label}: unknown category "${tool.category}". Use one of the supported categories.`);
    } else if (tool.category && !getCatalogFileForCategory(tool.category)) {
      errors.push(`${label}: category "${tool.category}" has no JSON catalog mapping.`);
    } else if (tool.category && categoryFiles.length && !categoryFiles.includes(getCatalogFileForCategory(tool.category))) {
      errors.push(`${label}: category "${tool.category}" has no JSON catalog file.`);
    }
    if (tool.pricingModel && !ALLOWED_PRICING.includes(tool.pricingModel)) {
      errors.push(`${label}: pricing model must be one of ${ALLOWED_PRICING.join(', ')}.`);
    }
    ['logoImageUrl', 'bannerImageUrl', 'website', 'description', 'fullOverview', 'category', 'subCategory', 'pricingModel'].forEach((field) => {
      if (tool[field] !== undefined && tool[field] !== null && typeof tool[field] !== 'string') {
        errors.push(`${label}: ${field} must be a string or empty.`);
      }
    });
    ['keyFeatures', 'tags', 'useCases', 'platforms', 'pros', 'cons', 'bestFor'].forEach((field) => {
      if (tool[field] !== undefined && !Array.isArray(tool[field])) errors.push(`${label}: ${field} must be an array.`);
    });
    if (tool.id && existingIds.has(tool.id)) {
      const existing = existingTools.find((candidate) => normalizeToolRecord(candidate).id === tool.id);
      conflicts.push({ recordIndex: index, field: 'id', value: tool.id, type: 'existing-id', message: `${existing?.name || tool.name || label} already exists in the catalog (ID "${tool.id}").`, existingTool: existing || null });
    }
    if (tool.slug && existingSlugs.has(tool.slug)) {
      const existing = existingTools.find((candidate) => normalizeToolRecord(candidate).slug === tool.slug);
      conflicts.push({ recordIndex: index, field: 'slug', value: tool.slug, type: 'existing-slug', message: `${existing?.name || tool.name || label} already exists in the catalog (slug "${tool.slug}").`, existingTool: existing || null });
    }
    if (tool.id && importIds.has(tool.id)) conflicts.push({ recordIndex: index, field: 'id', value: tool.id, type: 'uploaded-id', message: `${label}: duplicate ID "${tool.id}" appears in this upload.` });
    if (tool.slug && importSlugs.has(tool.slug)) conflicts.push({ recordIndex: index, field: 'slug', value: tool.slug, type: 'uploaded-slug', message: `${label}: duplicate slug "${tool.slug}" appears in this upload.` });
    if (tool.id) importIds.add(tool.id);
    if (tool.slug) importSlugs.add(tool.slug);
  });

  return { valid: errors.length === 0, records: list, errors, conflicts };
}

export function parseToolJson(text) {
  try {
    return { records: JSON.parse(text), error: null };
  } catch {
    return { records: [], error: 'Invalid JSON. Check commas, quotes, and brackets.' };
  }
}

export function classifyToolRecords(records, options = {}) {
  const validation = validateToolRecords(records, options);
  const existingTools = options.existingTools || [];
  const byId = new Map(existingTools.filter((tool) => tool.id).map((tool) => [tool.id, tool]));
  const bySlug = new Map(existingTools.filter((tool) => tool.slug).map((tool) => [tool.slug, tool]));
  const conflictsByIndex = new Map();
  validation.conflicts.forEach((conflict) => {
    if (!conflict.type?.startsWith('uploaded-')) return;
    const list = conflictsByIndex.get(conflict.recordIndex) || [];
    list.push(conflict);
    conflictsByIndex.set(conflict.recordIndex, list);
  });

  const result = {
    records: validation.records,
    newTools: [],
    existingTools: [],
    invalidRecords: [],
    conflicts: [],
    errors: validation.errors,
  };

  if (!Array.isArray(validation.records)) return result;

  validation.records.forEach((record, index) => {
    const recordErrors = validation.errors.filter((message) => message.startsWith(`Record ${index + 1}:`));
    if (recordErrors.length > 0) {
      result.invalidRecords.push({ recordIndex: index, record, errors: recordErrors });
      return;
    }
    const idMatch = record.id ? byId.get(record.id) : null;
    const slugMatch = record.slug ? bySlug.get(record.slug) : null;
    if (idMatch && slugMatch && idMatch.id !== slugMatch.id) {
      result.conflicts.push({ recordIndex: index, record, reason: 'ID and slug match different catalog tools.', matches: [idMatch, slugMatch] });
      return;
    }
    const match = idMatch || slugMatch;
    if (match) {
      result.existingTools.push({ recordIndex: index, record, existing: match, matchedBy: idMatch ? 'id' : 'slug' });
    } else {
      result.newTools.push({ recordIndex: index, record });
    }
    if (conflictsByIndex.has(index)) {
      result.conflicts.push({ recordIndex: index, record, reason: 'Duplicate identity in uploaded data.', matches: conflictsByIndex.get(index) });
    }
  });

  const imageUpdates = [];
  result.existingTools.forEach(({ record, existing }) => {
    const currentLogo = existing.logoImageUrl || existing.logo || existing.logoImage || '';
    const newLogo = record.logoImageUrl || '';
    const hasLogoChange = Boolean(newLogo && newLogo.trim() && newLogo.trim() !== currentLogo.trim());

    const currentBanner = existing.bannerImageUrl || existing.banner || existing.bannerImage || '';
    const newBanner = record.bannerImageUrl || '';
    const hasBannerChange = Boolean(newBanner && newBanner.trim() && newBanner.trim() !== currentBanner.trim());

    if (hasLogoChange || hasBannerChange) {
      imageUpdates.push({
        id: existing.id || record.id,
        slug: existing.slug || record.slug,
        name: existing.name || record.name,
        category: existing.category || record.category,
        currentLogo,
        newLogo,
        currentBanner,
        newBanner,
        hasLogoChange,
        hasBannerChange,
      });
    }
  });

  result.imageUpdates = imageUpdates;

  return result;
}