'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { FiChevronRight, FiGrid, FiLayers } from 'react-icons/fi';
import styles from './CategoryFilter.module.scss';

export default function CategoryFilter({ categories = [] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = pathname.startsWith('/ai-tools/') ? pathname.split('/').pop() : '';
  const [openCategories, setOpenCategories] = useState(activeCategory ? { [activeCategory]: true } : {});

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

  return (
    <aside className={styles.categoryFilter} aria-label="AI tools taxonomy">
      <div className={styles.railHeader}>
        <div>
          <span className={styles.eyebrow}><FiLayers aria-hidden="true" /> Browse by focus</span>
          <h2>Tool library</h2>
        </div>
        <span className={styles.categoryCount}>{categories.length}</span>
      </div>

      <Link
        href="/ai-tools"
        className={`${styles.categoryBtn} ${pathname === '/ai-tools' ? styles.active : ''}`}
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
                <Link href={`/ai-tools/${category.slug}`} className={styles.categoryLink}>
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
                      className={`${styles.subcategoryLink} ${searchParams.get('subCategory') === subcategory.slug ? styles.activeSubcategory : ''}`}
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
    </aside>
  );
}
