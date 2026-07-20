'use client';
import { FiEye, FiExternalLink, FiPercent, FiThumbsUp, FiMessageSquare, FiFolder, FiArrowUpRight } from 'react-icons/fi';
import styles from './AdminAnalyticsView.module.scss';
import Link from 'next/link';

export default function AdminAnalyticsView({ analyticsData }) {
  const { kpis, toolsTraffic } = analyticsData;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Platform Analytics & Conversion Insights</h1>
        <p className={styles.subtitle}>
          Real-time metrics on tool views, outbound clicks, click-through rates, and community engagement.
        </p>
      </div>

      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(110, 142, 251, 0.12)', color: '#6e8efb' }}>
            <FiEye />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalViews}</span>
            <span className={styles.kpiLabel}>Total Page Views</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71' }}>
            <FiExternalLink />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalClicks}</span>
            <span className={styles.kpiLabel}>Website Clicks</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(167, 119, 227, 0.12)', color: '#a777e3' }}>
            <FiPercent />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.ctr}</span>
            <span className={styles.kpiLabel}>Avg Click-Through Rate</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(255, 107, 107, 0.12)', color: '#ff6b6b' }}>
            <FiThumbsUp />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalUpvotes}</span>
            <span className={styles.kpiLabel}>Total Upvotes</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(241, 196, 15, 0.12)', color: '#f1c40f' }}>
            <FiMessageSquare />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalReviews}</span>
            <span className={styles.kpiLabel}>Reviews Written</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(52, 152, 219, 0.12)', color: '#3498db' }}>
            <FiFolder />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalSavedTools}</span>
            <span className={styles.kpiLabel}>Saved Tools</span>
          </div>
        </div>
      </div>

      {/* Tools Traffic Table */}
      <div className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <h2>Tool Performance Breakdown</h2>
          <span className={styles.badge}>{toolsTraffic.length} Tools Tracked</span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.trafficTable}>
            <thead>
              <tr>
                <th>Tool Name</th>
                <th>Category</th>
                <th>Views</th>
                <th>Outbound Clicks</th>
                <th>CTR %</th>
                <th>Upvotes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {toolsTraffic.map(tool => (
                <tr key={tool.id}>
                  <td className={styles.toolNameCell}>
                    <span className={styles.toolName}>{tool.name}</span>
                  </td>
                  <td>
                    <span className={styles.categoryTag}>{tool.category}</span>
                  </td>
                  <td className={styles.numCell}>{tool.views}</td>
                  <td className={styles.numCell}>{tool.clicks}</td>
                  <td>
                    <span className={styles.ctrBadge}>{tool.ctr}</span>
                  </td>
                  <td className={styles.numCell}>{tool.upvotes}</td>
                  <td>
                    <Link href={`/ai-tools/tool/${tool.slug}`} className={styles.viewLink} target="_blank">
                      View <FiArrowUpRight />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
