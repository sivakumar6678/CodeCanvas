import styles from './PageLoader.module.scss';

export default function PageLoader({ title = 'Loading', message = 'Preparing your workspace...' }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.pulseRow}>
          <span className={styles.dot}></span>
          <span className={styles.label}>{title}</span>
        </div>
        <p>{message}</p>
        <div className={styles.skeletonGrid}>
          <span className={styles.skeletonBlock}></span>
          <span className={styles.skeletonBlock}></span>
          <span className={styles.skeletonBlock}></span>
        </div>
      </div>
    </div>
  );
}
