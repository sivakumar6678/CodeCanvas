'use client';
import { useState, useEffect } from 'react';
import { FiMessageSquare, FiCornerDownRight, FiUser, FiSend } from 'react-icons/fi';
import styles from './CommentsSection.module.scss';
import { useRouter } from 'next/navigation';

export default function CommentsSection({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tools/${slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [slug]);

  const handlePostComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newComment;
    if (!content.trim()) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/tools/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent_id: parentId })
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (res.ok) {
        if (parentId) {
          setReplyTo(null);
          setReplyText('');
        } else {
          setNewComment('');
        }
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Group top level and child comments
  const topLevel = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}><FiMessageSquare /> Developer Discussions</h2>
        <span className={styles.count}>{comments.length} Comments</span>
      </div>

      <form onSubmit={(e) => handlePostComment(e, null)} className={styles.postForm}>
        <textarea
          placeholder="Ask a question or share tips about this tool..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          required
        />
        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          <FiSend /> {submitting ? 'Posting...' : 'Comment'}
        </button>
      </form>

      <div className={styles.commentsList}>
        {loading ? (
          <p className={styles.loading}>Loading discussions...</p>
        ) : topLevel.length === 0 ? (
          <p className={styles.empty}>No discussions yet. Start the conversation!</p>
        ) : (
          topLevel.map(comment => (
            <div key={comment.id} className={styles.commentTree}>
              <div className={styles.commentCard}>
                <div className={styles.commentHeader}>
                  <div className={styles.user}>
                    {comment.user_profiles?.avatar_url ? (
                      <img src={comment.user_profiles.avatar_url} alt="avatar" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}><FiUser /></div>
                    )}
                    <span className={styles.username}>{comment.user_profiles?.username || 'Developer'}</span>
                  </div>
                  <span className={styles.date}>{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p className={styles.content}>{comment.content}</p>
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className={styles.replyBtn}
                >
                  Reply
                </button>

                {replyTo === comment.id && (
                  <form onSubmit={(e) => handlePostComment(e, comment.id)} className={styles.replyForm}>
                    <input
                      type="text"
                      placeholder={`Reply to ${comment.user_profiles?.username || 'Developer'}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      autoFocus
                      required
                    />
                    <div className={styles.replyActions}>
                      <button type="button" onClick={() => setReplyTo(null)} className={styles.cancelBtn}>Cancel</button>
                      <button type="submit" disabled={submitting} className={styles.submitBtn}>Send</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Nested Replies */}
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className={styles.replyCard}>
                  <FiCornerDownRight className={styles.replyIcon} />
                  <div className={styles.commentCard} style={{ flex: 1 }}>
                    <div className={styles.commentHeader}>
                      <div className={styles.user}>
                        {reply.user_profiles?.avatar_url ? (
                          <img src={reply.user_profiles.avatar_url} alt="avatar" className={styles.avatar} />
                        ) : (
                          <div className={styles.avatarPlaceholder}><FiUser /></div>
                        )}
                        <span className={styles.username}>{reply.user_profiles?.username || 'Developer'}</span>
                      </div>
                      <span className={styles.date}>{new Date(reply.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className={styles.content}>{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
