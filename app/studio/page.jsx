import Link from 'next/link';
import { FiActivity, FiArrowUpRight, FiBox, FiExternalLink, FiMousePointer } from 'react-icons/fi';
import { createClient } from '../../lib/supabase/server';
import { getAllTools } from '../../lib/data-fetchers';
import styles from './page.module.scss';

export default async function StudioDashboardPage() {
  const supabase = createClient();
  const [allTools, viewsResult, clicksResult] = await Promise.all([getAllTools(), supabase.from('analytics_tool_views').select('*', { count: 'exact', head: true }), supabase.from('analytics_tool_clicks').select('*', { count: 'exact', head: true })]);
  const views = viewsResult.count || 0;
  const clicks = clicksResult.count || 0;
  const ctr = views ? `${((clicks / views) * 100).toFixed(1)}%` : '0.0%';
  const stats = [{ label: 'Published AI tools', value: allTools.length, icon: FiBox }, { label: 'Catalog views', value: views, icon: FiActivity }, { label: 'Outbound clicks', value: clicks, icon: FiMousePointer }, { label: 'Click-through rate', value: ctr, icon: FiExternalLink }];
  return <div className={styles.dashboard}>
    <section className={styles.intro}><div><p className={styles.kicker}>Studio overview</p><h1>Good to see you.</h1><p>Keep the CodeCraft catalog accurate and understand how visitors use it.</p></div><Link href="/studio/tools" className={styles.primaryAction}>Manage AI tools <FiArrowUpRight /></Link></section>
    <section className={styles.statsGrid}>{stats.map(({ label, value, icon: Icon }) => <article key={label} className={styles.statCard}><span className={styles.statIcon}><Icon /></span><p>{label}</p><strong>{value}</strong></article>)}</section>
    <section className={styles.contentGrid}><article className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.kicker}>Catalog</p><h2>Manage your directory</h2></div><Link href="/studio/tools">Open tools <FiArrowUpRight /></Link></div><p className={styles.panelText}>Create, edit, and organize the AI tools that appear in the public directory. Changes use the existing protected catalog workflow.</p><div className={styles.catalogCount}><strong>{allTools.length}</strong><span>tools currently available</span></div></article><article className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.kicker}>Insights</p><h2>Measure engagement</h2></div><Link href="/studio/analytics">View analytics <FiArrowUpRight /></Link></div><p className={styles.panelText}>Review traffic, outbound interest, and community signals for every catalog tool.</p><div className={styles.catalogCount}><strong>{ctr}</strong><span>overall click-through rate</span></div></article></section>
  </div>;
}
