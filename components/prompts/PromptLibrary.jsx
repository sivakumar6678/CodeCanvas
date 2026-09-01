'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiArrowUpRight, FiCheck, FiCopy, FiRotateCcw, FiSearch } from 'react-icons/fi';
import styles from './PromptLibrary.module.scss';
import SavePromptButton from './SavePromptButton';

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

  const categories = [...new Set(defaultPrompts.map((prompt) => prompt.category).filter(Boolean))];
  const models = [...new Set(defaultPrompts.map((prompt) => prompt.ai_model).filter(Boolean))];
  const useCases = [...new Set(defaultPrompts.map((prompt) => prompt.use_case).filter(Boolean))];
  const allTags = [...new Set(defaultPrompts.flatMap((prompt) => prompt.tags || []).filter(Boolean))];
  const hasActiveFilters = Boolean(query || category || model || contentType || useCase || selectedTag);

  return (
    <section>
      <div className={styles.filters}>
        <label className={styles.search}>
          <FiSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts, tricks, and techniques..."
            aria-label="Search AI prompts and tricks"
          />
        </label>
        <select
          value={contentType}
          onChange={(event) => setContentType(event.target.value)}
          aria-label="Filter by content type"
        >
          <option value="">All content types</option>
          <option value="prompt">Prompts</option>
          <option value="trick">Tricks</option>
          <option value="slash-command">Slash commands</option>
          <option value="technique">Techniques</option>
          <option value="guide">Guides / Tips</option>
        </select>
        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          aria-label="Filter by AI model"
        >
          <option value="">All models</option>
          {models.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={useCase}
          onChange={(event) => setUseCase(event.target.value)}
          aria-label="Filter by use case"
        >
          <option value="">All use cases</option>
          {useCases.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={(event) => setSelectedTag(event.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>#{tag}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className={styles.activeFilterRow}>
          <span className={styles.filterSummary}>
            Showing filtered results {prompts.length ? `(${prompts.length} found)` : ''}
          </span>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetFilters}
            suppressHydrationWarning
          >
            <FiRotateCcw /> Reset filters
          </button>
        </div>
      )}

      {loading && <p className={styles.empty}>Loading AI Knowledge items...</p>}
      {error && <p className={styles.empty} style={{ color: 'var(--error-color)' }}>{error}</p>}

      {!loading && !error && prompts.length > 0 && (
        <div className={styles.grid}>
          {prompts.map((prompt) => (
            <article key={prompt.id} className={styles.card}>
              <div className={styles.cardMeta}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className={styles.typeBadge}>{prompt.type || 'prompt'}</span>
                  {prompt.ai_model && <span className={styles.modelBadge}>{prompt.ai_model}</span>}
                  {prompt.category && <span className={styles.catBadge}>{prompt.category}</span>}
                </div>
                <SavePromptButton promptId={prompt.id} />
              </div>

              <h2>{prompt.title}</h2>
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
                    suppressHydrationWarning
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
                <span>By {prompt.is_anonymous ? 'Anonymous contributor' : (prompt.display_name || 'Community contributor')}</span>
                <Link href={`/ai-prompts-tricks/${prompt.id}`}>
                  View details <FiArrowUpRight />
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
              className={styles.resetBtn}
              onClick={resetFilters}
              style={{ marginTop: '12px' }}
              suppressHydrationWarning
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}