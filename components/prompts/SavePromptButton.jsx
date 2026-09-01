'use client';

import { useState, useEffect } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';
import styles from './SavePromptButton.module.scss';
import { usePathname, useRouter } from 'next/navigation';

let savedPromptsCachePromise = null;
let cachedSavedPrompts = null;

export function invalidateSavedPromptsCache() {
  savedPromptsCachePromise = null;
  cachedSavedPrompts = null;
}

async function fetchUserSavedPrompts() {
  if (cachedSavedPrompts !== null) {
    return cachedSavedPrompts;
  }
  if (!savedPromptsCachePromise) {
    savedPromptsCachePromise = fetch('/api/user/saved-prompts')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        cachedSavedPrompts = Array.isArray(data) ? data : [];
        return cachedSavedPrompts;
      })
      .catch((err) => {
        console.error('Error fetching saved prompts status', err);
        savedPromptsCachePromise = null;
        return [];
      });
  }
  return savedPromptsCachePromise;
}

export default function SavePromptButton({ promptId, showLabel = false, className = '' }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    fetchUserSavedPrompts().then((savedItems) => {
      if (isMounted) {
        setIsSaved(savedItems.some((item) => String(item.prompt_id) === String(promptId)));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [promptId]);

  const toggleSave = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isUpdating) return;
    setError('');
    setIsUpdating(true);
    const previousSavedState = isSaved;
    const action = previousSavedState ? 'remove' : 'save';

    try {
      // Optimistic UI update
      setIsSaved(!previousSavedState);

      const res = await fetch('/api/user/saved-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId, action }),
      });

      if (res.status === 401) {
        setIsSaved(previousSavedState);
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to toggle bookmark');
      } else {
        const data = await res.json();
        setIsSaved(Boolean(data.saved));
        invalidateSavedPromptsCache();
      }
    } catch (err) {
      console.error(err);
      setIsSaved(previousSavedState);
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <button
        type="button"
        disabled
        aria-label="Checking save status"
        className={`${styles.saveBtn} ${styles.loading} ${className}`}
        suppressHydrationWarning
      >
        <FiBookmark className={styles.icon} />
        {showLabel && <span>Save</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={Boolean(isUpdating)}
      suppressHydrationWarning
      className={`${styles.saveBtn} ${isSaved ? styles.saved : ''} ${isUpdating ? styles.updating : ''} ${className}`}
      title={isSaved ? 'Remove from Saved Knowledge' : 'Save to Knowledge Base'}
      aria-label={error || (isSaved ? 'Remove from Saved Knowledge' : 'Save to Knowledge Base')}
    >
      {isSaved ? <FaBookmark className={styles.icon} /> : <FiBookmark className={styles.icon} />}
      {showLabel && (
        <span>
          {isUpdating
            ? isSaved
              ? 'Saving...'
              : 'Removing...'
            : isSaved
            ? 'Saved'
            : 'Save'}
        </span>
      )}
    </button>
  );
}
