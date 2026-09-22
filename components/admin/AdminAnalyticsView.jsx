'use client';

import { useState, useMemo } from 'react';
import {
  FiEye,
  FiExternalLink,
  FiPercent,
  FiMessageSquare,
  FiBookmark,
  FiUsers,
  FiUploadCloud,
  FiArrowUpRight,
  FiSearch,
  FiTrendingUp,
  FiClock,
  FiCopy,
  FiStar,
  FiLayers,
  FiCheckCircle,
} from 'react-icons/fi';
import styles from './AdminAnalyticsView.module.scss';
import Link from 'next/link';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function renderActivityIcon(iconType) {
  switch (iconType) {
    case 'save':
      return <FiBookmark style={{ color: '#3b82f6' }} />;
    case 'review':
      return <FiStar style={{ color: '#f59e0b' }} />;
    case 'contribution':
      return <FiUploadCloud style={{ color: '#10b981' }} />;
    case 'copy':
      return <FiCopy style={{ color: '#8b5cf6' }} />;
    case 'search':
      return <FiSearch style={{ color: '#6366f1' }} />;
    case 'click':
      return <FiExternalLink style={{ color: '#06b6d4' }} />;
    case 'category':
      return <FiLayers style={{ color: '#ec4899' }} />;
    default:
      return <FiEye style={{ color: '#64748b' }} />;
  }
}

