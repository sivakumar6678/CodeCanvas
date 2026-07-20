import { createClient } from '../../lib/supabase/server';
import styles from './page.module.scss';
import { getAllTools } from '../../lib/data-fetchers';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const allTools = await getAllTools();

  // Fetch quick metrics from Supabase
  const { count: viewCount } = await supabase
    .from('analytics_tool_views')
    .select('*', { count: 'exact', head: true });

  const { count: clickCount } = await supabase
    .from('analytics_tool_clicks')
    .select('*', { count: 'exact', head: true });

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening on your platform.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total AI Tools</h3>
          <div className={styles.statValue}>{allTools.length}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Total Views</h3>
          <div className={styles.statValue}>{viewCount || 0}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Outbound Clicks</h3>
          <div className={styles.statValue}>{clickCount || 0}</div>
        </div>
      </div>
    </div>
  );
}
