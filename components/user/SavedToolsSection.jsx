'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiBookmark, FiExternalLink, FiLoader, FiTrash2 } from 'react-icons/fi';
import styles from './SavedToolsSection.module.scss';

export default function SavedToolsSection({ initialTools, onCountChange }) {
  const [tools, setTools] = useState(initialTools);
  const [removingSlug, setRemovingSlug] = useState(null);
  const [feedback, setFeedback] = useState('');

  const removeTool = async (slug) => {
    if (removingSlug) return;
    setRemovingSlug(slug);
    setFeedback('');
    try {
      const response = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_slug: slug, action: 'remove' }),
      });
      if (response.status === 401) {
        setFeedback('Your session has expired. Please sign in again.');
        return;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to remove this saved tool.');
      }
      setTools((current) => current.filter((tool) => tool.slug !== slug));
      onCountChange?.(-1);
      setFeedback('Tool removed from your saved list.');
    } catch (error) {
      console.error('[saved-tools] remove-failed', error);
      setFeedback(error.message || 'Unable to remove this saved tool.');
    } finally {
      setRemovingSlug(null);
    }
  };

  if (!tools.length) {
    return <>{feedback && <p role="status" className={styles.feedback}>{feedback}</p>}<div className={styles.emptyState}><FiBookmark /><h3>No saved tools yet</h3><p>Save useful AI tools from the directory to build your personal toolkit.</p><Link href="/ai-tools" className={styles.exploreButton}>Explore AI Tools</Link></div></>;
  }

  return <div>
    {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
    <div className={styles.grid}>{tools.map((tool) => <article key={tool.slug} className={styles.card}>
      <div className={styles.cardTop}>{tool.logo ? <img src={tool.logo} alt="" className={styles.logo} loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : <span className={styles.logoFallback}>{tool.name.charAt(0)}</span>}<span className={styles.category}>{tool.category}</span></div>
      <h3>{tool.name}</h3><p>{tool.description}</p>
      <div className={styles.actions}><Link href={`/ai-tools/tool/${tool.slug}`} className={styles.viewButton}>View tool <FiExternalLink /></Link><button type="button" onClick={() => removeTool(tool.slug)} disabled={Boolean(removingSlug)} className={styles.removeButton}>{removingSlug === tool.slug ? <><FiLoader className={styles.spinner} /> Removing...</> : <><FiTrash2 /> Remove</>}</button></div>
    </article>)}</div>
  </div>;
}
