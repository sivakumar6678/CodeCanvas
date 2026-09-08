/**
 * Tool Catalog Health and URL Evaluation Utilities
 */

export function isValidHttpUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname && (parsed.hostname.includes('.') || parsed.hostname === 'localhost'));
  } catch {
    return false;
  }
}

export function evaluateToolHealth(t) {
  if (!t || typeof t !== 'object') {
    return {
      hasValidUrl: false,
      hasLogo: false,
      hasBanner: false,
      hasDescription: false,
      hasOverview: false,
      hasTags: false,
      missingImages: true,
      missingMetadata: true,
      brokenUrl: true,
      isHealthy: false
    };
  }

  const hasValidUrl = isValidHttpUrl(t.website);
  const hasLogo = Boolean(t.logoImageUrl || t.logo || t.logoImage);
  const hasBanner = Boolean(t.bannerImageUrl || t.banner || t.bannerImage);
  const hasDescription = Boolean(t.description && typeof t.description === 'string' && t.description.trim());
  const hasOverview = Boolean(
    (t.fullOverview && typeof t.fullOverview === 'string' && t.fullOverview.trim()) ||
    (t.overview && typeof t.overview === 'string' && t.overview.trim())
  );
  const hasTags = Array.isArray(t.tags) && t.tags.length > 0;

  const missingImages = !hasLogo || !hasBanner;
  const missingMetadata = !hasDescription || !hasOverview || !hasTags;
  const brokenUrl = !hasValidUrl;
  const isHealthy = hasValidUrl && hasLogo && hasBanner && hasDescription;

  return {
    hasValidUrl,
    hasLogo,
    hasBanner,
    hasDescription,
    hasOverview,
    hasTags,
    missingImages,
    missingMetadata,
    brokenUrl,
    isHealthy
  };
}

export function computeCatalogMetrics(tools = []) {
  let active = 0;
  let draft = 0;
  let archived = 0;
  let missingImages = 0;
  let missingMetadata = 0;
  let brokenUrls = 0;
  let healthyCount = 0;

  tools.forEach((t) => {
    const isArchived = t.status === 'archived';
    const isDraft = t.status === 'draft' || t.status === 'pending';
    if (isArchived) archived++;
    else if (isDraft) draft++;
    else active++;

    const health = evaluateToolHealth(t);
    if (health.missingImages) missingImages++;
    if (health.missingMetadata) missingMetadata++;
    if (health.brokenUrl) brokenUrls++;
    if (health.isHealthy) healthyCount++;
  });

  const total = tools.length;
  const healthScore = total > 0 ? Math.round((healthyCount / total) * 100) : 100;

  return {
    total,
    active,
    draft,
    archived,
    missingImages,
    missingMetadata,
    brokenUrls,
    healthyCount,
    healthScore
  };
}
