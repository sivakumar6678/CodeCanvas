import { getAllTools } from '../../../lib/data-fetchers';
import ToolComparisonMatrix from '../../../components/ai-tools/ToolComparisonMatrix';
import styles from './page.module.scss';

export const metadata = {
  title: 'Compare AI Tools Side-by-Side',
  description: 'Compare AI developer tools side-by-side on pricing, features, platforms, and community ratings.',
};

export default async function ComparePage({ searchParams }) {
  const allTools = await getAllTools();
  
  const queryTools = searchParams?.tools;
  const initialSlugs = queryTools ? queryTools.split(',') : ['cursor', 'github-copilot'];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Compare AI Tools</h1>
        <p className={styles.subtitle}>
          Compare features, pricing, platforms, and pros & cons side-by-side to choose the best tool for your workflow.
        </p>
      </header>

      <ToolComparisonMatrix allTools={allTools} initialSlugs={initialSlugs} />
    </div>
  );
}
