'use client';

import { useState, useEffect } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import styles from './UpvoteButton.module.scss';
import { useRouter } from 'next/navigation';

const upvotesCache = new Map();

async function fetchUpvoteStatus(slug) {
  if (upvotesCache.has(slug)) {
    return upvotesCache.get(slug);
  }
  const promise = fetch(`/api/tools/${slug}/upvote`)
    .then((res) => (res.ok ? res.json() : { count: 0, hasUpvoted: false }))
    .catch(() => ({ count: 0, hasUpvoted: false }));

  upvotesCache.set(slug, promise);
  return promise;
}

export function invalidateUpvoteCache(slug) {
  if (slug) {
    upvotesCache.delete(slug);
  } else {
    upvotesCache.clear();
  }
}

export default function UpvoteButton({ slug, compact = false, className = '' }) {
  const [count, setCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    fetchUpvoteStatus(slug).then((data) => {
      if (isMounted && data) {
        setCount(data.count || 0);
        setHasUpvoted(Boolean(data.hasUpvoted));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const prevCount = count;
    const prevHasUpvoted = hasUpvoted;
    const nextHasUpvoted = !prevHasUpvoted;
    const nextCount = nextHasUpvoted ? prevCount + 1 : Math.max(0, prevCount - 1);

    setError('');
    setUpvoteLoading(true);
    setHasUpvoted(nextHasUpvoted);
    setCount(nextCount);

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
      } else {
        invalidateUpvoteCache(slug);
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
      type="button"
      onClick={handleUpvote}
      disabled={Boolean(upvoteLoading)}
      suppressHydrationWarning
      className={`${styles.upvoteBtn} ${hasUpvoted ? styles.active : ''} ${compact ? styles.compact : ''} ${className}`}
      title={hasUpvoted ? 'Remove Upvote' : 'Upvote this tool'}
      aria-label={error || (hasUpvoted ? 'Remove Upvote' : 'Upvote this tool')}
    >
      <FiChevronUp className={styles.icon} />
      <span className={styles.count}>{count}</span>
    </button>
  );
}