export default function AdminAnalyticsView({ analyticsData = {} }) {
  const {
    kpis = {},
    mostViewedTools = [],
    mostSavedTools = [],
    popularCategories = [],
    recentActivity = [],
    toolsTraffic = [],
  } = analyticsData;

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
          (tool.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (tool.slug || '').toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter === 'all' || tool.category === categoryFilter;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'saves') return (b.saves || 0) - (a.saves || 0);
        if (sortBy === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
        if (sortBy === 'ctr') return (b.ctrNum || 0) - (a.ctrNum || 0);
        if (sortBy === 'upvotes') return (b.upvotes || 0) - (a.upvotes || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return (b.views || 0) - (a.views || 0);
      });
  }, [toolsTraffic, search, categoryFilter, sortBy]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Studio Analytics & Platform Insights</h1>
        <p className={styles.subtitle}>
          Real-time metrics on registered users, catalog traffic, saves, community engagement, and recent platform events.
        </p>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className={styles.kpiGrid}>
        {/* Total Users */}
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <FiUsers />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalUsers || 0}</span>
            <span className={styles.kpiLabel}>Registered Users</span>
          </div>
        </div>

        {/* Tool Views */}
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
            <FiEye />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalViews || 0}</span>
            <span className={styles.kpiLabel}>Total Tool Views</span>
          </div>
        </div>

        {/* Saves */}
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <FiBookmark />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalSaves || 0}</span>
            <span className={styles.kpiLabel}>Total Saves (Tools + Knowledge)</span>
          </div>
        </div>

        {/* Reviews */}
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <FiMessageSquare />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalReviews || 0}</span>
            <span className={styles.kpiLabel}>Reviews Written</span>
          </div>
        </div>

        {/* Contributions */}
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <FiUploadCloud />
          </div>
          <div>
            <span className={styles.kpiVal}>{kpis.totalContributions || 0}</span>
            <span className={styles.kpiLabel}>Community Contributions</span>
          </div>
        </div>

        {/* Outbound Clicks & CTR */}
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
            <FiExternalLink />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className={styles.kpiVal}>{kpis.totalClicks || 0}</span>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>({kpis.ctr || '0%'} CTR)</span>
            </div>
            <span className={styles.kpiLabel}>Website Clicks</span>
          </div>
        </div>
      </div>

      {/* Mid Section: Popular Categories & Most Saved Tools */}
      <div className={styles.midGrid}>
        {/* Popular Categories Card */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiTrendingUp style={{ color: '#6366f1' }} />
              <h3>Popular Categories</h3>
            </div>
            <span className={styles.badge}>{popularCategories.length} Categories</span>
          </div>

          <div className={styles.categoryList}>
            {popularCategories.length > 0 ? (
              popularCategories.slice(0, 6).map((cat) => (
                <div key={cat.name} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.catName}>{cat.name}</span>
                    <span className={styles.catMeta}>
                      {cat.toolCount} tools • {cat.toolViews} views
                    </span>
                  </div>
                  <div className={styles.progressBarWrapper}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${Math.max(cat.percentage || 15, 8)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyNotice}>No category analytics recorded yet.</p>
            )}
          </div>
        </div>

        {/* Most Saved Tools Card */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBookmark style={{ color: '#3b82f6' }} />
              <h3>Most Saved Tools</h3>
            </div>
            <span className={styles.badge}>{mostSavedTools.length} Saved</span>
          </div>

          <div className={styles.savedToolsList}>
            {mostSavedTools.length > 0 ? (
              mostSavedTools.map((tool, idx) => (
                <div key={tool.slug} className={styles.savedToolItem}>
                  <span className={styles.rankNum}>#{idx + 1}</span>
                  <div className={styles.savedToolDetails}>
                    <Link href={`/ai-tools/tool/${tool.slug}`} className={styles.savedToolTitle}>
                      {tool.name}
                    </Link>
                    <span className={styles.savedToolCat}>{tool.category}</span>
                  </div>
                  <div className={styles.savedBadge}>
                    <FiBookmark /> {tool.saveCount} {tool.saveCount === 1 ? 'save' : 'saves'}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptySavedTools}>
                <p>No tools saved by users yet.</p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tools saved by community members will appear here.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className={styles.cardBox}>
        <div className={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiClock style={{ color: '#10b981' }} />
            <h3>Recent Platform Activity</h3>
          </div>
          <span className={styles.badge}>Live Feed</span>
        </div>

        <div className={styles.activityFeed}>
          {recentActivity.length > 0 ? (
            recentActivity.map((act) => (
              <div key={act.id} className={styles.activityRow}>
                <div className={styles.activityIcon}>{renderActivityIcon(act.iconType)}</div>
                <div className={styles.activityBody}>
                  <div className={styles.activityHeadline}>
                    {act.link ? (
                      <Link href={act.link} className={styles.activityTitleLink}>
                        {act.title}
                      </Link>
                    ) : (
                      <span className={styles.activityTitle}>{act.title}</span>
                    )}
                    {act.subtitle && <span className={styles.activitySubtitle}>• {act.subtitle}</span>}
                  </div>
                </div>
                <div className={styles.activityTime}>{formatRelativeTime(act.occurred_at)}</div>
              </div>
            ))
          ) : (
            <p className={styles.emptyNotice}>No platform activity recorded yet.</p>
          )}
        </div>
      </div>

      {/* Tools Performance Breakdown Table */}
      <div className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Tool Performance Breakdown</h2>
            <span className={styles.badge}>{filteredAndSortedTools.length} Tools</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className={styles.searchBox}>
              <FiSearch style={{ color: '#64748b' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tools..."
                aria-label="Filter tools"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.selectFilter}
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
              className={styles.selectFilter}
              aria-label="Sort tools"
            >
              <option value="views">Sort by Views</option>
              <option value="saves">Sort by Saves</option>
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
                <th>Saves</th>
                <th>Outbound Clicks</th>
                <th>CTR %</th>
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
                    <td className={styles.numCell}>{tool.views || 0}</td>
                    <td className={styles.numCell}>
                      <span className={styles.saveCount}>
                        <FiBookmark /> {tool.saves || 0}
                      </span>
                    </td>
                    <td className={styles.numCell}>{tool.clicks || 0}</td>
                    <td>
                      <span className={styles.ctrBadge}>{tool.ctr}</span>
                    </td>
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
