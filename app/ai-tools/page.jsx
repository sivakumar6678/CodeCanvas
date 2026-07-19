import { getAllTools, getCategories, getFeaturedTools } from '@/lib/data-fetchers';
import AIToolCard from '@/components/ai-tools/AIToolCard';
import CategoryFilter from '@/components/ai-tools/CategoryFilter';
import SearchBar from '@/components/ai-tools/SearchBar';
import styles from './page.module.scss';

export const metadata = {
  title: 'AI Tools Directory - Developer Productivity Platform',
  description: 'Discover the best curated AI tools for developers, designers, and creators.',
};

export default async function AIToolsPage({ searchParams }) {
  const allTools = await getAllTools();
  const categories = await getCategories();
  const featuredTools = await getFeaturedTools();
  
  const query = searchParams?.q?.toLowerCase();
  
  const displayTools = query 
    ? allTools.filter(tool => 
        tool.name.toLowerCase().includes(query) || 
        tool.description.toLowerCase().includes(query) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    : allTools;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Tools Directory</h1>
        <p className={styles.subtitle}>Curated collection of the best AI tools to supercharge your productivity.</p>
        <div className={styles.searchWrapper}>
          <SearchBar />
        </div>
      </header>

      {!query && featuredTools.length > 0 && (
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Featured Tools</h2>
          <div className={styles.grid}>
            {featuredTools.map(tool => (
              <AIToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      <section className={styles.allToolsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {query ? `Search results for "${query}"` : 'All Tools'}
          </h2>
        </div>
        
        {!query && <CategoryFilter categories={categories} />}

        {displayTools.length > 0 ? (
          <div className={styles.grid}>
            {displayTools.map(tool => (
              <AIToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No tools found</h3>
            <p>Try adjusting your search query.</p>
          </div>
        )}
      </section>
    </div>
  );
}
