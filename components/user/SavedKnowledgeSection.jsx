'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiBookmark, FiExternalLink, FiLoader, FiTrash2, FiCopy, FiCheck } from 'react-icons/fi';
import styles from './SavedKnowledgeSection.module.scss';
import { invalidateSavedPromptsCache } from '../prompts/SavePromptButton';

export default function SavedKnowledgeSection({ initialPrompts = [], onCountChange }) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [removingId, setRemovingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleCopy = async (id, content, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);

      fetch(`/api/contributions/prompts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'copy' }),
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const removePrompt = async (id) => {
    if (removingId) return;
    setRemovingId(id);
    setFeedback('');
    try {
      const response = await fetch('/api/user/saved-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: id, action: 'remove' }),
      });
      if (response.status === 401) {
        setFeedback('Your session has expired. Please sign in again.');
        return;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to remove this saved item.');
      }
      setPrompts((current) => current.filter((p) => String(p.id) !== String(id)));
      onCountChange?.(-1);
      invalidateSavedPromptsCache();
      setFeedback('Prompt removed from your saved knowledge.');
    } catch (error) {
      console.error('[saved-prompts] remove-failed', error);
      setFeedback(error.message || 'Unable to remove this saved item.');
    } finally {
      setRemovingId(null);
    }
  };

  if (!prompts.length) {
    return (
      <>
        {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
        <div className={styles.emptyState}>
          <FiBookmark />
          <h3>No saved AI Knowledge items yet</h3>
          <p>Save prompts, tricks, shortcuts, and techniques to your personal library.</p>
          <Link href="/ai-prompts-tricks" className={styles.exploreButton}>
            Explore AI Knowledge
          </Link>
        </div>
      </>
    );
  }

  return (
    <div>
      {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
      <div className={styles.grid}>
        {prompts.map((prompt) => (
          <article key={prompt.id} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.typeBadge}>{prompt.type || 'prompt'}</span>
              {prompt.ai_model && <span className={styles.modelBadge}>{prompt.ai_model}</span>}
            </div>
            <h3>{prompt.title}</h3>
            <p>{prompt.description}</p>
            {prompt.prompt_content && (
              <div className={styles.promptSnippet}>
                {prompt.prompt_content.slice(0, 100)}...
              </div>
            )}
            <div className={styles.actions}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link href={`/ai-prompts-tricks/${prompt.id}`} className={styles.viewButton}>
                  View <FiExternalLink />
                </Link>
                {prompt.prompt_content && (
                  <button
                    type="button"
                    onClick={(e) => handleCopy(prompt.id, prompt.prompt_content, e)}
                    className={styles.copyBtn}
                    title="Copy content"
                  >
                    {copiedId === prompt.id ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removePrompt(prompt.id)}
                disabled={Boolean(removingId)}
                className={styles.removeButton}
              >
                {removingId === prompt.id ? (
                  <><FiLoader className={styles.spinner} /> Removing...</>
                ) : (
                  <><FiTrash2 /> Remove</>
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
