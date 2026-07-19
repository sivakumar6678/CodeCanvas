import { getToolBySlug } from '@/lib/data-fetchers';
import { notFound } from 'next/navigation';
import { FiExternalLink, FiCheckCircle, FiTag, FiMonitor, FiDollarSign } from 'react-icons/fi';
import styles from './page.module.scss';

export async function generateMetadata({ params }) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) return { title: 'Tool Not Found' };
  return {
    title: `${tool.name} - AI Tools`,
    description: tool.description,
  };
}

export default async function ToolDetailPage({ params }) {
  const tool = await getToolBySlug(params.slug);
  
  if (!tool) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <div className={styles.backLink}>
        <a href="/ai-tools">← Back to Directory</a>
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            {tool.logo ? (
              <img src={tool.logo} alt={`${tool.name} logo`} className={styles.logo} />
            ) : (
              <div className={styles.placeholderLogo}>{tool.name.charAt(0)}</div>
            )}
          </div>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>
              {tool.name}
              {tool.verified && <FiCheckCircle className={styles.verifiedIcon} title="Verified Tool" />}
            </h1>
            <p className={styles.categoryInfo}>
              {tool.category} • {tool.subCategory}
            </p>
          </div>
          <div className={styles.actionArea}>
            <a href={tool.website} target="_blank" rel="noopener noreferrer" className={styles.websiteBtn}>
              Visit Website <FiExternalLink />
            </a>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.mainInfo}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <p className={styles.description}>{tool.description}</p>

            <h2 className={styles.sectionTitle}>Tags</h2>
            <div className={styles.tags}>
              {tool.tags?.map((tag, i) => (
                <span key={i} className={styles.tag}>
                  <FiTag /> {tag}
                </span>
              ))}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.metaBox}>
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}><FiDollarSign /></div>
                <div className={styles.metaContent}>
                  <strong>Pricing</strong>
                  <span>{tool.pricing}</span>
                  {tool.freeTrial && <span className={styles.trialBadge}>Free Trial</span>}
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}><FiMonitor /></div>
                <div className={styles.metaContent}>
                  <strong>Platforms</strong>
                  <span>{tool.platform?.join(', ')}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
