import { getAllTools, getCategories, getFeaturedTools } from '../../lib/data-fetchers';
import { CATALOG_PAGE_SIZE_OPTIONS, filterTools, getAvailableFilterOptions, paginateTools } from '../../lib/catalog-filtering';
import AIToolCard from '../../components/ai-tools/AIToolCard';
import CategoryFilter from '../../components/ai-tools/CategoryFilter';
import CatalogPagination from '../../components/ai-tools/CatalogPagination';
import SearchBar from '../../components/ai-tools/SearchBar';
import ToolFilterBar from '../../components/ai-tools/ToolFilterBar';
import styles from './page.module.scss';

export const metadata = {
  title: 'AI Tools Directory - Developer Productivity Platform',
  description: 'Discover the best curated AI tools for developers, designers, and creators.',
};

export default async function AIToolsPage({ searchParams }) {
  const allTools = await getAllTools();
  const categories = await getCategories();
  const featuredTools = await getFeaturedTools();
  
  const searchParamsObj = await searchParams;
  const query = searchParamsObj?.q?.toLowerCase()?.trim() || '';
  const subCategory = searchParamsObj?.subCategory?.toLowerCase()?.trim() || '';
  const pricing = searchParamsObj?.pricing?.toLowerCase()?.trim() || '';
  const platform = searchParamsObj?.platform?.toLowerCase()?.trim() || '';
  const useCase = searchParamsObj?.useCase?.toLowerCase()?.trim() || '';
  const tag = searchParamsObj?.tag?.toLowerCase()?.trim() || '';
  const sort = searchParamsObj?.sort?.toLowerCase()?.trim() || 'featured';
  const page = Number.parseInt(searchParamsObj?.page, 10) || 1;
  const requestedPageSize = Number.parseInt(searchParamsObj?.pageSize, 10);
  const pageSize = CATALOG_PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : undefined;
  
  const availableFilters = getAvailableFilterOptions(allTools);

  const displayTools = filterTools(allTools, {
    query,
    subCategory,
    pricing,
    platform,
    useCase,
    tag,
    sort,
  });
  const pagination = paginateTools(displayTools, page, pageSize);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Tools Directory</h1>
        <p className={styles.subtitle}>Curated collection of the best AI tools to supercharge your productivity.</p>
        <div className={styles.toolkitCallout}>
          <div>
            <strong>Based on your work</strong>
            <span>Build a focused toolkit for your next project.</span>
          </div>
          <a href="/build-toolkit">Build your toolkit <span aria-hidden="true">-&gt;</span></a>
        </div>
        <div className={styles.searchWrapper}>
          <SearchBar />
        </div>
      </header>

      {!query && featuredTools.length > 0 && !subCategory && !pricing && !platform && !useCase && !tag && (
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Featured Tools</h2>
          <div className={styles.grid}>
            {featuredTools.map(tool => (
              <AIToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      <section className={`${styles.catalogLayout} ${pagination.totalPages > 1 ? styles.catalogLayoutWithPagination : ''}`}>
        <CategoryFilter categories={categories} />
        <div className={styles.allToolsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {query ? `Search results for "${query}"` : 'All Tools'}
            </h2>
          </div>

          <ToolFilterBar
            totalCount={displayTools.length}
            categories={categories}
            availableFilters={availableFilters}
          />

          {displayTools.length > 0 ? (
            <>
              <div className={styles.grid}>
                {pagination.items.map(tool => (
                  <AIToolCard key={tool.id} tool={tool} />
                ))}
              </div>
              <CatalogPagination {...pagination} />
            </>
          ) : (
            <div className={styles.emptyState}>
              <h3>No tools found</h3>
              <p>Try adjusting your search query or filter options.</p>
            </div>
          )}
        </div>
        {displayTools.length > 0 && pagination.totalPages > 1 && (
          <CatalogPagination {...pagination} variant="side" />
        )}
      </section>
    </div>
  );
}

