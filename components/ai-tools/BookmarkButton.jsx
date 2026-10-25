'use client';

import { useState, useEffect } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';
import styles from './BookmarkButton.module.scss';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

let bookmarksCachePromise = null;
let cachedBookmarks = null;
let cachedBookmarksUserId = null;

export function invalidateBookmarksCache() {
  bookmarksCachePromise = null;
  cachedBookmarks = null;
  cachedBookmarksUserId = null;
}

async function fetchUserBookmarks(session) {
  const userId = session?.user?.id || null;
  if (!userId) return [];

  if (cachedBookmarks !== null && cachedBookmarksUserId === userId) {
    return cachedBookmarks;
  }
  if (!bookmarksCachePromise || cachedBookmarksUserId !== userId) {
    cachedBookmarksUserId = userId;
    bookmarksCachePromise = fetch('/api/user/bookmarks', {
      headers: session.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        cachedBookmarks = Array.isArray(data) ? data : [];
        return cachedBookmarks;
      })
      .catch((err) => {
        console.error('Error fetching bookmark status', err);
        bookmarksCachePromise = null;
        return [];
      });
  }
  return bookmarksCachePromise;
}

export default function BookmarkButton({ slug, showLabel = false, className = '' }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => fetchUserBookmarks(session)).then((bookmarks) => {
      if (isMounted) {
        setIsSaved(bookmarks.some((b) => b.tool_slug === slug));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug, supabase]);

  const toggleBookmark = async () => {
    if (isUpdating) return;
    setError('');
    setIsUpdating(true);
    const previousSavedState = isSaved;
    const action = previousSavedState ? 'remove' : 'save';
    setPendingAction(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Optimistic UI update
      setIsSaved(!previousSavedState);

      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ tool_slug: slug, action })
      });

      if (res.status === 401) {
        // Revert UI if not logged in and redirect to login
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
        invalidateBookmarksCache();
      }
    } catch (error) {
      console.error(error);
      setIsSaved(previousSavedState);
      setError(error.message);
    } finally {
      setIsUpdating(false);
      setPendingAction(null);
    }
  };

  if (loading) return <div aria-label="Checking saved status" className={`${styles.bookmarkBtn} ${styles.loading} ${showLabel ? styles.withLabel : ''} ${className}`} />;

  return (
    <button 
      type="button"
      onClick={toggleBookmark}
      disabled={Boolean(isUpdating)}
      suppressHydrationWarning
      className={`${styles.bookmarkBtn} ${isSaved ? styles.saved : ''} ${isUpdating ? styles.updating : ''} ${showLabel ? styles.withLabel : ''} ${className}`}
      title={isSaved ? "Remove from Saved Tools" : "Save Tool"}
      aria-label={error || (isSaved ? 'Remove from Saved Tools' : 'Save Tool')}
    >
      {isSaved ? <FaBookmark className={styles.icon} /> : <FiBookmark className={styles.icon} />}
      {showLabel && (
        <span>
          {isUpdating
            ? (pendingAction === 'remove' ? 'Removing...' : 'Saving...')
            : (isSaved ? 'Saved' : 'Save Tool')}
        </span>
      )}
    </button>
  );
}
