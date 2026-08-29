'use client';

import { useState, useMemo } from 'react';
import { FiEye, FiExternalLink, FiPercent, FiThumbsUp, FiMessageSquare, FiFolder, FiArrowUpRight, FiSearch } from 'react-icons/fi';
import styles from './AdminAnalyticsView.module.scss';
import Link from 'next/link';

export default function AdminAnalyticsView({ analyticsData }) {
  const { kpis, toolsTraffic = [] } = analyticsData;
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('views');

  const categories = useMemo(() => {
    return ['all', ...new Set(toolsTraffic.map((t) => t.category).filter(Boolean))];
  }, [toolsTraffic]);

  const filteredAndSortedTools = useMemo(() => {
    return toolsTraffic
      .filter((tool) => {
        const matchesSearch =
          !search ||
          tool.name.toLowerCase().includes(search.toLowerCase()) ||
          tool.slug.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter === 'all' || tool.category === categoryFilter;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'clicks') return b.clicks - a.clicks;
        if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
        if (sortBy === 'ctr') return (b.ctrNum || 0) - (a.ctrNum || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return b.views - a.views;
      });
  }, [toolsTraffic, search, categoryFilter, sortBy]);

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

      {/* Tools Traffic Table Section */}
      <div className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Tool Performance Breakdown</h2>
            <span className={styles.badge}>{filteredAndSortedTools.length} Tools</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <FiSearch style={{ color: '#64748b' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tools..."
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem' }}
                aria-label="Filter tools"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem' }}
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem' }}
              aria-label="Sort tools"
            >
              <option value="views">Sort by Views</option>
              <option value="clicks">Sort by Clicks</option>
              <option value="ctr">Sort by CTR %</option>
              <option value="upvotes">Sort by Upvotes</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
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
              {filteredAndSortedTools.length > 0 ? (
                filteredAndSortedTools.map((tool) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No tools match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
