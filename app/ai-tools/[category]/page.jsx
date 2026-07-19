import { getCategories, getToolsByCategory } from '@/lib/data-fetchers';
import AIToolCard from '@/components/ai-tools/AIToolCard';
import CategoryFilter from '@/components/ai-tools/CategoryFilter';
import { notFound } from 'next/navigation';
import styles from '../page.module.scss'; // Reuse styles from main page

export async function generateMetadata({ params }) {
  const categories = await getCategories();
  const category = categories.find(c => c.slug === params.category);
  
  if (!category) return { title: 'Category Not Found' };
  
  return {
    title: `${category.name} AI Tools - Developer Productivity Platform`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }) {
  const categories = await getCategories();
  const category = categories.find(c => c.slug === params.category);
  
  if (!category) {
    notFound();
  }

  const tools = await getToolsByCategory(params.category);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{category.name} Tools</h1>
        <p className={styles.subtitle}>{category.description}</p>
      </header>

      <section className={styles.allToolsSection}>
        <CategoryFilter categories={categories} />

        {tools.length > 0 ? (
          <div className={styles.grid}>
            {tools.map(tool => (
              <AIToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No tools found</h3>
            <p>We are still adding tools to this category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
