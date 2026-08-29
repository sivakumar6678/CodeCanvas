'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FiX, FiFilter, FiLayers } from 'react-icons/fi';
import styles from './ToolFilterBar.module.scss';

const PRICING_OPTIONS = [
  { label: 'All Pricing', value: '' },
  { label: 'Free', value: 'free' },
  { label: 'Freemium', value: 'freemium' },
  { label: 'Paid', value: 'paid' },
];

const SORT_OPTIONS = [
  { label: 'Featured First', value: 'featured' },
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Newest Added', value: 'newest' },
];

export default function ToolFilterBar({
  totalCount = 0,
  currentCategory = '',
  categories = [],
  availableFilters = {},
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPricing = searchParams.get('pricing') || '';
  const currentSubCategory = searchParams.get('subCategory') || '';
  const currentPlatform = searchParams.get('platform') || '';
  const currentUseCase = searchParams.get('useCase') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'featured';

  // Determine active category object and its subcategories
  const activeCategoryObj = categories.find(
    (c) => c.slug === currentCategory || pathname.endsWith(`/${c.slug}`)
  );
  const subcategoryList =
    activeCategoryObj?.subcategories ||
    (availableFilters.subCategories || []).map((slug) => ({
      slug,
      name: slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    }));

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.get('q')) {
      params.set('q', searchParams.get('q'));
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const hasActiveFilters = Boolean(
    currentPricing || currentSubCategory || currentPlatform || currentUseCase || currentTag
  );

  return (
    <div className={styles.filterWrapper}>
      {/* Subcategories Row - Rendered cleanly when a category is selected */}
      {subcategoryList.length > 0 && (
        <div className={styles.subCategoryRow}>
          <span className={styles.subCategoryLabel}>
            <FiLayers /> Subcategories:
          </span>
          <div className={styles.subCategoryPills}>
            <button
              type="button"
              className={`${styles.subPill} ${!currentSubCategory ? styles.activeSubPill : ''}`}
              onClick={() => updateParam('subCategory', '')}
              suppressHydrationWarning
            >
              All {activeCategoryObj?.name || 'Subcategories'}
            </button>
            {subcategoryList.map((sub) => (
              <button
                key={sub.slug}
                type="button"
                className={`${styles.subPill} ${currentSubCategory === sub.slug ? styles.activeSubPill : ''}`}
                onClick={() => updateParam('subCategory', currentSubCategory === sub.slug ? '' : sub.slug)}
                suppressHydrationWarning
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter & Sort Bar */}
      <div className={styles.bar}>
        <div className={styles.leftControls}>
          {/* Pricing Pills */}
          <div className={styles.pricingPills}>
            {PRICING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.pill} ${currentPricing === opt.value ? styles.active : ''}`}
                onClick={() => updateParam('pricing', opt.value)}
                suppressHydrationWarning
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Platform Filter Dropdown */}
          {availableFilters.platforms && availableFilters.platforms.length > 0 && (
            <select
              value={currentPlatform}
              onChange={(e) => updateParam('platform', e.target.value)}
              className={styles.filterSelect}
              aria-label="Filter by platform"
            >
              <option value="">All Platforms</option>
              {availableFilters.platforms.map((plat) => (
                <option key={plat} value={plat.toLowerCase()}>
                  {plat}
                </option>
              ))}
            </select>
          )}

          {/* Use Case Filter Dropdown */}
          {availableFilters.useCases && availableFilters.useCases.length > 0 && (
            <select
              value={currentUseCase}
              onChange={(e) => updateParam('useCase', e.target.value)}
              className={styles.filterSelect}
              aria-label="Filter by use case"
            >
              <option value="">All Use Cases</option>
              {availableFilters.useCases.slice(0, 15).map((uc) => (
                <option key={uc} value={uc.toLowerCase()}>
                  {uc}
                </option>
              ))}
            </select>
          )}

          {/* Tags Filter Dropdown */}
          {availableFilters.tags && availableFilters.tags.length > 0 && (
            <select
              value={currentTag}
              onChange={(e) => updateParam('tag', e.target.value)}
              className={styles.filterSelect}
              aria-label="Filter by tag"
            >
              <option value="">All Tags</option>
              {availableFilters.tags.slice(0, 20).map((t) => (
                <option key={t} value={t.toLowerCase()}>
                  #{t}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.rightControls}>
          <span className={styles.countBadge}>{totalCount} tool{totalCount === 1 ? '' : 's'}</span>
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className={styles.sortSelect}
            aria-label="Sort tools"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Chips & Reset */}
      {hasActiveFilters && (
        <div className={styles.activeFiltersRow}>
          <span className={styles.activeFiltersLabel}>
            <FiFilter /> Active filters:
          </span>
          <div className={styles.activeChips}>
            {currentSubCategory && (
              <span className={styles.filterChip}>
                Subcategory: {currentSubCategory}
                <button
                  type="button"
                  onClick={() => updateParam('subCategory', '')}
                  title="Remove subcategory filter"
                >
                  <FiX />
                </button>
              </span>
            )}
            {currentPricing && (
              <span className={styles.filterChip}>
                Pricing: {currentPricing}
                <button
                  type="button"
                  onClick={() => updateParam('pricing', '')}
                  title="Remove pricing filter"
                >
                  <FiX />
                </button>
              </span>
            )}
            {currentPlatform && (
              <span className={styles.filterChip}>
                Platform: {currentPlatform}
                <button
                  type="button"
                  onClick={() => updateParam('platform', '')}
                  title="Remove platform filter"
                >
                  <FiX />
                </button>
              </span>
            )}
            {currentUseCase && (
              <span className={styles.filterChip}>
                Use Case: {currentUseCase}
                <button
                  type="button"
                  onClick={() => updateParam('useCase', '')}
                  title="Remove use case filter"
                >
                  <FiX />
                </button>
              </span>
            )}
            {currentTag && (
              <span className={styles.filterChip}>
                Tag: #{currentTag}
                <button
                  type="button"
                  onClick={() => updateParam('tag', '')}
                  title="Remove tag filter"
                >
                  <FiX />
                </button>
              </span>
            )}
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={clearAllFilters}
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


