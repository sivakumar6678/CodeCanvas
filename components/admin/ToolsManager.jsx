'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
  FiSearch,
  FiFilter,
  FiUpload,
  FiDownload,
  FiCheckSquare,
  FiSquare,
  FiAlertCircle,
  FiImage,
  FiSettings,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiCheck
} from 'react-icons/fi';
import styles from './ToolsManager.module.scss';
import ToolJsonImport from './BulkToolJsonImport';
import { toolToFormState, formStateToTool } from '../../lib/canonical-tool-schema';

export default function ToolsManager({ initialTools, categories }) {
  const [tools, setTools] = useState(initialTools || []);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // UI State
  const [showImport, setShowImport] = useState(false);
  const [drawerTool, setDrawerTool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    subCategory: 'all',
    pricing: 'all',
    platform: 'all',
    status: 'all',
    health: 'all'
  });

  // Pagination State
  const [pageSize, setPageSize] = useState(25); // 25, 50, 100
  const [currentPage, setCurrentPage] = useState(1);

  // Selection State (Slugs of selected tools)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState('');

  // Data fetching
  const refreshCatalog = async () => {
    try {
      const res = await fetch('/api/admin/tools');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTools(data);
          setSelectedIds(new Set());
        }
      }
    } catch (e) {
      console.error('Failed to refresh tools catalog:', e);
    }
  };

  // Dynamic Subcategories calculation
  const availableSubcategories = useMemo(() => {
    const set = new Set();
    tools.forEach(t => {
      if (filters.category === 'all' || t.category === filters.category) {
        if (t.subCategory && typeof t.subCategory === 'string' && t.subCategory.trim()) {
          set.add(t.subCategory.trim());
        }
      }
    });
    return Array.from(set).sort();
  }, [tools, filters.category]);

  // Dynamic Platforms calculation
  const availablePlatforms = useMemo(() => {
    const set = new Set(['Web', 'macOS', 'Windows', 'Linux', 'API', 'iOS', 'Android']);
    tools.forEach(t => {
      const toolPlatforms = Array.isArray(t.platforms)
        ? t.platforms
        : Array.isArray(t.platform)
        ? t.platform
        : typeof t.platforms === 'string'
        ? t.platforms.split(',')
        : typeof t.platform === 'string'
        ? t.platform.split(',')
        : [];

      toolPlatforms.forEach(p => {
        const clean = String(p).trim();
        if (clean) set.add(clean);
      });
    });
    return Array.from(set).sort();
  }, [tools]);

  // Derived Metrics
  const metrics = useMemo(() => {
    let active = 0;
    let archived = 0;
    let missingImages = 0;
    let missingMetadata = 0;

    tools.forEach(t => {
      if (t.status === 'archived') archived++;
      else active++;

      if (!t.logoImageUrl || !t.bannerImageUrl) missingImages++;
      if (!t.description || !t.website) missingMetadata++;
    });

    return {
      total: tools.length,
      active,
      archived,
      missingImages,
      missingMetadata
    };
  }, [tools]);

  // Derived Filtered List
  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name?.toLowerCase().includes(q);
        const matchSlug = t.slug?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchTags = Array.isArray(t.tags) && t.tags.some(tag => tag?.toLowerCase().includes(q));
        if (!matchName && !matchSlug && !matchDesc && !matchTags) {
          return false;
        }
      }

      // 2. Category
      if (filters.category !== 'all' && t.category !== filters.category) return false;

      // 3. Subcategory
      if (filters.subCategory !== 'all') {
        const toolSub = (t.subCategory || '').toLowerCase().trim();
        if (toolSub !== filters.subCategory.toLowerCase().trim()) return false;
      }

      // 4. Pricing
      if (filters.pricing !== 'all') {
        const p = (t.pricingModel || t.pricing || 'Free').toLowerCase();
        const filterP = filters.pricing.toLowerCase();
        if (filterP === 'free' && p !== 'free') return false;
        if (filterP === 'paid' && p !== 'paid') return false;
        if (filterP === 'freemium' && p !== 'freemium') return false;
        if (filterP === 'open_source' && !p.includes('open') && !p.includes('source')) return false;
        if (filterP === 'contact' && !p.includes('contact') && !p.includes('enterprise')) return false;
      }

      // 5. Platform
      if (filters.platform !== 'all') {
        const toolPlatforms = Array.isArray(t.platforms)
          ? t.platforms
          : Array.isArray(t.platform)
          ? t.platform
          : typeof t.platforms === 'string'
          ? t.platforms.split(',')
          : typeof t.platform === 'string'
          ? t.platform.split(',')
          : [];

        const targetP = filters.platform.toLowerCase();
        const matchesPlatform = toolPlatforms.some(p => String(p).toLowerCase().includes(targetP));
        if (!matchesPlatform) return false;
      }

      // 6. Status
      if (filters.status !== 'all') {
        if (filters.status === 'active' && t.status === 'archived') return false;
        if (filters.status === 'archived' && t.status !== 'archived') return false;
        if (filters.status === 'featured' && !t.featured) return false;
        if (filters.status === 'new' && !t.new) return false;
        if (filters.status === 'verified' && !t.verified) return false;
      }

      // 7. Health
      if (filters.health !== 'all') {
        const isHealthy = Boolean(t.logoImageUrl && t.bannerImageUrl && t.description && t.website);
        if (filters.health === 'healthy' && !isHealthy) return false;
        if (filters.health === 'needs-attention' && isHealthy) return false;
        if (filters.health === 'missing-logo' && t.logoImageUrl) return false;
        if (filters.health === 'missing-banner' && t.bannerImageUrl) return false;
        if (filters.health === 'missing-meta' && t.description && t.website) return false;
      }

      return true;
    });
  }, [tools, searchQuery, filters]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredTools.length / pageSize));

  // Guard current page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentTools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTools.slice(start, start + pageSize);
  }, [filteredTools, currentPage, pageSize]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.values(filters).forEach(v => {
      if (v !== 'all') count++;
    });
    return count;
  }, [filters]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Reset subcategory if category changes
      if (key === 'category' && value !== prev.category) {
        next.subCategory = 'all';
      }
      return next;
    });
    setCurrentPage(1); // Reset page on filter change
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      category: 'all',
      subCategory: 'all',
      pricing: 'all',
      platform: 'all',
      status: 'all',
      health: 'all'
    });
    setCurrentPage(1);
  };

  // Selection Logic
  const isAllOnPageSelected = useMemo(() => {
    return currentTools.length > 0 && currentTools.every(t => selectedIds.has(t.slug));
  }, [currentTools, selectedIds]);

  const toggleSelection = (slug) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(slug)) newSet.delete(slug);
    else newSet.add(slug);
    setSelectedIds(newSet);
  };

  const toggleSelectAllCurrentPage = () => {
    const newSet = new Set(selectedIds);
    if (isAllOnPageSelected) {
      // Deselect all tools on the current page
      currentTools.forEach(t => newSet.delete(t.slug));
    } else {
      // Select all tools on the current page
      currentTools.forEach(t => newSet.add(t.slug));
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk Actions
  const handleBulkAction = async (actionType, extraData = {}) => {
    if (selectedIds.size === 0) return;

    if (actionType === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete ${selectedIds.size} tool(s)? This action cannot be undone.`
      );
      if (!confirmDelete) return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const toolsPayload = Array.from(selectedIds).map(slug => {
        const tool = tools.find(x => x.slug === slug);
        return {
          slug,
          category: tool?.category || 'coding-assistants',
          ...extraData
        };
      });

      const payload = {
        action: actionType === 'delete' ? 'delete' : 'update',
        tools: toolsPayload
      };

      const res = await fetch('/api/admin/tools/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback({
          type: 'success',
          message: `Bulk ${actionType} completed successfully on ${data.updatedCount || selectedIds.size} tool(s).`
        });
        setSelectedIds(new Set());
        await refreshCatalog();
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: err.error || 'Bulk operation failed.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'API error during bulk action.' });
    } finally {
      setLoading(false);
    }
  };

  // Form Handlers
  const openNewModal = () => {
    setCurrentTool(toolToFormState(null, categories));
    setIsModalOpen(true);
    setDrawerTool(null);
  };

  const openEditModal = (tool) => {
    setCurrentTool(toolToFormState(tool, categories));
    setIsModalOpen(true);
  };

  const openDrawer = (tool) => {
    setDrawerTool(tool);
  };

  const closeDrawer = () => {
    setDrawerTool(null);
  };

  const exportCsv = () => {
    const header = ['Slug', 'Name', 'Category', 'SubCategory', 'Website', 'Pricing', 'Status'];
    const csvContent = [
      header.join(','),
      ...filteredTools.map(t => [
        t.slug,
        `"${(t.name || '').replace(/"/g, '""')}"`,
        t.category || '',
        `"${(t.subCategory || '').replace(/"/g, '""')}"`,
        t.website || '',
        t.pricingModel || t.pricing || '',
        t.status || 'active'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tools_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const isEdit = Boolean(currentTool.id);
    const oldSlug = currentTool.originalSlug || currentTool.slug;
    const oldCategory = currentTool.originalCategory || currentTool.category;
    const url = isEdit
      ? `/api/admin/tools?oldSlug=${encodeURIComponent(oldSlug)}&oldCategory=${encodeURIComponent(oldCategory)}`
      : '/api/admin/tools';

    const payload = formStateToTool(currentTool);
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const { tool } = await res.json();
        if (isEdit) {
          setTools(tools.map(t => (t.slug === oldSlug || (currentTool.id && t.id === currentTool.id) ? tool : t)));
          if (drawerTool && drawerTool.slug === oldSlug) setDrawerTool(tool);
        } else {
          setTools([tool, ...tools]);
        }
        setIsModalOpen(false);
        setFeedback({ type: 'success', message: isEdit ? 'Tool updated successfully.' : 'Tool added successfully.' });
      } else {
        const payloadErr = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: payloadErr.error || 'Failed to save tool.' });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Unable to reach the admin API.' });
    } finally {
      setLoading(false);
    }
  };

  // Smart Pagination range generator
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [totalPages, currentPage]);

  const rangeStart = filteredTools.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredTools.length);

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Catalog Workspace</p>
          <h1>AI Tools Catalog</h1>
          <p className={styles.description}>Manage and curate {metrics.total} AI tools seamlessly across categories.</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => setShowImport(!showImport)} className={styles.secondaryBtn}>
            <FiUpload /> JSON Import
          </button>
          <button onClick={exportCsv} className={styles.secondaryBtn}>
            <FiDownload /> Export CSV
          </button>
          <button onClick={openNewModal} className={styles.primaryBtn}>
            <FiPlus /> Add Tool
          </button>
        </div>
      </div>

      {feedback && (
        <div role="status" className={feedback.type === 'error' ? styles.errorMessage : styles.successMessage}>
          {feedback.message}
        </div>
      )}

      {showImport && (
        <ToolJsonImport
          categories={categories}
          onImportComplete={() => {
            refreshCatalog();
            setShowImport(false);
          }}
        />
      )}

      {/* CATALOG HEALTH CARDS */}
      <div className={styles.healthMetrics}>
        <div className={styles.metricCard} onClick={() => handleFilterChange('status', 'active')}>
          <span className={styles.metricLabel}>Total Active</span>
          <span className={styles.metricValue}>{metrics.active}</span>
        </div>
        <div
          className={`${styles.metricCard} ${metrics.missingImages > 0 ? styles.attention : ''}`}
          onClick={() => handleFilterChange('health', 'missing-logo')}
        >
          <span className={styles.metricLabel}>Missing Images</span>
          <span className={styles.metricValue}>{metrics.missingImages}</span>
        </div>
        <div
          className={`${styles.metricCard} ${metrics.missingMetadata > 0 ? styles.attention : ''}`}
          onClick={() => handleFilterChange('health', 'missing-meta')}
        >
          <span className={styles.metricLabel}>Needs Metadata</span>
          <span className={styles.metricValue}>{metrics.missingMetadata}</span>
        </div>
        <div className={styles.metricCard} onClick={() => handleFilterChange('status', 'archived')}>
          <span className={styles.metricLabel}>Archived</span>
          <span className={styles.metricValue}>{metrics.archived}</span>
        </div>
      </div>

      {/* TOOLBAR & MULTI-ATTRIBUTE FILTERS */}
      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <div className={styles.searchInput}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search tools by name, slug, tag, or description..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            className={styles.secondaryBtn}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FiFilter /> Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
          </button>
          {activeFiltersCount > 0 && (
            <button className={styles.secondaryBtn} onClick={clearAllFilters} title="Clear all filters">
              <FiX /> Reset Filters
            </button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className={styles.advancedFilters}>
            {/* Category Filter */}
            <div className={styles.filterGroup}>
              <label>Category</label>
              <select
                value={filters.category}
                onChange={e => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.slug || c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Subcategory Filter */}
            <div className={styles.filterGroup}>
              <label>Subcategory</label>
              <select
                value={filters.subCategory}
                onChange={e => handleFilterChange('subCategory', e.target.value)}
              >
                <option value="all">All Subcategories</option>
                {availableSubcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Pricing Filter */}
            <div className={styles.filterGroup}>
              <label>Pricing Model</label>
              <select
                value={filters.pricing}
                onChange={e => handleFilterChange('pricing', e.target.value)}
              >
                <option value="all">Any Pricing</option>
                <option value="Free">Free</option>
                <option value="Freemium">Freemium</option>
                <option value="Paid">Paid</option>
                <option value="open_source">Open Source</option>
                <option value="contact">Contact / Enterprise</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className={styles.filterGroup}>
              <label>Platform</label>
              <select
                value={filters.platform}
                onChange={e => handleFilterChange('platform', e.target.value)}
              >
                <option value="all">Any Platform</option>
                {availablePlatforms.map(plat => (
                  <option key={plat} value={plat}>{plat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className={styles.filterGroup}>
              <label>Status</label>
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="featured">Featured Only</option>
                <option value="new">New Only</option>
                <option value="verified">Verified Only</option>
              </select>
            </div>

            {/* Health Filter */}
            <div className={styles.filterGroup}>
              <label>Health Issues</label>
              <select
                value={filters.health}
                onChange={e => handleFilterChange('health', e.target.value)}
              >
                <option value="all">All Tools</option>
                <option value="healthy">Healthy Only</option>
                <option value="needs-attention">Needs Attention</option>
                <option value="missing-logo">Missing Logo</option>
                <option value="missing-banner">Missing Banner</option>
                <option value="missing-meta">Missing Description/URL</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkActionsBar}>
          <span className={styles.bulkInfo}>
            <FiCheckSquare /> {selectedIds.size} tool{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className={styles.bulkButtons}>
            <button
              className={styles.secondaryBtn}
              onClick={() => handleBulkAction('update', { status: 'active' })}
              disabled={loading}
            >
              Set Active
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() => handleBulkAction('update', { status: 'archived' })}
              disabled={loading}
            >
              Archive
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() => handleBulkAction('update', { featured: true })}
              disabled={loading}
            >
              Mark Featured
            </button>

            {/* Bulk Category Mover */}
            <select
              value={bulkCategoryTarget}
              onChange={e => setBulkCategoryTarget(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
            >
              <option value="">Move to Category...</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            {bulkCategoryTarget && (
              <button
                className={styles.secondaryBtn}
                onClick={() => {
                  handleBulkAction('update', { category: bulkCategoryTarget });
                  setBulkCategoryTarget('');
                }}
                disabled={loading}
              >
                Apply Category
              </button>
            )}

            <button
              className={`${styles.primaryBtn} ${styles.danger}`}
              onClick={() => handleBulkAction('delete')}
              disabled={loading}
            >
              <FiTrash2 /> Delete Selected
            </button>

            <button
              className={styles.secondaryBtn}
              onClick={clearSelection}
              title="Clear selection"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* DATA TABLE WORKSPACE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  aria-label="Select all tools on current page"
                  checked={isAllOnPageSelected}
                  onChange={toggleSelectAllCurrentPage}
                />
              </th>
              <th>Tool</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Pricing</th>
              <th>Status</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {currentTools.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No tools found matching the current filters.
                </td>
              </tr>
            ) : (
              currentTools.map(tool => {
                const logo = tool.logoImageUrl || tool.logo || tool.logoImage;
                const pricing = tool.pricingModel || tool.pricing || 'Free';
                const isSelected = selectedIds.has(tool.slug);
                const hasHealthIssues = !logo || !tool.bannerImageUrl || !tool.description || !tool.website;

                return (
                  <tr
                    key={tool.id || tool.slug}
                    className={isSelected ? styles.selected : ''}
                    onClick={(e) => {
                      if (e.target.tagName.toLowerCase() === 'input') return;
                      openDrawer(tool);
                    }}
                  >
                    <td className={styles.checkboxCell} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select tool ${tool.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelection(tool.slug)}
                      />
                    </td>
                    <td>
                      <div className={styles.toolNameCell}>
                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            className={styles.tinyLogo}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={styles.tinyLogoPlaceholder}>?</div>
                        )}
                        <span>{tool.name}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{tool.category}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{tool.subCategory || '—'}</td>
                    <td>{pricing}</td>
                    <td>
                      {tool.status === 'archived' && (
                        <span className={styles.badge} style={{ background: '#e2e8f0', color: '#475569' }}>
                          Archived
                        </span>
                      )}
                      {tool.featured && <span className={styles.badge}>Featured</span>}
                      {tool.new && <span className={styles.badge}>New</span>}
                      {!tool.featured && !tool.new && tool.status !== 'archived' && (
                        <span className={styles.badge} style={{ background: '#f1f5f9', color: '#64748b' }}>
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      {hasHealthIssues ? (
                        <span className={`${styles.badge} ${styles.errorBadge}`}>Needs Attention</span>
                      ) : (
                        <span className={styles.badge} style={{ background: '#dcfce7', color: '#166534' }}>
                          Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* PAGINATION BAR */}
        <div className={styles.pagination}>
          <div className={styles.paginationLeft}>
            <span>
              Showing {rangeStart}–{rangeEnd} of {filteredTools.length} tool{filteredTools.length === 1 ? '' : 's'}
            </span>
            <div className={styles.pageSizeSelector}>
              <label htmlFor="page-size-select">Per page:</label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={e => handlePageSizeChange(e.target.value)}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className={styles.pageControls}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>

            {paginationRange.map((page, idx) => {
              if (page === '...') {
                return <span key={`ellipsis-${idx}`} className={styles.ellipsis}>…</span>;
              }
              return (
                <button
                  key={page}
                  className={currentPage === page ? styles.activePage : ''}
                  onClick={() => setCurrentPage(Number(page))}
                >
                  {page}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              title="Next Page"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* INSPECTOR / TOOL DETAIL DRAWER */}
      {drawerTool && (
        <div className={styles.drawerOverlay} onClick={closeDrawer}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Tool Inspector</h3>
              <button onClick={closeDrawer}><FiX /></button>
            </div>

            <div className={styles.drawerContent}>
              {drawerTool.bannerImageUrl ? (
                <img src={drawerTool.bannerImageUrl} alt="Banner" className={styles.drawerBanner} />
              ) : (
                <div className={styles.drawerBanner} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No Banner Image
                </div>
              )}

              <div className={styles.drawerIdentity}>
                {drawerTool.logoImageUrl ? (
                  <img src={drawerTool.logoImageUrl} alt="Logo" />
                ) : (
                  <div style={{ width: 60, height: 60, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No Logo
                  </div>
                )}
                <div className={styles.identityText}>
                  <h2>{drawerTool.name}</h2>
                  <p>{drawerTool.slug}</p>
                </div>
              </div>

              <div className={styles.drawerSection}>
                <h4>Description</h4>
                <p>{drawerTool.description || <i>Missing description</i>}</p>
              </div>

              <div className={styles.drawerSection}>
                <h4>Classification</h4>
                <p>Category: <strong>{drawerTool.category}</strong></p>
                {drawerTool.subCategory && <p>Subcategory: <strong>{drawerTool.subCategory}</strong></p>}
                <p>Pricing: <strong>{drawerTool.pricingModel || drawerTool.pricing || 'Unknown'}</strong></p>
                <p>Status: <strong>{drawerTool.status || 'Active'}</strong></p>
              </div>

              <div className={styles.drawerSection}>
                <h4>Tags</h4>
                <div className={styles.tags}>
                  {Array.isArray(drawerTool.tags) && drawerTool.tags.length > 0
                    ? drawerTool.tags.map(tag => <span key={tag}>{tag}</span>)
                    : <i>No tags</i>}
                </div>
              </div>

              <div className={styles.drawerSection}>
                <h4>Website</h4>
                {drawerTool.website ? (
                  <a
                    href={drawerTool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    {drawerTool.website} <FiExternalLink />
                  </a>
                ) : (
                  <i>Missing website URL</i>
                )}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button className={styles.secondaryBtn} onClick={() => openEditModal(drawerTool)}>
                <FiEdit2 /> Edit Tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isModalOpen && currentTool && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{currentTool.id ? 'Edit Tool' : 'Add New Tool'}</h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Tool Name *</label>
                  <input
                    required
                    value={currentTool.name || ''}
                    onChange={e => setCurrentTool({ ...currentTool, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Slug (URL friendly) *</label>
                  <input
                    required
                    value={currentTool.slug || ''}
                    onChange={e => setCurrentTool({ ...currentTool, slug: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    required
                    value={currentTool.category || ''}
                    onChange={e => setCurrentTool({ ...currentTool, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Sub Category</label>
                  <input
                    value={currentTool.subCategory || ''}
                    onChange={e => setCurrentTool({ ...currentTool, subCategory: e.target.value })}
                    placeholder="e.g. Code Assistants"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Website URL *</label>
                  <input
                    required
                    type="url"
                    value={currentTool.website || ''}
                    onChange={e => setCurrentTool({ ...currentTool, website: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Logo Image URL</label>
                  <input
                    value={currentTool.logoImageUrl || ''}
                    onChange={e => setCurrentTool({ ...currentTool, logoImageUrl: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Banner Image URL</label>
                  <input
                    value={currentTool.bannerImageUrl || ''}
                    onChange={e => setCurrentTool({ ...currentTool, bannerImageUrl: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Short Description (Card) *</label>
                  <textarea
                    required
                    rows={2}
                    value={currentTool.description || ''}
                    onChange={e => setCurrentTool({ ...currentTool, description: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Full Overview (Markdown supported)</label>
                  <textarea
                    rows={5}
                    value={currentTool.fullOverview || ''}
                    onChange={e => setCurrentTool({ ...currentTool, fullOverview: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Key Features (One per line)</label>
                  <textarea
                    rows={4}
                    value={currentTool.keyFeatures || ''}
                    onChange={e => setCurrentTool({ ...currentTool, keyFeatures: e.target.value })}
                    placeholder="Real-time suggestions&#10;Multi-language support"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Pros (One per line)</label>
                  <textarea
                    rows={3}
                    value={currentTool.pros || ''}
                    onChange={e => setCurrentTool({ ...currentTool, pros: e.target.value })}
                    placeholder="Fast&#10;Intuitive"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Cons (One per line)</label>
                  <textarea
                    rows={3}
                    value={currentTool.cons || ''}
                    onChange={e => setCurrentTool({ ...currentTool, cons: e.target.value })}
                    placeholder="Requires subscription"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Pricing Model</label>
                  <input
                    value={currentTool.pricingModel || ''}
                    onChange={e => setCurrentTool({ ...currentTool, pricingModel: e.target.value })}
                    placeholder="e.g. Free, Freemium, Paid"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Platforms (comma separated)</label>
                  <input
                    value={currentTool.platforms || ''}
                    onChange={e => setCurrentTool({ ...currentTool, platforms: e.target.value })}
                    placeholder="Web, Windows, macOS"
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Tags (comma separated)</label>
                  <input
                    value={currentTool.tags || ''}
                    onChange={e => setCurrentTool({ ...currentTool, tags: e.target.value })}
                    placeholder="AI, Design, Utility"
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Use Cases (one per line)</label>
                  <textarea
                    rows={3}
                    value={currentTool.useCases || ''}
                    onChange={e => setCurrentTool({ ...currentTool, useCases: e.target.value })}
                    placeholder="Code generation&#10;Refactoring"
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Best For (one per line)</label>
                  <textarea
                    rows={3}
                    value={currentTool.bestFor || ''}
                    onChange={e => setCurrentTool({ ...currentTool, bestFor: e.target.value })}
                    placeholder="Developers who want fast autocomplete&#10;Teams working on large codebases"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={currentTool.status || 'active'}
                    onChange={e => setCurrentTool({ ...currentTool, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(currentTool.featured)}
                      onChange={e => setCurrentTool({ ...currentTool, featured: e.target.checked })}
                    />{' '}
                    Featured
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(currentTool.new)}
                      onChange={e => setCurrentTool({ ...currentTool, new: e.target.checked })}
                    />{' '}
                    New Label
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(currentTool.verified)}
                      onChange={e => setCurrentTool({ ...currentTool, verified: e.target.checked })}
                    />{' '}
                    Verified
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(currentTool.hasFree || currentTool.freeTrial)}
                      onChange={e =>
                        setCurrentTool({
                          ...currentTool,
                          hasFree: e.target.checked,
                          freeTrial: e.target.checked
                        })
                      }
                    />{' '}
                    Has Free Option
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className={styles.primaryBtn}>
                  {loading ? 'Saving...' : 'Save Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
