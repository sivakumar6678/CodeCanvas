'use client';

import { useState } from 'react';
import {
  FiUser,
  FiBookmark,
  FiSettings,
  FiEdit2,
  FiX,
  FiThumbsUp,
  FiStar,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiExternalLink,
  FiZap,
  FiCompass,
  FiCode,
  FiTarget,
  FiDollarSign,
  FiMonitor,
  FiCheck
} from 'react-icons/fi';
import styles from './ProfileDashboard.module.scss';
import Link from 'next/link';
import SavedToolsSection from './SavedToolsSection';
import SavedKnowledgeSection from './SavedKnowledgeSection';
import AIToolCard from '../ai-tools/AIToolCard';
import UserAvatar from '../ui/UserAvatar';
import AvatarPicker from './AvatarPicker';

const ROLES = [
  'Developer',
  'Student',
  'Designer',
  'Founder',
  'Researcher',
  'Content Creator',
  'Freelancer',
  'Other'
];

const EXPERIENCE_LEVELS = [
  { id: 'Beginner', label: 'Beginner' },
  { id: 'Intermediate', label: 'Intermediate' },
  { id: 'Advanced', label: 'Advanced' }
];

const INTERESTS = [
  'Web Development',
  'Mobile Apps',
  'UI/UX Design',
  'AI Agents & Automation',
  'Writing & Content',
  'Data & Research',
  'DevOps & Cloud',
  'Product Strategy'
];

const TECHNOLOGIES = [
  'JavaScript / TypeScript',
  'React / Next.js',
  'Python',
  'Node.js',
  'Tailwind CSS',
  'VS Code',
  'Supabase',
  'Git / CLI',
  'Docker',
  'Rust / Go'
];

const GOALS = [
  'Speed up coding & implementation',
  'Build full-stack MVPs faster',
  'Automate daily workflows',
  'Improve UI design quality',
  'Explore autonomous AI agents',
  'Discover the best developer tools'
];

const PRICING_OPTIONS = [
  { id: 'any', label: 'Any Budget' },
  { id: 'free', label: 'Free only' },
  { id: 'freemium', label: 'Free / Freemium' },
  { id: 'paid', label: 'Paid / Pro' }
];

const PLATFORMS = [
  'Web',
  'Desktop (Mac/Win)',
  'Mobile (iOS/Android)',
  'VS Code',
  'CLI / Terminal'
];

