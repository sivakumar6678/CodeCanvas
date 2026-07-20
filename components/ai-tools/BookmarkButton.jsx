'use client';
import { useState, useEffect } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';
import styles from './BookmarkButton.module.scss';
import { useRouter } from 'next/navigation';

export default function BookmarkButton({ slug, showLabel = false, className = '' }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and has saved this tool
    const checkStatus = async () => {
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
    try {
      const action = isSaved ? 'remove' : 'save';
      // Optimistic UI update
      setIsSaved(!isSaved);

      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_slug: slug, action })
      });

      if (res.status === 401) {
        // Revert UI if not logged in and redirect to login
        setIsSaved(isSaved);
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error('Failed to toggle bookmark');
    } catch (error) {
      console.error(error);
      setIsSaved(!isSaved); // Revert on error
    }
  };

  if (loading) return <div className={`${styles.bookmarkBtn} ${styles.loading} ${showLabel ? styles.withLabel : ''} ${className}`} />;

  return (
    <button 
      onClick={toggleBookmark}
      className={`${styles.bookmarkBtn} ${isSaved ? styles.saved : ''} ${showLabel ? styles.withLabel : ''} ${className}`}
      title={isSaved ? "Remove from Saved Tools" : "Save Tool"}
    >
      {isSaved ? <FaBookmark className={styles.icon} /> : <FiBookmark className={styles.icon} />}
      {showLabel && <span>{isSaved ? 'Saved' : 'Save Tool'}</span>}
    </button>
  );
}
