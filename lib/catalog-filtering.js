/**
 * Pure AI Tools Catalog Filtering & Facet Extraction
 */

export const PRICING_OPTIONS = [
  { label: 'All Pricing', value: '' },
  { label: 'Free', value: 'free' },
  { label: 'Freemium', value: 'freemium' },
  { label: 'Paid', value: 'paid' },
];

export const SORT_OPTIONS = [
  { label: 'Featured First', value: 'featured' },
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Newest Added', value: 'newest' },
];

export const CATALOG_PAGE_SIZE = 25;
export const CATALOG_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export function getPaginationRange(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export function paginateTools(tools = [], page = 1, pageSize = CATALOG_PAGE_SIZE) {
  const safePageSize = Math.max(1, Number(pageSize) || CATALOG_PAGE_SIZE);
  const totalItems = tools.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Number(page) || 1));
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    items: tools.slice(startIndex, startIndex + safePageSize),
    pageSize: safePageSize,
    currentPage,
    totalItems,
    totalPages,
    rangeStart: totalItems === 0 ? 0 : startIndex + 1,
    rangeEnd: Math.min(startIndex + safePageSize, totalItems),
  };
}

/**
 * Filter an array of AI tool objects against query, category, subCategory, pricing, platform, useCase, tag, and sort.
 */
export function filterTools(tools = [], options = {}) {
  const {
    query = '',
    category = '',
    subCategory = '',
    pricing = '',
    platform = '',
    useCase = '',
    tag = '',
    sort = 'featured',
  } = options;

  const normalizedQuery = (query || '').toLowerCase().trim();
  const normalizedCategory = (category || '').toLowerCase().trim();
  const normalizedSubCategory = (subCategory || '').toLowerCase().trim();
  const normalizedPricing = (pricing || '').toLowerCase().trim();
  const normalizedPlatform = (platform || '').toLowerCase().trim();
  const normalizedUseCase = (useCase || '').toLowerCase().trim();
  const normalizedTag = (tag || '').toLowerCase().trim();

  let filtered = tools.filter((tool) => {
    if (!tool) return false;

    // 1. Search Query
    if (normalizedQuery) {
      const matchName = (tool.name || '').toLowerCase().includes(normalizedQuery);
      const matchDesc = (tool.description || '').toLowerCase().includes(normalizedQuery);
      const matchOverview = (tool.fullOverview || tool.overview || '').toLowerCase().includes(normalizedQuery);
      const matchTags = (tool.tags || []).some((t) => (t || '').toLowerCase().includes(normalizedQuery));
      const matchUseCases = (tool.useCases || []).some((u) => (u || '').toLowerCase().includes(normalizedQuery));
      if (!matchName && !matchDesc && !matchOverview && !matchTags && !matchUseCases) {
        return false;
      }
    }

    // 2. Main Category
    if (normalizedCategory) {
      const toolCat = (tool.category || '').toLowerCase();
      if (toolCat !== normalizedCategory) {
        return false;
      }
    }

    // 3. Subcategory
    if (normalizedSubCategory) {
      const toolSubCat = (tool.subCategory || '').toLowerCase();
      if (toolSubCat !== normalizedSubCategory) {
        return false;
      }
    }

    // 4. Pricing
    if (normalizedPricing) {
      const toolPricing = (tool.pricingModel || tool.pricing || '').toLowerCase();
      if (normalizedPricing === 'free') {
        const isFree = Boolean(tool.hasFree || tool.freeTrial || toolPricing === 'free' || toolPricing.includes('free'));
        if (!isFree) return false;
      } else if (normalizedPricing === 'freemium') {
        if (!toolPricing.includes('freemium')) return false;
      } else if (normalizedPricing === 'paid') {
        if (!toolPricing.includes('paid') && !toolPricing.includes('contact')) return false;
      }
    }

    // 5. Platform
    if (normalizedPlatform) {
      const toolPlatforms = (tool.platforms || tool.platform || []).map((p) => String(p).toLowerCase());
      const hasPlatform = toolPlatforms.some((p) => p.includes(normalizedPlatform) || normalizedPlatform.includes(p));
      if (!hasPlatform) return false;
    }

    // 6. Use Case
    if (normalizedUseCase) {
      const toolUseCases = (tool.useCases || tool.use_cases || []).map((u) => String(u).toLowerCase());
      const hasUseCase = toolUseCases.some((u) => u.includes(normalizedUseCase) || normalizedUseCase.includes(u));
      if (!hasUseCase) return false;
    }

    // 7. Tag
    if (normalizedTag) {
      const toolTags = (tool.tags || []).map((t) => String(t).toLowerCase());
      const hasTag = toolTags.some((t) => t === normalizedTag || t.includes(normalizedTag));
      if (!hasTag) return false;
    }

    return true;
  });

  // Sorting
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sort === 'newest') {
      const dateA = new Date(a.createdDate || 0).getTime();
      const dateB = new Date(b.createdDate || 0).getTime();
      return dateB - dateA;
    }
    // Default: 'featured'
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  return filtered;
}

/**
 * Extract available subcategories, platforms, use cases, tags from the tools dataset
 */
export function getAvailableFilterOptions(tools = [], selectedCategory = null) {
  const scopeTools = selectedCategory
    ? tools.filter((t) => (t.category || '').toLowerCase() === selectedCategory.toLowerCase())
    : tools;

  const subCategoriesSet = new Set();
  const platformsSet = new Set();
  const useCasesSet = new Set();
  const tagsSet = new Set();

  scopeTools.forEach((tool) => {
    if (tool.subCategory) subCategoriesSet.add(tool.subCategory);
    (tool.platforms || tool.platform || []).forEach((p) => {
      if (p) platformsSet.add(p);
    });
    (tool.useCases || tool.use_cases || []).forEach((u) => {
      if (u) useCasesSet.add(u);
    });
    (tool.tags || []).forEach((t) => {
      if (t) tagsSet.add(t);
    });
  });

  return {
    subCategories: Array.from(subCategoriesSet).sort(),
    platforms: Array.from(platformsSet).sort(),
    useCases: Array.from(useCasesSet).sort(),
    tags: Array.from(tagsSet).sort(),
  };
}
