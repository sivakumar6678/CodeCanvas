/**
 * Tool Catalog Image Validation Utilities
 * Provides consistent 5-state image validation: missing, loading, valid, broken, unknown.
 */

export const IMAGE_STATUS = {
  MISSING: 'missing',
  LOADING: 'loading',
  VALID: 'valid',
  BROKEN: 'broken',
  UNKNOWN: 'unknown',
};

// In-memory cache for probed image URLs to avoid duplicate network checks
const probeCache = new Map();

/**
 * Validates whether a URL string is a syntactically valid HTTP/HTTPS URL.
 */
export function isValidImageUrlString(url) {
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

/**
 * Synchronously classifies an image URL's initial status.
 * Returns 'missing' if empty or invalid URL structure, or 'loading' if plausible URL.
 */
export function classifyImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return IMAGE_STATUS.MISSING;
  }

  const trimmed = url.trim();
  if (!isValidImageUrlString(trimmed)) {
    return IMAGE_STATUS.MISSING;
  }

  // Check cache for existing result
  if (probeCache.has(trimmed)) {
    return probeCache.get(trimmed);
  }

  return IMAGE_STATUS.LOADING;
}

/**
 * Probes an image URL in browser environments using the native Image() constructor.
 * Returns a Promise that resolves with one of: 'valid', 'broken', 'unknown'.
 * 
 * Inconclusive results (e.g. timeouts or CORS restrictions where failure cannot be confirmed)
 * are categorized as 'unknown' rather than 'broken'.
 */
export function probeImageUrl(url, options = {}) {
  const { timeoutMs = 6000 } = options;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return Promise.resolve(IMAGE_STATUS.MISSING);
  }

  const trimmed = url.trim();
  if (!isValidImageUrlString(trimmed)) {
    return Promise.resolve(IMAGE_STATUS.MISSING);
  }

  if (probeCache.has(trimmed)) {
    return Promise.resolve(probeCache.get(trimmed));
  }

  // Server-side environment fallback
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    probeCache.set(trimmed, IMAGE_STATUS.VALID);
    return Promise.resolve(IMAGE_STATUS.VALID);
  }

  return new Promise((resolve) => {
    let settled = false;
    const img = new Image();

    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      probeCache.set(trimmed, status);
      resolve(status);
    };

    // If host hangs or blocks, treat as unknown rather than confirmed broken
    const timer = setTimeout(() => {
      finish(IMAGE_STATUS.UNKNOWN);
    }, timeoutMs);

    img.onload = () => {
      // Natural dimensions check to confirm an actual image was decoded
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        finish(IMAGE_STATUS.VALID);
      } else {
        finish(IMAGE_STATUS.UNKNOWN);
      }
    };

    img.onerror = () => {
      finish(IMAGE_STATUS.BROKEN);
    };

    try {
      img.src = trimmed;
    } catch {
      finish(IMAGE_STATUS.BROKEN);
    }
  });
}

/**
 * Clears the probe cache (useful for testing or manual retries).
 */
export function clearImageProbeCache() {
  probeCache.clear();
}
