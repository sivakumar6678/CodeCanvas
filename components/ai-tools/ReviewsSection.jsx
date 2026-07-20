'use client';
import { useState, useEffect } from 'react';
import { FiStar, FiUser, FiLoader } from 'react-icons/fi';
import styles from './ReviewsSection.module.scss';
import ReviewForm from './ReviewForm';

export default function ReviewsSection({ slug }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/tools/${slug}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [slug]);

  const handleReviewAdded = () => {
    fetchReviews(); // Refetch after successful post
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <FiStar key={i} className={i < rating ? styles.starFilled : styles.starEmpty} />
    ));
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Community Reviews</h2>
          <div className={styles.stats}>
            <span className={styles.avgRating}>{averageRating}</span>
            <div className={styles.stars}>{renderStars(Math.round(averageRating))}</div>
            <span className={styles.count}>({reviews.length} reviews)</span>
          </div>
        </div>
      </div>

      <ReviewForm slug={slug} onReviewAdded={handleReviewAdded} />

      <div className={styles.reviewsList}>
        {loading ? (
          <div className={styles.loader}><FiLoader className={styles.spin} /> Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}>No reviews yet. Be the first to share your experience!</div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.user}>
                  {review.user_profiles?.avatar_url ? (
                    <img src={review.user_profiles.avatar_url} alt="avatar" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}><FiUser /></div>
                  )}
                  <span className={styles.username}>{review.user_profiles?.username || 'Anonymous'}</span>
                </div>
                <div className={styles.stars}>{renderStars(review.rating)}</div>
              </div>
              {review.review_text && <p className={styles.reviewText}>{review.review_text}</p>}
              <span className={styles.date}>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
