export const TOOL_COMPARISON_FIELD_ORDER = [
  'id',
  'name',
  'slug',
  'description',
  'fullOverview',
  'category',
  'subCategory',
  'website',
  'logoImageUrl',
  'bannerImageUrl',
  'pricingModel',
  'hasFree',
  'featured',
  'verified',
  'status',
  'platforms',
  'tags',
  'bestFor',
  'useCases',
  'keyFeatures',
  'pros',
  'cons',
  'new',
];

const standardFields = new Set(TOOL_COMPARISON_FIELD_ORDER);

export function getToolComparisonFields(existing, incoming) {
  const additionalFields = new Set([
    ...Object.keys(existing || {}),
    ...Object.keys(incoming || {}),
  ]);
  const sortedAdditionalFields = [...additionalFields]
    .filter((field) => !standardFields.has(field))
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

  return [...TOOL_COMPARISON_FIELD_ORDER, ...sortedAdditionalFields];
}

export function formatToolComparisonValue(record, field) {
  if (!record || !Object.hasOwn(record, field) || record[field] === undefined) return '—';

  const value = record[field];
  if (value === null) return 'null';
  if (value === '') return '""';
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
