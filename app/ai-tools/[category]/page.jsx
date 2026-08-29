import { getCategories, getToolsByCategory } from '../../../lib/data-fetchers';
import { filterTools, getAvailableFilterOptions } from '../../../lib/catalog-filtering';
import AIToolCard from '../../../components/ai-tools/AIToolCard';
import CategoryFilter from '../../../components/ai-tools/CategoryFilter';
import ToolFilterBar from '../../../components/ai-tools/ToolFilterBar';
import { notFound } from 'next/navigation';
import styles from '../page.module.scss';

export async function generateMetadata({ params }) {
  const { category: categorySlug } = await params;
  const categories = await getCategories();
  const category = categories.find(c => c.slug === categorySlug);
  
  if (!category) return { title: 'Category Not Found' };
  
  return {
    title: `${category.name} AI Tools - Developer Productivity Platform`,
    description: category.description,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { category: categorySlug } = await params;
  const categories = await getCategories();
  const category = categories.find(c => c.slug === categorySlug);
  
  if (!category) {
    notFound();
  }

  const tools = await getToolsByCategory(categorySlug);
  const searchParamsObj = await searchParams;
  const query = searchParamsObj?.q?.toLowerCase()?.trim() || '';
  const subCategory = searchParamsObj?.subCategory?.toLowerCase()?.trim() || '';
  const pricing = searchParamsObj?.pricing?.toLowerCase()?.trim() || '';
  const platform = searchParamsObj?.platform?.toLowerCase()?.trim() || '';
  const useCase = searchParamsObj?.useCase?.toLowerCase()?.trim() || '';
  const tag = searchParamsObj?.tag?.toLowerCase()?.trim() || '';
  const sort = searchParamsObj?.sort?.toLowerCase()?.trim() || 'featured';

  const availableFilters = getAvailableFilterOptions(tools, categorySlug);

  const displayTools = filterTools(tools, {
    query,
    subCategory,
    pricing,
    platform,
    useCase,
    tag,
    sort,
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{category.name} Tools</h1>
        <p className={styles.subtitle}>{category.description}</p>
      </header>

      <section className={styles.allToolsSection}>
        <CategoryFilter categories={categories} />

        <ToolFilterBar
          totalCount={displayTools.length}
          currentCategory={categorySlug}
          categories={categories}
          availableFilters={availableFilters}
        />

        {displayTools.length > 0 ? (
          <div className={styles.grid}>
            {displayTools.map(tool => (
              <AIToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No tools found</h3>
            <p>
              {pricing || subCategory || platform || useCase || tag
                ? 'No tools match the selected filter combination in this category.'
                : 'We are still adding tools to this category.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}


