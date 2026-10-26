'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import {
  FiArrowUpRight,
  FiCheck,
  FiCopy,
  FiRotateCcw,
  FiSearch,
  FiSliders,
  FiX,
  FiFilter,
  FiLayers,
  FiCpu,
  FiTarget,
  FiTag,
} from 'react-icons/fi';
import styles from './PromptLibrary.module.scss';
import SavePromptButton from './SavePromptButton';

import { KNOWLEDGE_TYPE_LABELS, PRIMARY_KNOWLEDGE_TYPES } from '../../lib/knowledge-schema';
import defaultPrompts from '../../data/default-prompts.json';

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState(defaultPrompts);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [contentType, setContentType] = useState('');
  const [useCase, setUseCase] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (model) params.set('model', model);
    if (contentType) params.set('type', contentType);
    if (useCase) params.set('useCase', useCase);
    if (selectedTag) params.set('tag', selectedTag);

    fetch(`/api/prompts?${params}`)
      .then((response) => (response.ok ? response.json() : defaultPrompts))
      .then((data) => {
        if (active) {
          setPrompts(Array.isArray(data) && data.length > 0 ? data : defaultPrompts);
          setError(null);
        }
      })
      .catch((err) => {
        console.warn('Error fetching prompts, using local defaults:', err);
        if (active) {
          setPrompts(defaultPrompts);
          setError(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, category, model, contentType, useCase, selectedTag]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileFilterOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileFilterOpen]);

  // Handle escape key
  useEffect(() => {
    if (!mobileFilterOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileFilterOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileFilterOpen]);

  const handleCopy = async (id, content, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);

      // Non-blocking telemetry tracking
      fetch(`/api/contributions/prompts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'copy' }),
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setModel('');
    setContentType('');
    setUseCase('');
    setSelectedTag('');
  };

  const categories = [...new Set(defaultPrompts.map((prompt) => prompt.category).filter(Boolean))].sort();
  const models = [...new Set(defaultPrompts.map((prompt) => prompt.ai_model).filter(Boolean))].sort();
  const useCases = [...new Set(defaultPrompts.map((prompt) => prompt.use_case).filter(Boolean))].sort();
  const allTags = [...new Set(defaultPrompts.flatMap((prompt) => prompt.tags || []).filter(Boolean))].sort();

  const activeSecondaryCount = [model, category, useCase, selectedTag].filter(Boolean).length;
  const hasActiveFilters = Boolean(query || category || model || contentType || useCase || selectedTag);

  return (
    <section className={styles.sectionContainer}>
      {/* Top Search & Primary Type Filter Bar */}
      <div className={styles.searchBarWrapper}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts, tricks, shortcuts, guides..."
            aria-label="Search AI knowledge items"
            className={styles.searchInput}
          />
          {query && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setQuery('')}
              aria-label="Clear search input"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Mobile Filter Trigger Button */}
        <button
          type="button"
          className={`${styles.mobileFilterBtn} ${activeSecondaryCount > 0 ? styles.hasActive : ''}`}
          onClick={() => setMobileFilterOpen(true)}
          aria-expanded={mobileFilterOpen}
          aria-label="Open filter options"
        >
          <FiSliders aria-hidden="true" />
          <span>Filters</span>
          {activeSecondaryCount > 0 && (
            <span className={styles.mobileBadge}>{activeSecondaryCount}</span>
          )}
        </button>
      </div>

      {/* Content Type Pill Bar */}
      <div className={styles.typePillRow}>
        <button
          type="button"
          className={`${styles.typePill} ${!contentType ? styles.typePillActive : ''}`}
          onClick={() => setContentType('')}
        >
          All Types
        </button>
        {PRIMARY_KNOWLEDGE_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.typePill} ${contentType === t.id ? styles.typePillActive : ''}`}
            onClick={() => setContentType(contentType === t.id ? '' : t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Desktop Secondary Filters Toolbar */}
      <div className={styles.desktopFilters}>
        <div className={styles.selectGroup}>
          <label className={styles.controlLabel} htmlFor="dk-model">
            <FiCpu aria-hidden="true" /> Model:
          </label>
          <select
            id="dk-model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            aria-label="Filter by AI model"
            className={styles.filterSelect}
          >
            <option value="">All Models</option>
            {models.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.controlLabel} htmlFor="dk-category">
            <FiLayers aria-hidden="true" /> Category:
          </label>
          <select
            id="dk-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
            className={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.controlLabel} htmlFor="dk-usecase">
            <FiTarget aria-hidden="true" /> Use Case:
          </label>
          <select
            id="dk-usecase"
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            aria-label="Filter by use case"
            className={styles.filterSelect}
          >
            <option value="">All Use Cases</option>
            {useCases.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.controlLabel} htmlFor="dk-tag">
            <FiTag aria-hidden="true" /> Tag:
          </label>
          <select
            id="dk-tag"
            value={selectedTag}
            onChange={(event) => setSelectedTag(event.target.value)}
            aria-label="Filter by tag"
            className={styles.filterSelect}
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.desktopResetBtn}
            onClick={resetFilters}
            title="Reset all filters"
          >
            <FiRotateCcw aria-hidden="true" /> Reset
          </button>
        )}
      </div>

      {/* Mobile & Tablet Filter Drawer */}
      {mobileFilterOpen && (
        <>
          <div
            className={styles.drawerBackdrop}
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={drawerRef}
            className={styles.mobileDrawer}
            role="dialog"
            aria-label="Filter AI Knowledge"
            aria-modal="true"
          >
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <FiFilter aria-hidden="true" />
                <h3>Filter Knowledge</h3>
                {activeSecondaryCount > 0 && (
                  <span className={styles.drawerCountBadge}>
                    {activeSecondaryCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.drawerGroup}>
                <label htmlFor="mob-model"><FiCpu /> AI Model / Platform</label>
                <select
                  id="mob-model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className={styles.drawerSelect}
                >
                  <option value="">All Models &amp; Platforms</option>
                  {models.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className={styles.drawerGroup}>
                <label htmlFor="mob-cat"><FiLayers /> Category</label>
                <select
                  id="mob-cat"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={styles.drawerSelect}
                >
                  <option value="">All Categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className={styles.drawerGroup}>
                <label htmlFor="mob-usecase"><FiTarget /> Use Case</label>
                <select
                  id="mob-usecase"
                  value={useCase}
                  onChange={(event) => setUseCase(event.target.value)}
                  className={styles.drawerSelect}
                >
                  <option value="">All Use Cases</option>
                  {useCases.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className={styles.drawerGroup}>
                <label htmlFor="mob-tag"><FiTag /> Tag</label>
                <select
                  id="mob-tag"
                  value={selectedTag}
                  onChange={(event) => setSelectedTag(event.target.value)}
                  className={styles.drawerSelect}
                >
                  <option value="">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.drawerResetBtn}
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                <FiRotateCcw aria-hidden="true" /> Reset
              </button>
              <button
                type="button"
                className={styles.drawerApplyBtn}
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters ({prompts.length})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className={styles.activeFilterRow}>
          <div className={styles.activeChipsList}>
            <span className={styles.activeLabel}>
              <FiFilter aria-hidden="true" /> Active:
            </span>

            {query && (
              <span className={styles.activeChip}>
                Search: &quot;{query}&quot;
                <button type="button" onClick={() => setQuery('')} aria-label="Remove search filter">
                  <FiX />
                </button>
              </span>
            )}

            {contentType && (
              <span className={styles.activeChip}>
                Type: {KNOWLEDGE_TYPE_LABELS[contentType] || contentType}
                <button type="button" onClick={() => setContentType('')} aria-label="Remove type filter">
                  <FiX />
                </button>
              </span>
            )}

            {model && (
              <span className={styles.activeChip}>
                Model: {model}
                <button type="button" onClick={() => setModel('')} aria-label="Remove model filter">
                  <FiX />
                </button>
              </span>
            )}

            {category && (
              <span className={styles.activeChip}>
                Category: {category}
                <button type="button" onClick={() => setCategory('')} aria-label="Remove category filter">
                  <FiX />
                </button>
              </span>
            )}

            {useCase && (
              <span className={styles.activeChip}>
                Use Case: {useCase}
                <button type="button" onClick={() => setUseCase('')} aria-label="Remove use case filter">
                  <FiX />
                </button>
              </span>
            )}

            {selectedTag && (
              <span className={styles.activeChip}>
                Tag: #{selectedTag}
                <button type="button" onClick={() => setSelectedTag('')} aria-label="Remove tag filter">
                  <FiX />
                </button>
              </span>
            )}

            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={resetFilters}
            >
              Clear all
            </button>
          </div>

          <span className={styles.filterSummary}>
            {prompts.length} {prompts.length === 1 ? 'item' : 'items'} found
          </span>
        </div>
      )}

      {loading && <p className={styles.empty}>Loading AI Knowledge items...</p>}
      {error && <p className={styles.empty} style={{ color: 'var(--error-color, #ef4444)' }}>{error}</p>}

      {!loading && !error && prompts.length > 0 && (
        <div className={styles.grid}>
          {prompts.map((prompt) => (
            <article key={prompt.id} className={styles.card}>
              <div className={styles.cardMeta}>
                <div className={styles.badgeRow}>
                  <span className={styles.typeBadge}>
                    {KNOWLEDGE_TYPE_LABELS[prompt.type] || prompt.type || 'Prompt'}
                  </span>
                  {prompt.ai_model && (
                    <span className={styles.modelBadge}>{prompt.ai_model}</span>
                  )}
                  {prompt.category && (
                    <span className={styles.catBadge}>{prompt.category}</span>
                  )}
                </div>
                <SavePromptButton promptId={prompt.id} />
              </div>

              <h2 className={styles.cardTitle}>{prompt.title}</h2>
              <p className={styles.cardDesc}>{prompt.description}</p>

              {prompt.prompt_content && (
                <div className={styles.promptPreview}>
                  <code>{prompt.prompt_content.slice(0, 140)}{prompt.prompt_content.length > 140 ? '...' : ''}</code>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={(e) => handleCopy(prompt.id, prompt.prompt_content, e)}
                    title="Copy prompt text"
                    aria-label="Copy prompt text"
                  >
                    {copiedId === prompt.id ? (
                      <>
                        <FiCheck className={styles.checkIcon} /> Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.authorText}>
                  By {prompt.is_anonymous ? 'Anonymous contributor' : (prompt.display_name || 'CodeCanvas team')}
                </span>
                <Link href={`/ai-knowledge/${prompt.id}`} className={styles.detailsLink}>
                  <span>View details</span>
                  <FiArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && prompts.length === 0 && (
        <div className={styles.empty}>
          <p>No approved AI Knowledge items match those filters yet.</p>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.emptyResetBtn}
              onClick={resetFilters}
            >
              <FiRotateCcw /> Reset filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
