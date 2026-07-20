'use client';
import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import styles from './ReviewForm.module.scss';
import { useRouter } from 'next/navigation';

export default function ReviewForm({ slug, onReviewAdded }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/tools/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review_text: reviewText })
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post review');
      }

      setRating(0);
      setReviewText('');
      onReviewAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>Write a Review</h3>
      
      <div className={styles.ratingInput}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar 
            key={star}
            className={`${styles.star} ${(hoverRating || rating) >= star ? styles.filled : ''}`}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          />
        ))}
      </div>

      <textarea 
        className={styles.textarea}
        placeholder="What did you like or dislike? (Optional)"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        rows={3}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" disabled={isSubmitting || rating === 0} className={styles.submitBtn}>
        {isSubmitting ? 'Submitting...' : 'Post Review'}
      </button>
    </form>
  );
}
