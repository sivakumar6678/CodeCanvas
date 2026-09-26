'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp } from 'react-icons/fi';
import { CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE_OPTIONS, getPaginationRange } from '../../lib/catalog-filtering';
import styles from './CatalogPagination.module.scss';

export default function CatalogPagination({ currentPage = 1, totalPages = 1, totalItems = 0, rangeStart = 0, rangeEnd = 0, pageSize = CATALOG_PAGE_SIZE, variant = 'bottom' }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalItems === 0 || (variant === 'side' && totalPages <= 1)) return null;

  const createPageHref = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const createPageSizeHref = (nextPageSize) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (nextPageSize === CATALOG_PAGE_SIZE) {
      params.delete('pageSize');
    } else {
      params.set('pageSize', String(nextPageSize));
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const pageControls = (
    <div className={styles.controls}>
      <Link
        href={createPageHref(Math.max(1, currentPage - 1))}
        className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
        aria-label="Previous page"
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : 0}
      >
        {variant === 'side' ? <FiChevronUp aria-hidden="true" /> : <FiChevronLeft aria-hidden="true" />}
      </Link>
      {getPaginationRange(totalPages, currentPage).map((page, index) => (
        page === '...'
          ? <span key={`ellipsis-${index}`} className={styles.ellipsis} aria-hidden="true">...</span>
          : (
            <Link
              key={page}
              href={createPageHref(page)}
              className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Link>
          )
      ))}
      <Link
        href={createPageHref(Math.min(totalPages, currentPage + 1))}
        className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
        aria-label="Next page"
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : 0}
      >
        {variant === 'side' ? <FiChevronDown aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}
      </Link>
    </div>
  );

  if (variant === 'side') {
    return (
      <nav className={styles.sidePagination} aria-label="AI tools page navigator">
        {pageControls}
      </nav>
    );
  }

  return (
    <nav className={styles.pagination} aria-label="AI tools pagination">
      <div className={styles.meta}>
        <span className={styles.range}>Showing {rangeStart}-{rangeEnd} of {totalItems} tools</span>
        <label className={styles.pageSizeLabel}>
          <span>Tools per page</span>
          <select
            value={CATALOG_PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : CATALOG_PAGE_SIZE}
            onChange={(event) => router.push(createPageSizeHref(Number(event.target.value)), { scroll: false })}
            aria-label="Tools per page"
          >
            {CATALOG_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      {pageControls}
    </nav>
  );
}