import { FiCheck, FiX, FiInfo } from 'react-icons/fi';
import styles from './ContentSection.module.scss';

export default function ContentSection({ tool }) {
  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        
        {tool.overview && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <div className={styles.prose}>
              {/* If it was markdown we'd use react-markdown, but we'll assume basic text/HTML for now */}
              <p>{tool.overview}</p>
            </div>
          </section>
        )}

        {tool.features && tool.features.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Key Features</h2>
            <ul className={styles.featureList}>
              {tool.features.map((feature, i) => (
                <li key={i}>
                  <FiCheck className={styles.checkIcon} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(tool.pros?.length > 0 || tool.cons?.length > 0) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Pros & Cons</h2>
            <div className={styles.prosConsGrid}>
              
              {tool.pros?.length > 0 && (
                <div className={styles.prosBox}>
                  <h3 className={styles.boxTitle}>Pros</h3>
                  <ul className={styles.list}>
                    {tool.pros.map((pro, i) => (
                      <li key={i}><FiCheck className={styles.proIcon} /> {pro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {tool.cons?.length > 0 && (
                <div className={styles.consBox}>
                  <h3 className={styles.boxTitle}>Cons</h3>
                  <ul className={styles.list}>
                    {tool.cons.map((con, i) => (
                      <li key={i}><FiX className={styles.conIcon} /> {con}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </section>
        )}

      </div>

      <aside className={styles.sidebar}>
        <div className={styles.infoWidget}>
          <h3 className={styles.widgetTitle}>Information</h3>
          
          <div className={styles.infoRow}>
            <span className={styles.label}>Pricing</span>
            <span className={styles.value}>{tool.pricing}</span>
          </div>
          
          <div className={styles.infoRow}>
            <span className={styles.label}>Free Trial</span>
            <span className={styles.value}>{tool.freeTrial ? 'Yes' : 'No'}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Category</span>
            <span className={styles.value} style={{textTransform: 'capitalize'}}>{tool.category}</span>
          </div>
        </div>

        {tool.tags && tool.tags.length > 0 && (
          <div className={styles.tagsWidget}>
            <h3 className={styles.widgetTitle}>Tags</h3>
            <div className={styles.tagsGrid}>
              {tool.tags.map((tag, i) => (
                <span key={i} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
