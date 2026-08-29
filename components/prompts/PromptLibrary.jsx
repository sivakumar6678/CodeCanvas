'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiArrowUpRight, FiSearch } from 'react-icons/fi';
import styles from './PromptLibrary.module.scss';

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [contentType, setContentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (model) params.set('model', model);
    if (contentType) params.set('type', contentType);

    fetch(`/api/prompts?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch prompts: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (active) {
          setPrompts(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Error fetching prompts:', err);
        if (active) {
          setError('Failed to load AI prompts and tricks. Please try again.');
          setPrompts([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, category, model, contentType]);

  const categories = [...new Set(prompts.map((prompt) => prompt.category).filter(Boolean))];
  const models = [...new Set(prompts.map((prompt) => prompt.ai_model).filter(Boolean))];

  return (
    <section>
      <div className={styles.filters}>
        <label className={styles.search}>
          <FiSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts, tricks, and techniques"
            aria-label="Search AI prompts and tricks"
          />
        </label>
        <select value={contentType} onChange={(event) => setContentType(event.target.value)} aria-label="Filter by content type">
          <option value="">All content types</option>
          <option value="prompt">Prompts</option>
          <option value="trick">Tricks</option>
          <option value="slash-command">Slash commands</option>
          <option value="technique">Techniques</option>
        </select>
        <select value={model} onChange={(event) => setModel(event.target.value)} aria-label="Filter by AI model">
          <option value="">All models</option>
          {models.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      {loading && <p className={styles.empty}>Loading AI prompts and tricks...</p>}
      {error && <p className={styles.empty} style={{ color: 'var(--error-color)' }}>{error}</p>}
      {!loading && !error && prompts.length > 0 && (
        <div className={styles.grid}>
          {prompts.map((prompt) => (
            <article key={prompt.id} className={styles.card}>
              <div className={styles.cardMeta}>
                <span>{prompt.type || 'prompt'}</span>
                <span>{prompt.ai_model}</span>
                <span>{prompt.category}</span>
              </div>
              <h2>{prompt.title}</h2>
              <p>{prompt.description}</p>
              <div className={styles.cardFooter}>
                <span>By {prompt.is_anonymous ? 'Anonymous contributor' : prompt.display_name}</span>
                <Link href={`/ai-prompts-tricks/${prompt.id}`}>
                  View details <FiArrowUpRight />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && prompts.length === 0 && (
        <p className={styles.empty}>No approved AI prompts or tricks match those filters yet.</p>
      )}
    </section>
  );
}