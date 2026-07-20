import AIToolCard from './AIToolCard';
import styles from './RelatedTools.module.scss';

export default function RelatedTools({ tools }) {
  if (!tools || tools.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Similar Tools</h2>
        <p className={styles.subtitle}>Explore other tools in this category</p>
      </div>

      <div className={styles.grid}>
        {tools.map(tool => (
          <AIToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