export default function ProfileDashboard({ initialData }) {
  const [user, setUser] = useState(initialData.user);
  const [stats, setStats] = useState(initialData.stats);
  const [activeTab, setActiveTab] = useState('saved');
  const [savedSubTab, setSavedSubTab] = useState('tools');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    avatar_url: user.avatar_url,
    bio: user.bio,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Personalization Preferences State
  const [prefRole, setPrefRole] = useState(user.role || '');
  const [prefExp, setPrefExp] = useState(user.experience_level || '');
  const [prefInterests, setPrefInterests] = useState(user.interests || []);
  const [prefTech, setPrefTech] = useState(user.technologies || []);
  const [prefGoals, setPrefGoals] = useState(user.goals || []);
  const [prefPricing, setPrefPricing] = useState(user.preferred_pricing || 'any');
  const [prefPlatforms, setPrefPlatforms] = useState(user.preferred_platforms || []);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState('');
  const [prefError, setPrefError] = useState(null);

  // Notification states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const contributions = initialData.contributions || { toolSubmissions: [], promptSubmissions: [] };
  const recommendedTools = initialData.recommendedTools || [];
  const allSubmissions = [
    ...(contributions.toolSubmissions || []).map((t) => ({ ...t, kind: 'tool' })),
    ...(contributions.promptSubmissions || []).map((p) => ({ ...p, kind: 'prompt' })),
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const toggleArrayItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const { profile } = await res.json();
        setUser((prev) => ({ ...prev, ...profile }));
        setIsEditing(false);
      } else {
        const payload = await res.json().catch(() => ({}));
        setSaveError(payload.error || 'Unable to save your profile.');
      }
    } catch (err) {
      console.error(err);
      setSaveError('Unable to save your profile. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavedToolsCountChange = (change) => {
    setStats((current) => ({
      ...current,
      bookmarksCount: Math.max(0, current.bookmarksCount + change),
    }));
  };

  const handleSavedPromptsCountChange = (change) => {
    setStats((current) => ({
      ...current,
      savedPromptsCount: Math.max(0, (current.savedPromptsCount || 0) + change),
    }));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefFeedback('');
    setPrefError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: prefRole,
          experience_level: prefExp,
          interests: prefInterests,
          technologies: prefTech,
          goals: prefGoals,
          preferred_pricing: prefPricing,
          preferred_platforms: prefPlatforms,
          onboarding_completed: true,
        }),
      });

      if (res.ok) {
        const { profile } = await res.json();
        setUser((prev) => ({ ...prev, ...profile }));
        setPrefFeedback('Personalization preferences saved successfully!');
        setTimeout(() => setPrefFeedback(''), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setPrefError(data.error || 'Failed to save preferences.');
      }
    } catch (err) {
      console.error(err);
      setPrefError('Unable to save preferences. Please check your connection.');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Profile Header Information */}
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            <UserAvatar
              avatarUrl={isEditing ? formData.avatar_url : user.avatar_url}
              username={isEditing ? formData.username : user.username}
              size="xl"
            />
          </div>

          <div className={styles.infoSection}>
            {!isEditing ? (
              <>
                <div className={styles.nameRow}>
                  <h1 className={styles.username}>{user.username}</h1>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        username: user.username,
                        avatar_url: user.avatar_url || '',
                        bio: user.bio || '',
                      });
                      setSaveError(null);
                      setIsEditing(true);
                    }}
                    className={styles.editBtn}
                    title="Edit Profile"
                    suppressHydrationWarning
                  >
                    <FiEdit2 /> Edit Profile
                  </button>
                </div>
                <p className={styles.email}>{user.email}</p>
                <div className={styles.userMetaBadges}>
                  {user.role && <span className={styles.metaBadge}>{user.role}</span>}
                  {user.experience_level && (
                    <span className={styles.metaBadge}>{user.experience_level}</span>
                  )}
                  {user.preferred_pricing && user.preferred_pricing !== 'any' && (
                    <span className={styles.metaBadge}>{user.preferred_pricing} budget</span>
                  )}
                </div>
                <p className={styles.bio}>
                  {user.bio || 'No bio yet. Click Edit Profile to tell the community about your work.'}
                </p>
                <p className={styles.joined}>
                  Joined{' '}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </p>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className={styles.editForm}>
                <div className={styles.formRow}>
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    maxLength={40}
                  />
                </div>

                <AvatarPicker
                  selectedAvatarId={formData.avatar_url}
                  onSelect={(avatarId) => setFormData((prev) => ({ ...prev, avatar_url: avatarId }))}
                  label="Select Profile Avatar"
                />

                <div className={styles.formRow}>
                  <label>Bio</label>
                  <textarea
                    rows="2"
                    placeholder="Write a brief intro..."
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={500}
                  />
                </div>

                {saveError && <div className={styles.errorAlert}>{saveError}</div>}

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    disabled={saving}
                    className={styles.saveBtn}
                    suppressHydrationWarning
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSaveError(null);
                    }}
                    className={styles.cancelBtn}
                    suppressHydrationWarning
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Activity Stats Quick-Grid */}
      <div className={styles.statsGrid}>
        <div
          className={`${styles.statCard} ${activeTab === 'saved' && savedSubTab === 'tools' ? styles.activeStatCard : ''}`}
          onClick={() => { setActiveTab('saved'); setSavedSubTab('tools'); }}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.iconBox}><FiBookmark /></div>
          <div>
            <span className={styles.statVal}>{stats.bookmarksCount}</span>
            <span className={styles.statLabel}>Saved Tools</span>
          </div>
        </div>

        <div
          className={`${styles.statCard} ${activeTab === 'saved' && savedSubTab === 'knowledge' ? styles.activeStatCard : ''}`}
          onClick={() => { setActiveTab('saved'); setSavedSubTab('knowledge'); }}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.iconBox}><FiTarget /></div>
          <div>
            <span className={styles.statVal}>{stats.savedPromptsCount || initialData.savedPrompts?.length || 0}</span>
            <span className={styles.statLabel}>Saved Knowledge</span>
          </div>
        </div>

        <div
          className={`${styles.statCard} ${activeTab === 'recommendations' ? styles.activeStatCard : ''}`}
          onClick={() => setActiveTab('recommendations')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.iconBox}><FiZap /></div>
          <div>
            <span className={styles.statVal}>{recommendedTools.length}</span>
            <span className={styles.statLabel}>Recommended</span>
          </div>
        </div>

        <div
          className={`${styles.statCard} ${activeTab === 'contributions' ? styles.activeStatCard : ''}`}
          onClick={() => setActiveTab('contributions')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.iconBox}><FiLayers /></div>
          <div>
            <span className={styles.statVal}>{stats.contributionsCount || allSubmissions.length}</span>
            <span className={styles.statLabel}>Contributions</span>
          </div>
        </div>

        <div
          className={`${styles.statCard} ${activeTab === 'settings' ? styles.activeStatCard : ''}`}
          onClick={() => setActiveTab('settings')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.iconBox}><FiSettings /></div>
          <div>
            <span className={styles.statVal}>{(prefInterests.length + prefTech.length) || 'Set'}</span>
            <span className={styles.statLabel}>Preferences</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.active : ''}`}
            onClick={() => setActiveTab('saved')}
            suppressHydrationWarning
          >
            <FiBookmark /> Saved Items ({stats.bookmarksCount + (stats.savedPromptsCount || initialData.savedPrompts?.length || 0)})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'recommendations' ? styles.active : ''}`}
            onClick={() => setActiveTab('recommendations')}
            suppressHydrationWarning
          >
            <FiZap /> Recommended For You
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'contributions' ? styles.active : ''}`}
            onClick={() => setActiveTab('contributions')}
            suppressHydrationWarning
          >
            <FiLayers /> My Contributions ({allSubmissions.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
            suppressHydrationWarning
          >
            <FiSettings /> Personalization &amp; Preferences
          </button>
        </div>

        {/* Tab Contents */}
        <div className={styles.tabContent}>
          {/* Saved Items (Tools & Knowledge) */}
          {activeTab === 'saved' && (
            <div>
              <div className={styles.subTabs}>
                <button
                  type="button"
                  className={`${styles.subTabBtn} ${savedSubTab === 'tools' ? styles.active : ''}`}
                  onClick={() => setSavedSubTab('tools')}
                >
                  <FiBookmark /> Saved Tools ({stats.bookmarksCount})
                </button>
                <button
                  type="button"
                  className={`${styles.subTabBtn} ${savedSubTab === 'knowledge' ? styles.active : ''}`}
                  onClick={() => setSavedSubTab('knowledge')}
                >
                  <FiTarget /> AI Knowledge ({stats.savedPromptsCount || initialData.savedPrompts?.length || 0})
                </button>
              </div>

              {savedSubTab === 'tools' ? (
                <SavedToolsSection
                  initialTools={initialData.savedTools}
                  onCountChange={handleSavedToolsCountChange}
                />
              ) : (
                <SavedKnowledgeSection
                  initialPrompts={initialData.savedPrompts}
                  onCountChange={handleSavedPromptsCountChange}
                />
              )}
            </div>
          )}

          {/* Recommended For You */}
          {activeTab === 'recommendations' && (
            <div className={styles.recommendationsSection}>
              <div className={styles.sectionTop}>
                <div>
                  <h3>Recommended For You</h3>
                  <p>
                    Deterministic suggestions based on your role ({user.role || 'Developer'}), experience ({user.experience_level || 'Intermediate'}), and focus areas.
                  </p>
                </div>
                <Link href="/build-toolkit" className={styles.toolkitLink}>
                  Open Toolkit Builder &rarr;
                </Link>
              </div>

              {recommendedTools.length > 0 ? (
                <div className={styles.recommendedGrid}>
                  {recommendedTools.map((tool) => (
                    <div key={tool.id || tool.slug} className={styles.recCardWrapper}>
                      {tool.fitReason && (
                        <div className={styles.fitBadge}>
                          <FiZap /> {tool.fitReason}
                        </div>
                      )}
                      <AIToolCard tool={tool} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholderTabContent}>
                  <h3>No Recommendations Yet</h3>
                  <p>Complete your personalization preferences to receive tailored tool recommendations.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={styles.ctaLink}
                  >
                    Configure Preferences &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* My Contributions */}
          {activeTab === 'contributions' && (
            <div className={styles.contributionsSection}>
              {allSubmissions.length > 0 ? (
                <div className={styles.submissionsList}>
                  {allSubmissions.map((sub) => (
                    <article key={sub.id} className={styles.submissionCard}>
                      <div className={styles.subHeader}>
                        <div className={styles.subBadges}>
                          <span className={styles.subKind}>
                            {sub.kind === 'tool' ? 'AI Tool' : (sub.type || 'Prompt')}
                          </span>
                          <span className={styles.subCategory}>{sub.category}</span>
                        </div>
                        <span
                          className={`${styles.statusBadge} ${
                            sub.status === 'approved'
                              ? styles.statusApproved
                              : sub.status === 'rejected'
                              ? styles.statusRejected
                              : styles.statusPending
                          }`}
                        >
                          {sub.status === 'approved' ? (
                            <><FiCheckCircle /> Published</>
                          ) : sub.status === 'rejected' ? (
                            <><FiAlertCircle /> Rejected</>
                          ) : (
                            <><FiClock /> Under Review</>
                          )}
                        </span>
                      </div>

                      <h3>{sub.kind === 'tool' ? sub.tool_name : sub.title}</h3>
                      <p>{sub.description}</p>

                      {sub.website && (
                        <a
                          href={sub.website}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.subLink}
                        >
                          Visit Website <FiExternalLink />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.placeholderTabContent}>
                  <h3>No Contributions Yet</h3>
                  <p>You haven't submitted any AI tools or prompts to the catalog yet.</p>
                  <Link href="/community" className={styles.ctaLink}>
                    Submit a Tool or Prompt &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Personalization & Preferences */}
          {activeTab === 'settings' && (
            <div className={styles.settingsSection}>
              <form onSubmit={handleSavePreferences} className={styles.preferencesForm}>
                <div className={styles.prefGroup}>
                  <h3><FiUser /> Primary Role</h3>
                  <div className={styles.pillGrid}>
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`${styles.selectionPill} ${prefRole === r ? styles.selected : ''}`}
                        onClick={() => setPrefRole(r)}
                      >
                        {prefRole === r && <FiCheck />}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.prefGroup}>
                  <h3><FiCompass /> Experience Level</h3>
                  <div className={styles.pillGrid}>
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        className={`${styles.selectionPill} ${prefExp === lvl.id ? styles.selected : ''}`}
                        onClick={() => setPrefExp(lvl.id)}
                      >
                        {prefExp === lvl.id && <FiCheck />}
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.prefGroup}>
                  <h3><FiZap /> Work Areas &amp; Interests</h3>
                  <div className={styles.pillGrid}>
                    {INTERESTS.map((interest) => {
                      const isSelected = prefInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                          onClick={() => toggleArrayItem(prefInterests, setPrefInterests, interest)}
                        >
                          {isSelected && <FiCheck />}
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.prefGroup}>
                  <h3><FiCode /> Technologies in Your Stack</h3>
                  <div className={styles.pillGrid}>
                    {TECHNOLOGIES.map((tech) => {
                      const isSelected = prefTech.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                          onClick={() => toggleArrayItem(prefTech, setPrefTech, tech)}
                        >
                          {isSelected && <FiCheck />}
                          {tech}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.prefGroup}>
                  <h3><FiTarget /> Primary Goals</h3>
                  <div className={styles.pillGrid}>
                    {GOALS.map((goal) => {
                      const isSelected = prefGoals.includes(goal);
                      return (
                        <button
                          key={goal}
                          type="button"
                          className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                          onClick={() => toggleArrayItem(prefGoals, setPrefGoals, goal)}
                        >
                          {isSelected && <FiCheck />}
                          {goal}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.prefGroup}>
                  <h3><FiDollarSign /> Budget Preference</h3>
                  <div className={styles.pillGrid}>
                    {PRICING_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`${styles.selectionPill} ${prefPricing === opt.id ? styles.selected : ''}`}
                        onClick={() => setPrefPricing(opt.id)}
                      >
                        {prefPricing === opt.id && <FiCheck />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.prefGroup}>
                  <h3><FiMonitor /> Preferred Platforms</h3>
                  <div className={styles.pillGrid}>
                    {PLATFORMS.map((plat) => {
                      const isSelected = prefPlatforms.includes(plat);
                      return (
                        <button
                          key={plat}
                          type="button"
                          className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                          onClick={() => toggleArrayItem(prefPlatforms, setPrefPlatforms, plat)}
                        >
                          {isSelected && <FiCheck />}
                          {plat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.securityBox}>
                  <h3>Account &amp; Session</h3>
                  <label className={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    />
                    <span>Email notifications when your submitted tool or prompt is reviewed</span>
                  </label>
                  <p>You are signed in as <strong>{user.email}</strong>.</p>
                  <Link href="/login" className={styles.secLink}>
                    Manage Credentials / Switch Account
                  </Link>
                </div>

                {prefFeedback && <div className={styles.feedbackAlert}>{prefFeedback}</div>}
                {prefError && <div className={styles.errorAlert}>{prefError}</div>}

                <button
                  type="submit"
                  disabled={savingPrefs}
                  className={styles.saveBtn}
                  suppressHydrationWarning
                >
                  {savingPrefs ? 'Saving Preferences...' : 'Save Personalization Preferences'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

