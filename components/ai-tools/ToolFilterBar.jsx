'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FiX,
  FiFilter,
  FiSliders,
  FiZap,
  FiRotateCcw,
  FiCheck,
  FiChevronDown,
  FiLayers,
  FiTag,
  FiMonitor,
  FiTarget,
  FiDollarSign,
  FiArrowRight,
  FiGrid,
} from 'react-icons/fi';
import styles from './ToolFilterBar.module.scss';

const PRICING_OPTIONS = [
  { label: 'All', value: '' },
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

  // Mobile drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const panelRef = useRef(null);

  // Desktop popover dropdown states ('platform' | 'useCase' | 'tag' | null)
  const [activePopover, setActivePopover] = useState(null);
  const popoverRef = useRef(null);

  // Active URL parameters
  const currentPricing = searchParams.get('pricing') || '';
  const currentSubCategory = searchParams.get('subCategory') || '';
  const currentPlatform = searchParams.get('platform') || '';
  const currentUseCase = searchParams.get('useCase') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentSort = searchParams.get('sort') || 'featured';

  // Determine active category
  const resolvedCategorySlug = useMemo(() => {
    if (currentCategory) return currentCategory;
    if (pathname.startsWith('/ai-tools/')) {
      const slug = pathname.split('/').pop();
      if (categories.some((c) => c.slug === slug)) return slug;
    }
    return '';
  }, [currentCategory, pathname, categories]);

  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.slug === resolvedCategorySlug);
  }, [categories, resolvedCategorySlug]);

  // Desktop subcategory list
  const desktopSubcategories = useMemo(() => {
    if (activeCategoryObj?.subcategories?.length > 0) {
      return activeCategoryObj.subcategories;
    }
    return (availableFilters.subCategories || []).map((slug) => {
      const allSubs = categories.flatMap((c) => c.subcategories || []);
      const match = allSubs.find((s) => s.slug === slug);
      return (
        match || {
          slug,
          name: slug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        }
      );
    });
  }, [activeCategoryObj, categories, availableFilters.subCategories]);

  // Draft filter states for mobile drawer
  const [draftCategory, setDraftCategory] = useState(resolvedCategorySlug);
  const [draftSubCategory, setDraftSubCategory] = useState(currentSubCategory);
  const [draftPricing, setDraftPricing] = useState(currentPricing);
  const [draftPlatform, setDraftPlatform] = useState(currentPlatform);
  const [draftUseCase, setDraftUseCase] = useState(currentUseCase);
  const [draftTag, setDraftTag] = useState(currentTag);
  const [draftSort, setDraftSort] = useState(currentSort);

  // Sync draft states when drawer opens
  useEffect(() => {
    setDraftCategory(resolvedCategorySlug);
    setDraftSubCategory(currentSubCategory);
    setDraftPricing(currentPricing);
    setDraftPlatform(currentPlatform);
    setDraftUseCase(currentUseCase);
    setDraftTag(currentTag);
    setDraftSort(currentSort);
  }, [
    isDrawerOpen,
    resolvedCategorySlug,
    currentSubCategory,
    currentPricing,
    currentPlatform,
    currentUseCase,
    currentTag,
    currentSort,
  ]);

  // Dynamic subcategories cascading in drawer
  const dynamicSubcategories = useMemo(() => {
    if (draftCategory) {
      const cat = categories.find((c) => c.slug === draftCategory);
      return cat?.subcategories || [];
    }
    const allSubs = categories.flatMap((c) => c.subcategories || []);
    if (allSubs.length > 0) {
      const seen = new Set();
      return allSubs.filter((s) => {
        if (!s.slug || seen.has(s.slug)) return false;
        seen.add(s.slug);
        return true;
      });
    }
    return (availableFilters.subCategories || []).map((slug) => ({
      slug,
      name: slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    }));
  }, [draftCategory, categories, availableFilters.subCategories]);

  const handleCategorySelect = (categorySlug) => {
    setDraftCategory(categorySlug);
    if (categorySlug) {
      const newCat = categories.find((c) => c.slug === categorySlug);
      const hasSub = (newCat?.subcategories || []).some((s) => s.slug === draftSubCategory);
      if (!hasSub) {
        setDraftSubCategory('');
      }
    }
  };

  // Direct parameter updater for desktop deck
  const updateParam = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key !== 'page') {
        params.delete('page');
      }
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
      setActivePopover(null);
    },
    [searchParams, pathname, router]
  );

  // Apply mobile drawer filters
  const applyMobileFilters = () => {
    const targetPath = draftCategory ? `/ai-tools/${draftCategory}` : '/ai-tools';
    const params = new URLSearchParams();

    const currentQ = searchParams.get('q');
    if (currentQ) {
      params.set('q', currentQ);
    }

    if (draftSubCategory) params.set('subCategory', draftSubCategory);
    if (draftPricing) params.set('pricing', draftPricing);
    if (draftPlatform) params.set('platform', draftPlatform);
    if (draftUseCase) params.set('useCase', draftUseCase);
    if (draftTag) params.set('tag', draftTag);
    if (draftSort && draftSort !== 'featured') params.set('sort', draftSort);

    const queryString = params.toString();
    router.push(queryString ? `${targetPath}?${queryString}` : targetPath, { scroll: false });
    setIsDrawerOpen(false);
  };

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    setDraftCategory('');
    setDraftSubCategory('');
    setDraftPricing('');
    setDraftPlatform('');
    setDraftUseCase('');
    setDraftTag('');
    setDraftSort('featured');

    const params = new URLSearchParams();
    const currentQ = searchParams.get('q');
    if (currentQ) {
      params.set('q', currentQ);
    }

    const queryString = params.toString();
    router.push(queryString ? `/ai-tools?${queryString}` : '/ai-tools', { scroll: false });
    setIsDrawerOpen(false);
    setActivePopover(null);
  }, [searchParams, router]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [
      resolvedCategorySlug ? `cat:${resolvedCategorySlug}` : '',
      currentSubCategory,
      currentPricing,
      currentPlatform,
      currentUseCase,
      currentTag,
      currentSort && currentSort !== 'featured' ? currentSort : '',
    ].filter(Boolean).length;
  }, [
    resolvedCategorySlug,
    currentSubCategory,
    currentPricing,
    currentPlatform,
    currentUseCase,
    currentTag,
    currentSort,
  ]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Handle outside click & ESC key for popovers and drawer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setActivePopover(null);
      }
      if (
        isDrawerOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(event.target)
      ) {
        setIsDrawerOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActivePopover(null);
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  // Lock body scroll on mobile drawer
  useEffect(() => {
    if (isDrawerOpen && typeof window !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDrawerOpen]);

  return (
    <div className={styles.filterDeck}>
      {/* 1. Precision Control Deck (Desktop & Tablet Toolbar) */}
      <div className={styles.deckHeader}>
        <div className={styles.deckGroupLeft}>
          {/* Mobile Filter Trigger Button (< 1024px) */}
          <button
            ref={filterBtnRef}
            type="button"
            className={`${styles.mobileFilterBtn} ${activeFiltersCount > 0 ? styles.hasFilters : ''}`}
            onClick={() => setIsDrawerOpen(true)}
            aria-label={`Open filters drawer (${activeFiltersCount} active)`}
          >
            <FiSliders aria-hidden="true" />
            <span>Filters</span>
            {activeFiltersCount > 0 && <span className={styles.badge}>{activeFiltersCount}</span>}
          </button>

          {/* Segmented Pricing Pills */}
          <div className={styles.pricingSegment} role="group" aria-label="Pricing filter">
            {PRICING_OPTIONS.map((opt) => (
              <button
                key={opt.value || 'all'}
                type="button"
                className={`${styles.pricingSegmentBtn} ${
                  currentPricing === opt.value ? styles.pricingSegmentActive : ''
                }`}
                onClick={() => updateParam('pricing', opt.value)}
                suppressHydrationWarning
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Desktop Interactive Facet Chips (Platform, Use Case, Tag) */}
          <div className={styles.desktopFacets}>
            {/* Platform Facet Popover */}
            {availableFilters.platforms && availableFilters.platforms.length > 0 && (
              <div className={styles.facetDropdown} ref={activePopover === 'platform' ? popoverRef : null}>
                <button
                  type="button"
                  className={`${styles.facetChip} ${currentPlatform ? styles.facetChipActive : ''}`}
                  onClick={() => setActivePopover(activePopover === 'platform' ? null : 'platform')}
                  aria-expanded={activePopover === 'platform'}
                >
                  <FiMonitor aria-hidden="true" />
                  <span>{currentPlatform ? `Platform: ${currentPlatform}` : 'Platform'}</span>
                  {currentPlatform ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.chipDismiss}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateParam('platform', '');
                      }}
                      title="Clear platform filter"
                    >
                      <FiX aria-hidden="true" />
                    </span>
                  ) : (
                    <FiChevronDown aria-hidden="true" />
                  )}
                </button>
                {activePopover === 'platform' && (
                  <div className={styles.popoverMenu}>
                    <div className={styles.popoverHeader}>Select Platform</div>
                    <button
                      type="button"
                      className={`${styles.popoverItem} ${!currentPlatform ? styles.popoverItemActive : ''}`}
                      onClick={() => updateParam('platform', '')}
                    >
                      <span>All Platforms</span>
                      {!currentPlatform && <FiCheck aria-hidden="true" />}
                    </button>
                    {availableFilters.platforms.map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        className={`${styles.popoverItem} ${
                          currentPlatform === plat.toLowerCase() ? styles.popoverItemActive : ''
                        }`}
                        onClick={() => updateParam('platform', plat.toLowerCase())}
                      >
                        <span>{plat}</span>
                        {currentPlatform === plat.toLowerCase() && <FiCheck aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Use Case Facet Popover */}
            {availableFilters.useCases && availableFilters.useCases.length > 0 && (
              <div className={styles.facetDropdown} ref={activePopover === 'useCase' ? popoverRef : null}>
                <button
                  type="button"
                  className={`${styles.facetChip} ${currentUseCase ? styles.facetChipActive : ''}`}
                  onClick={() => setActivePopover(activePopover === 'useCase' ? null : 'useCase')}
                  aria-expanded={activePopover === 'useCase'}
                >
                  <FiTarget aria-hidden="true" />
                  <span>{currentUseCase ? `Use Case: ${currentUseCase}` : 'Use Case'}</span>
                  {currentUseCase ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.chipDismiss}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateParam('useCase', '');
                      }}
                      title="Clear use case filter"
                    >
                      <FiX aria-hidden="true" />
                    </span>
                  ) : (
                    <FiChevronDown aria-hidden="true" />
                  )}
                </button>
                {activePopover === 'useCase' && (
                  <div className={styles.popoverMenu}>
                    <div className={styles.popoverHeader}>Select Use Case</div>
                    <button
                      type="button"
                      className={`${styles.popoverItem} ${!currentUseCase ? styles.popoverItemActive : ''}`}
                      onClick={() => updateParam('useCase', '')}
                    >
                      <span>All Use Cases</span>
                      {!currentUseCase && <FiCheck aria-hidden="true" />}
                    </button>
                    {availableFilters.useCases.slice(0, 18).map((uc) => (
                      <button
                        key={uc}
                        type="button"
                        className={`${styles.popoverItem} ${
                          currentUseCase === uc.toLowerCase() ? styles.popoverItemActive : ''
                        }`}
                        onClick={() => updateParam('useCase', uc.toLowerCase())}
                      >
                        <span>{uc}</span>
                        {currentUseCase === uc.toLowerCase() && <FiCheck aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tag Facet Popover */}
            {availableFilters.tags && availableFilters.tags.length > 0 && (
              <div className={styles.facetDropdown} ref={activePopover === 'tag' ? popoverRef : null}>
                <button
                  type="button"
                  className={`${styles.facetChip} ${currentTag ? styles.facetChipActive : ''}`}
                  onClick={() => setActivePopover(activePopover === 'tag' ? null : 'tag')}
                  aria-expanded={activePopover === 'tag'}
                >
                  <FiTag aria-hidden="true" />
                  <span>{currentTag ? `Tag: #${currentTag}` : 'Tags'}</span>
                  {currentTag ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.chipDismiss}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateParam('tag', '');
                      }}
                      title="Clear tag filter"
                    >
                      <FiX aria-hidden="true" />
                    </span>
                  ) : (
                    <FiChevronDown aria-hidden="true" />
                  )}
                </button>
                {activePopover === 'tag' && (
                  <div className={styles.popoverMenu}>
                    <div className={styles.popoverHeader}>Select Tag</div>
                    <button
                      type="button"
                      className={`${styles.popoverItem} ${!currentTag ? styles.popoverItemActive : ''}`}
                      onClick={() => updateParam('tag', '')}
                    >
                      <span>All Tags</span>
                      {!currentTag && <FiCheck aria-hidden="true" />}
                    </button>
                    {availableFilters.tags.slice(0, 20).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`${styles.popoverItem} ${
                          currentTag === t.toLowerCase() ? styles.popoverItemActive : ''
                        }`}
                        onClick={() => updateParam('tag', t.toLowerCase())}
                      >
                        <span>#{t}</span>
                        {currentTag === t.toLowerCase() && <FiCheck aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.deckGroupRight}>
          <Link href="/build-toolkit" className={styles.toolkitBtn} title="Build your customized AI stack">
            <FiZap aria-hidden="true" />
            <span>Build Toolkit</span>
          </Link>

          <span className={styles.countBadge}>
            {totalCount} {totalCount === 1 ? 'tool' : 'tools'}
          </span>

          <div className={styles.sortWrapper}>
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
      </div>

      {/* 2. Low-Profile Subcategory Ribbon (Desktop) */}
      {desktopSubcategories.length > 0 && (
        <div className={styles.subCategoryRibbon} aria-label="Subcategories filter ribbon">
          <span className={styles.ribbonLabel}>
            <FiLayers aria-hidden="true" /> Subcategory:
          </span>
          <div className={styles.ribbonPills}>
            <button
              type="button"
              className={`${styles.ribbonPill} ${!currentSubCategory ? styles.ribbonPillActive : ''}`}
              onClick={() => updateParam('subCategory', '')}
              suppressHydrationWarning
            >
              All {activeCategoryObj?.name || 'Subcategories'}
            </button>
            {desktopSubcategories.map((sub) => (
              <button
                key={sub.slug}
                type="button"
                className={`${styles.ribbonPill} ${
                  currentSubCategory === sub.slug ? styles.ribbonPillActive : ''
                }`}
                onClick={() =>
                  updateParam('subCategory', currentSubCategory === sub.slug ? '' : sub.slug)
                }
                suppressHydrationWarning
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Active Filters Chips Deck */}
      {hasActiveFilters && (
        <div className={styles.activeDeck}>
          <div className={styles.activeLabel}>
            <FiFilter aria-hidden="true" />
            <span>Active:</span>
          </div>
          <div className={styles.activeChipsList}>
            {resolvedCategorySlug && (
              <span className={styles.activeChip}>
                <span className={styles.chipKey}>Category:</span>
                <span className={styles.chipVal}>{activeCategoryObj?.name || resolvedCategorySlug}</span>
                <Link
                  href={searchParams.toString() ? `/ai-tools?${searchParams.toString()}` : '/ai-tools'}
                  aria-label="Remove category filter"
                  title="Remove category filter"
                >
                  <FiX aria-hidden="true" />
                </Link>
              </span>
            )}
            {currentSubCategory && (
              <span className={styles.activeChip}>
                <span className={styles.chipKey}>Subcategory:</span>
                <span className={styles.chipVal}>{currentSubCategory}</span>
                <button
                  type="button"
                  onClick={() => updateParam('subCategory', '')}
                  aria-label="Remove subcategory filter"
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            )}
            {currentPricing && (
              <span className={styles.activeChip}>
                <span className={styles.chipKey}>Pricing:</span>
                <span className={styles.chipVal}>{currentPricing}</span>
                <button
                  type="button"
                  onClick={() => updateParam('pricing', '')}
                  aria-label="Remove pricing filter"
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            )}
            {currentPlatform && (
              <span className={styles.activeChip}>
                <span className={styles.chipKey}>Platform:</span>
                <span className={styles.chipVal}>{currentPlatform}</span>
                <button
                  type="button"
                  onClick={() => updateParam('platform', '')}
                  aria-label="Remove platform filter"
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            )}
            {currentUseCase && (
              <span className={styles.activeChip}>
                <span className={styles.chipKey}>Use Case:</span>
                <span className={styles.chipVal}>{currentUseCase}</span>
                <button
                  type="button"
                  onClick={() => updateParam('useCase', '')}
                  aria-label="Remove use case filter"
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            )}
            {currentTag && (
              <span className={styles.activeChip}>
                <span className={styles.chipKey}>Tag:</span>
                <span className={styles.chipVal}>#{currentTag}</span>
                <button
                  type="button"
                  onClick={() => updateParam('tag', '')}
                  aria-label="Remove tag filter"
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            )}
            <button
              type="button"
              className={styles.clearAllLink}
              onClick={resetAllFilters}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* 4. High-Efficiency Mobile Filter Drawer (< 1024px) */}
      {isDrawerOpen && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          <div
            id="tool-filters-drawer"
            ref={panelRef}
            className={styles.drawer}
            role="dialog"
            aria-label="Filter AI tools"
            aria-modal="true"
          >
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <FiFilter aria-hidden="true" />
                <h3>Filter AI Tools</h3>
                {activeFiltersCount > 0 && (
                  <span className={styles.drawerBadge}>{activeFiltersCount} active</span>
                )}
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close filters drawer"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Build Toolkit Banner */}
              <div className={styles.drawerToolkitBanner}>
                <div>
                  <strong>Build Your Toolkit</strong>
                  <p>Get a deterministic AI stack matched to your workflow.</p>
                </div>
                <Link
                  href="/build-toolkit"
                  className={styles.drawerToolkitLink}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <span>Build kit</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>

              {/* Category Selection */}
              <div className={styles.drawerSection}>
                <label className={styles.drawerSectionLabel}>
                  <FiGrid aria-hidden="true" /> Category
                </label>
                <div className={styles.drawerChips}>
                  <button
                    type="button"
                    className={`${styles.drawerChip} ${!draftCategory ? styles.drawerChipActive : ''}`}
                    onClick={() => handleCategorySelect('')}
                  >
                    {!draftCategory && <FiCheck aria-hidden="true" />}
                    <span>All Categories</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      className={`${styles.drawerChip} ${
                        draftCategory === cat.slug ? styles.drawerChipActive : ''
                      }`}
                      onClick={() => handleCategorySelect(cat.slug)}
                    >
                      {draftCategory === cat.slug && <FiCheck aria-hidden="true" />}
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories Selection */}
              {dynamicSubcategories.length > 0 && (
                <div className={styles.drawerSection}>
                  <label className={styles.drawerSectionLabel}>
                    <FiLayers aria-hidden="true" /> Subcategory
                  </label>
                  <div className={styles.drawerChips}>
                    <button
                      type="button"
                      className={`${styles.drawerChip} ${!draftSubCategory ? styles.drawerChipActive : ''}`}
                      onClick={() => setDraftSubCategory('')}
                    >
                      {!draftSubCategory && <FiCheck aria-hidden="true" />}
                      <span>All Subcategories</span>
                    </button>
                    {dynamicSubcategories.map((sub) => (
                      <button
                        key={sub.slug}
                        type="button"
                        className={`${styles.drawerChip} ${
                          draftSubCategory === sub.slug ? styles.drawerChipActive : ''
                        }`}
                        onClick={() =>
                          setDraftSubCategory(draftSubCategory === sub.slug ? '' : sub.slug)
                        }
                      >
                        {draftSubCategory === sub.slug && <FiCheck aria-hidden="true" />}
                        <span>{sub.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Selection */}
              <div className={styles.drawerSection}>
                <label className={styles.drawerSectionLabel}>
                  <FiDollarSign aria-hidden="true" /> Pricing Model
                </label>
                <div className={styles.drawerChips}>
                  {PRICING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value || 'all'}
                      type="button"
                      className={`${styles.drawerChip} ${
                        draftPricing === opt.value ? styles.drawerChipActive : ''
                      }`}
                      onClick={() => setDraftPricing(opt.value)}
                    >
                      {draftPricing === opt.value && <FiCheck aria-hidden="true" />}
                      <span>{opt.label === 'All' ? 'All Pricing' : opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Selection */}
              {availableFilters.platforms && availableFilters.platforms.length > 0 && (
                <div className={styles.drawerSection}>
                  <label className={styles.drawerSectionLabel} htmlFor="mobile-platform-select">
                    <FiMonitor aria-hidden="true" /> Platform
                  </label>
                  <select
                    id="mobile-platform-select"
                    value={draftPlatform}
                    onChange={(e) => setDraftPlatform(e.target.value)}
                    className={styles.drawerSelect}
                  >
                    <option value="">All Platforms</option>
                    {availableFilters.platforms.map((plat) => (
                      <option key={plat} value={plat.toLowerCase()}>
                        {plat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Use Case Selection */}
              {availableFilters.useCases && availableFilters.useCases.length > 0 && (
                <div className={styles.drawerSection}>
                  <label className={styles.drawerSectionLabel} htmlFor="mobile-usecase-select">
                    <FiTarget aria-hidden="true" /> Use Case
                  </label>
                  <select
                    id="mobile-usecase-select"
                    value={draftUseCase}
                    onChange={(e) => setDraftUseCase(e.target.value)}
                    className={styles.drawerSelect}
                  >
                    <option value="">All Use Cases</option>
                    {availableFilters.useCases.slice(0, 30).map((uc) => (
                      <option key={uc} value={uc.toLowerCase()}>
                        {uc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags Selection */}
              {availableFilters.tags && availableFilters.tags.length > 0 && (
                <div className={styles.drawerSection}>
                  <label className={styles.drawerSectionLabel} htmlFor="mobile-tag-select">
                    <FiTag aria-hidden="true" /> Tags
                  </label>
                  <select
                    id="mobile-tag-select"
                    value={draftTag}
                    onChange={(e) => setDraftTag(e.target.value)}
                    className={styles.drawerSelect}
                  >
                    <option value="">All Tags</option>
                    {availableFilters.tags.slice(0, 35).map((t) => (
                      <option key={t} value={t.toLowerCase()}>
                        #{t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort Order */}
              <div className={styles.drawerSection}>
                <label className={styles.drawerSectionLabel}>
                  <FiSliders aria-hidden="true" /> Sort Order
                </label>
                <div className={styles.drawerChips}>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.drawerChip} ${
                        draftSort === opt.value ? styles.drawerChipActive : ''
                      }`}
                      onClick={() => setDraftSort(opt.value)}
                    >
                      {draftSort === opt.value && <FiCheck aria-hidden="true" />}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.drawerResetBtn}
                onClick={resetAllFilters}
                disabled={!hasActiveFilters && !draftCategory && !draftSubCategory}
              >
                <FiRotateCcw aria-hidden="true" />
                <span>Reset All</span>
              </button>

              <button
                type="button"
                className={styles.drawerApplyBtn}
                onClick={applyMobileFilters}
              >
                <span>Show {totalCount} {totalCount === 1 ? 'tool' : 'tools'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
