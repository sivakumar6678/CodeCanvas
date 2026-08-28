'use client';
import { useState, useEffect } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';
import styles from './BookmarkButton.module.scss';
import { usePathname, useRouter } from 'next/navigation';

export default function BookmarkButton({ slug, showLabel = false, className = '' }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in and has saved this tool
    const checkStatus = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/user/bookmarks');
        if (res.ok) {
          const bookmarks = await res.json();
          setIsSaved(bookmarks.some(b => b.tool_slug === slug));
        }
      } catch (error) {
        console.error('Error fetching bookmark status', error);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [slug]);

  const toggleBookmark = async () => {
    if (isUpdating) return;
    setError('');
    setIsUpdating(true);
    const previousSavedState = isSaved;
    const action = previousSavedState ? 'remove' : 'save';
    try {
      // Optimistic UI update
      setIsSaved(!previousSavedState);

      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      }
    } catch (error) {
      console.error(error);
      setIsSaved(previousSavedState);
      setError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div aria-label="Checking saved status" className={`${styles.bookmarkBtn} ${styles.loading} ${showLabel ? styles.withLabel : ''} ${className}`} />;

  return (
    <button 
      onClick={toggleBookmark}
      disabled={isUpdating}
      className={`${styles.bookmarkBtn} ${isSaved ? styles.saved : ''} ${isUpdating ? styles.updating : ''} ${showLabel ? styles.withLabel : ''} ${className}`}
      title={isSaved ? "Remove from Saved Tools" : "Save Tool"}
      aria-label={error || (isSaved ? 'Remove from Saved Tools' : 'Save Tool')}
    >
      {isSaved ? <FaBookmark className={styles.icon} /> : <FiBookmark className={styles.icon} />}
      {showLabel && <span>{isUpdating ? (isSaved ? 'Saving...' : 'Removing...') : (isSaved ? 'Saved' : 'Save Tool')}</span>}
    </button>
  );
}
