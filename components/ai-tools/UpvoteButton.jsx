'use client';
import { useState, useEffect } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import styles from './UpvoteButton.module.scss';
import { useRouter } from 'next/navigation';

export default function UpvoteButton({ slug, compact = false, className = '' }) {
  const [count, setCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [countLoading, setCountLoading] = useState(true);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchUpvotes = async () => {
      try {
        const res = await fetch(`/api/tools/${slug}/upvote`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCount(data.count);
            setHasUpvoted(data.hasUpvoted);
          }
        }
      } catch (err) {
        console.error('Error loading upvotes:', err);
      } finally {
        if (isMounted) setCountLoading(false);
      }
    };
    fetchUpvotes();
    return () => { isMounted = false; };
  }, [slug]);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const prevCount = count;
    const prevHasUpvoted = hasUpvoted;
    setError('');
    setUpvoteLoading(true);

    try {
      const res = await fetch(`/api/tools/${slug}/upvote`, {
        method: 'POST',
      });

      if (res.status === 401) {
        // Revert and send to login
        setHasUpvoted(prevHasUpvoted);
        setCount(prevCount);
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upvote failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setHasUpvoted(prevHasUpvoted);
      setCount(prevCount);
    } finally {
      setUpvoteLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={countLoading || upvoteLoading}
      className={`${styles.upvoteBtn} ${hasUpvoted ? styles.active : ''} ${compact ? styles.compact : ''} ${className}`}
      title={hasUpvoted ? "Remove Upvote" : "Upvote this tool"}
      aria-label={error || (hasUpvoted ? 'Remove Upvote' : 'Upvote this tool')}
    >
      <FiChevronUp className={styles.icon} />
      <span className={styles.count}>{count}</span>
    </button>
  );
}
