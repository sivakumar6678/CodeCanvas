'use client';
import { useState, useEffect } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import styles from './UpvoteButton.module.scss';
import { useRouter } from 'next/navigation';

export default function UpvoteButton({ slug, compact = false, className = '' }) {
  const [count, setCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);
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
        if (isMounted) setLoading(false);
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

    // Optimistic UI update
    setHasUpvoted(!prevHasUpvoted);
    setCount(prevHasUpvoted ? prevCount - 1 : prevCount + 1);

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

      if (!res.ok) throw new Error('Upvote failed');
    } catch (err) {
      console.error(err);
      setHasUpvoted(prevHasUpvoted);
      setCount(prevCount);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`${styles.upvoteBtn} ${hasUpvoted ? styles.active : ''} ${compact ? styles.compact : ''} ${className}`}
      title={hasUpvoted ? "Remove Upvote" : "Upvote this tool"}
    >
      <FiChevronUp className={styles.icon} />
      <span className={styles.count}>{count}</span>
    </button>
  );
}
