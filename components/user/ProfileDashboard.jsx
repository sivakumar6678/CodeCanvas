'use client';
import { useState } from 'react';
import { FiUser, FiBookmark, FiClock, FiSettings, FiEdit2, FiX, FiCheck, FiThumbsUp, FiStar, FiArrowRight } from 'react-icons/fi';
import styles from './ProfileDashboard.module.scss';
import Link from 'next/link';

export default function ProfileDashboard({ initialData }) {
  const [user, setUser] = useState(initialData.user);
  const [stats] = useState(initialData.stats);
  const [activeTab, setActiveTab] = useState('saved');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    avatar_url: user.avatar_url,
    bio: user.bio
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const { profile } = await res.json();
        setUser({ ...user, ...profile });
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Profile Header Information */}
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className={styles.avatar} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatarPlaceholder}><FiUser /></div>
            )}
            <div>
              <h1 className={styles.username}>{user.username}</h1>
              <p className={styles.email}>{user.email}</p>
            </div>
          </div>

          <button onClick={() => setIsEditing(!isEditing)} className={styles.editBtn}>
            {isEditing ? <FiX /> : <><FiEdit2 /> Edit Profile</>}
          </button>
        </div>

        {user.bio && !isEditing && <p className={styles.bio}>{user.bio}</p>}

        {isEditing && (
          <form onSubmit={handleSaveProfile} className={styles.editForm}>
            <div className={styles.inputGroup}>
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Avatar URL</label>
              <input
                type="text"
                value={formData.avatar_url}
                onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your tech stack..."
                rows={3}
              />
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} className={styles.saveBtn}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Profile Stats Quick Summary */}
      <div className={styles.statsGrid}>
        <Link href="/profile/bookmarks" className={styles.statCard}>
          <div className={styles.iconBox}><FiBookmark /></div>
          <div>
            <span className={styles.statVal}>{stats.bookmarksCount}</span>
            <span className={styles.statLabel}>Saved Tools</span>
          </div>
        </Link>

        <div className={styles.statCard}>
          <div className={styles.iconBox}><FiThumbsUp /></div>
          <div>
            <span className={styles.statVal}>{stats.upvotesCount}</span>
            <span className={styles.statLabel}>Upvoted Tools</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox}><FiStar /></div>
          <div>
            <span className={styles.statVal}>{stats.reviewsCount}</span>
            <span className={styles.statLabel}>Reviews Written</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.active : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <FiBookmark /> Saved Tools ({stats.bookmarksCount})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'recent' ? styles.active : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <FiClock /> Recently Viewed (Placeholder)
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings /> Account Settings (Placeholder)
          </button>
        </div>

        {/* Tab Contents */}
        <div className={styles.tabContent}>
          {activeTab === 'saved' && (
            <div className={styles.savedTabContent}>
              <p className={styles.tabDescription}>
                Manage your saved tools or view them in full grid layout.
              </p>
              <Link href="/profile/bookmarks" className={styles.primaryActionBtn}>
                View All Saved Tools <FiArrowRight />
              </Link>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className={styles.placeholderTabContent}>
              <h3>Recently Viewed Tools</h3>
              <p>Your history of recently inspected tools will appear here.</p>
              <span className={styles.placeholderBadge}>Feature Coming Soon</span>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.placeholderTabContent}>
              <h3>Account & Privacy Settings</h3>
              <p>Manage notification preferences, API keys, and security settings.</p>
              <span className={styles.placeholderBadge}>Feature Coming Soon</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
