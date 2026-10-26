'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FiChevronRight, FiGrid, FiLayers, FiX, FiChevronDown } from 'react-icons/fi';
import styles from './CategoryFilter.module.scss';

export default function CategoryFilter({ categories = [] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = pathname.startsWith('/ai-tools/') ? pathname.split('/').pop() : '';

  const [openCategories, setOpenCategories] = useState(
    activeCategory ? { [activeCategory]: true } : {}
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleBtnRef = useRef(null);
  const drawerRef = useRef(null);

  // Find active category name for mobile toggle label
  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);
  const activeCategoryLabel = activeCategoryObj ? activeCategoryObj.name : 'All Categories';

  const toggleCategory = (slug) => {
    setOpenCategories((current) => ({ ...current, [slug]: !current[slug] }));
  };

  const subcategoryHref = (slug) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.set('subCategory', slug);
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname, searchParams]);

  // Handle ESC key and click outside
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
        toggleBtnRef.current?.focus();
      }
    };

    const handleClickOutside = (event) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDrawerOpen]);

  // Lock body scroll on mobile when drawer is open
  useEffect(() => {
    if (isDrawerOpen && typeof window !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDrawerOpen]);

  const renderCategoryNav = () => (
    <>
      <div className={styles.railHeader}>
        <div>
          <span className={styles.eyebrow}>
            <FiLayers aria-hidden="true" /> Browse by focus
          </span>
          <h2>Tool library</h2>
        </div>
        <span className={styles.categoryCount}>{categories.length}</span>
      </div>

      <Link
        href="/ai-tools"
        className={`${styles.categoryBtn} ${pathname === '/ai-tools' ? styles.active : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <FiGrid aria-hidden="true" />
        <span>All tools</span>
      </Link>

      <div className={styles.categoryList}>
        {categories.map((category) => {
          const isActive = pathname === `/ai-tools/${category.slug}`;
          const isOpen = Boolean(openCategories[category.slug] || isActive);
          const subcategories = category.subcategories || [];

          return (
            <div key={category.id} className={styles.categoryGroup}>
              <div className={`${styles.categoryRow} ${isActive ? styles.active : ''}`}>
                <Link
                  href={`/ai-tools/${category.slug}`}
                  className={styles.categoryLink}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <span>{category.name}</span>
                </Link>
                {subcategories.length > 0 && (
                  <button
                    type="button"
                    className={`${styles.expandButton} ${isOpen ? styles.expanded : ''}`}
                    onClick={() => toggleCategory(category.slug)}
                    aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.name} subcategories`}
                    aria-expanded={isOpen}
                  >
                    <FiChevronRight aria-hidden="true" />
                  </button>
                )}
              </div>
              {isOpen && subcategories.length > 0 && (
                <div className={styles.subcategoryList}>
                  {subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.id || subcategory.slug}
                      href={subcategoryHref(subcategory.slug)}
                      className={`${styles.subcategoryLink} ${
                        searchParams.get('subCategory') === subcategory.slug
                          ? styles.activeSubcategory
                          : ''
                      }`}
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile/Tablet Toggle Button (< 1024px) */}
      <div className={styles.mobileCategoryBar}>
        <button
          ref={toggleBtnRef}
          type="button"
          className={`${styles.mobileToggleBtn} ${activeCategory ? styles.hasActiveCategory : ''}`}
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          aria-expanded={isDrawerOpen}
          aria-controls="category-drawer"
          aria-label={`Browse categories. Current: ${activeCategoryLabel}`}
        >
          <div className={styles.toggleBtnContent}>
            <FiLayers className={styles.toggleIcon} aria-hidden="true" />
            <span className={styles.toggleLabel}>
              <span className={styles.toggleLabelPrefix}>Category:</span>{' '}
              <strong>{activeCategoryLabel}</strong>
            </span>
          </div>
          <div className={styles.toggleBtnRight}>
            <span className={styles.toggleCountBadge}>{categories.length}</span>
            <FiChevronDown
              className={`${styles.toggleChevron} ${isDrawerOpen ? styles.chevronRotated : ''}`}
              aria-hidden="true"
            />
          </div>
        </button>
      </div>

      {/* Desktop Sticky Rail (>= 1024px) */}
      <aside className={styles.categoryFilter} aria-label="AI tools taxonomy">
        {renderCategoryNav()}
      </aside>

      {/* Mobile/Tablet Drawer & Backdrop (< 1024px) */}
      {isDrawerOpen && (
        <>
          <div
            className={styles.drawerBackdrop}
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="category-drawer"
            ref={drawerRef}
            className={styles.categoryDrawer}
            role="dialog"
            aria-modal="true"
            aria-label="AI tool categories navigation"
          >
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <FiLayers aria-hidden="true" />
                <h3>Categories ({categories.length})</h3>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close categories drawer"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
            <div className={styles.drawerContent}>{renderCategoryNav()}</div>
          </aside>
        </>
      )}
    </>
  );
}
