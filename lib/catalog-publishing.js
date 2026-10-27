import { normalizeToolName, normalizeWebsite } from './tool-json-validation.js';

export function findExistingPublishedTool(tools, suggestionId, publishedSlug, candidate) {
  const stableId = `tool-submission-${suggestionId}`;
  const bySubmission = tools.find((tool) =>
    tool.id === stableId || (publishedSlug && tool.slug === publishedSlug)
  );
  if (bySubmission) return bySubmission;

  const candidateName = normalizeToolName(candidate?.name);
  const candidateWebsite = normalizeWebsite(candidate?.website);
  if (!candidateName || !candidateWebsite) return null;

  return tools.find((tool) =>
    normalizeToolName(tool.name) === candidateName &&
    normalizeWebsite(tool.website) === candidateWebsite
  ) || null;
}
