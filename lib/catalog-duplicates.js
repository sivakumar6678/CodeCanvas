import { normalizeWebsite, normalizeToolName } from './tool-json-validation.js';

function identityKeys(tool) {
  return {
    id: tool?.id ? `id:${String(tool.id).toLowerCase().trim()}` : '',
    slug: tool?.slug ? `slug:${String(tool.slug).toLowerCase().trim()}` : '',
    website: tool?.website ? `website:${normalizeWebsite(tool.website)}` : '',
    name: tool?.name ? `name:${normalizeToolName(tool.name)}` : '',
  };
}

export function findDuplicateGroups(tools = []) {
  const groups = [];
  const assigned = new Set();

  for (let index = 0; index < tools.length; index += 1) {
    if (assigned.has(index)) continue;
    const first = tools[index];
    const firstKeys = identityKeys(first);
    const matches = [{ index, tool: first, matchedBy: [] }];

    for (let candidateIndex = index + 1; candidateIndex < tools.length; candidateIndex += 1) {
      const candidateKeys = identityKeys(tools[candidateIndex]);
      const matchedBy = Object.keys(firstKeys)
        .filter((key) => firstKeys[key] && candidateKeys[key] && firstKeys[key] === candidateKeys[key]);
      if (matchedBy.length > 0) {
        matches.push({ index: candidateIndex, tool: tools[candidateIndex], matchedBy });
      }
    }

    if (matches.length > 1) {
      matches.forEach(({ index: matchIndex }) => assigned.add(matchIndex));
      groups.push({
        id: `duplicate-${groups.length + 1}`,
        kind: matches.some((match) => match.matchedBy.includes('id') || match.matchedBy.includes('slug')) ? 'exact' : 'likely',
        matches,
      });
    }
  }

  return groups;
}

const PROTECTED_FIELDS = new Set([
  'id',
  'slug',
  'logoImageUrl',
  'bannerImageUrl',
  'website',
  'saves',
  'reviews',
  'ratings',
  'analytics',
  'relationships',
]);

export function mergeToolFields(existing, incoming, selectedFields = []) {
  const selected = new Set(selectedFields);
  const merged = { ...existing };
  Object.keys(incoming || {}).forEach((field) => {
    if (!selected.has(field)) return;
    const value = incoming[field];
    if (PROTECTED_FIELDS.has(field) && (value === null || value === undefined || value === '')) return;
    merged[field] = value;
  });
  return merged;
}

export function getProtectedFields() {
  return Array.from(PROTECTED_FIELDS);
}
