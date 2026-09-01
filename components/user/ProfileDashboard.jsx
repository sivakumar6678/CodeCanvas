'use client';

import { useState } from 'react';
import {
  FiUser,
  FiBookmark,
  FiSettings,
  FiEdit3,
  FiX,
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
  FiCheck,
  FiShare2,
  FiCalendar,
  FiMail,
  FiAward,
  FiCpu
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
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState({
    username: user.username || '',
    avatar_url: user.avatar_url || '',
    bio: user.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  // Notification state
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

  const handleOpenEdit = () => {
    setFormData({
      username: user.username || '',
      avatar_url: user.avatar_url || '',
      bio: user.bio || '',
    });
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleShareProfile = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.profile) {
        setUser((prev) => ({ ...prev, ...data.profile }));
        setSaveSuccess(true);
        setTimeout(() => {
          setIsEditing(false);
          setSaveSuccess(false);
        }, 1200);
      } else {
        setSaveError(data.error || 'Unable to save your profile. Please try again.');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveError('Unable to save profile. Please check your network connection.');
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

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.profile) {
        setUser((prev) => ({ ...prev, ...data.profile }));
        setPrefFeedback('Personalization preferences updated successfully!');
        setTimeout(() => setPrefFeedback(''), 4000);
      } else {
        setPrefError(data.error || 'Failed to save preferences. Please try again.');
      }
    } catch (err) {
      console.error('Preferences save error:', err);
      setPrefError('Unable to save preferences. Please check your network connection.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const totalSavedCount = (stats.bookmarksCount || 0) + (stats.savedPromptsCount || initialData.savedPrompts?.length || 0);
  const totalStackPreferencesCount = (prefInterests.length + prefTech.length + prefGoals.length);

  return (
    <div className={styles.container}>
      {/* Top Profile Hero Card */}
      <div className={styles.heroCard}>
        <div className={styles.bannerBackground}>
          <div className={styles.bannerPattern} />
          <div className={styles.bannerOverlay} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.identityRow}>
            {/* Avatar with status ring */}
            <div className={styles.avatarWrapper}>
              <UserAvatar
                avatarUrl={user.avatar_url}
                username={user.username}
                size="xl"
                className={styles.userAvatarCustom}
              />
              <span className={styles.activeBadge} title="Active Member" aria-label="Active Member">
                <FiCheck />
              </span>
            </div>

            {/* User details */}
            <div className={styles.detailsBlock}>
              <div className={styles.titleLine}>
                <h1 className={styles.displayName}>{user.username}</h1>
                <span className={styles.roleTag}>
                  <FiAward /> {user.role || 'Member'}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <FiMail /> {user.email}
                </span>
                <span className={styles.metaDivider}>•</span>
                <span className={styles.metaItem}>
                  <FiCalendar /> Joined{' '}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </span>
              </div>

              {/* Bio */}
              <p className={styles.bioText}>
                {user.bio || 'No bio added yet. Tell the CodeCraft community about what you are building.'}
              </p>

              {/* Tags/Pills */}
              <div className={styles.tagGroup}>
                {user.experience_level && (
                  <span className={styles.metaPill}>
                    <FiCompass /> {user.experience_level}
                  </span>
                )}
                {user.preferred_pricing && user.preferred_pricing !== 'any' && (
                  <span className={styles.metaPill}>
                    <FiDollarSign /> {user.preferred_pricing} budget
                  </span>
                )}
                {user.preferred_platforms && user.preferred_platforms.length > 0 && (
                  <span className={styles.metaPill}>
                    <FiMonitor /> {user.preferred_platforms.slice(0, 2).join(', ')}
                    {user.preferred_platforms.length > 2 ? ` +${user.preferred_platforms.length - 2}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.actionsBlock}>
              <button
                type="button"
                onClick={handleOpenEdit}
                className={styles.editProfileBtn}
                title="Edit Profile"
                suppressHydrationWarning
              >
                <FiEdit3 /> Edit Profile
              </button>
              <button
                type="button"
                onClick={handleShareProfile}
                className={styles.shareProfileBtn}
                title="Share Profile"
                suppressHydrationWarning
              >
                {copiedLink ? <><FiCheck /> Copied!</> : <><FiShare2 /> Share</>}
              </button>
              <Link href="/studio" className={styles.studioLink} title="Studio Workspace">
                <FiCpu /> Studio
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Metric Counter Cards */}
      <div className={styles.metricsGrid}>
        <div
          className={`${styles.metricCard} ${activeTab === 'saved' && savedSubTab === 'tools' ? styles.metricActive : ''}`}
          onClick={() => { setActiveTab('saved'); setSavedSubTab('tools'); }}
          role="button"
          tabIndex={0}
        >
          <div className={`${styles.metricIconBox} ${styles.iconIndigo}`}>
            <FiBookmark />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricNumber}>{stats.bookmarksCount}</span>
            <span className={styles.metricTitle}>Saved Tools</span>
            <span className={styles.metricSubtitle}>Curated tools</span>
          </div>
        </div>

        <div
          className={`${styles.metricCard} ${activeTab === 'saved' && savedSubTab === 'knowledge' ? styles.metricActive : ''}`}
          onClick={() => { setActiveTab('saved'); setSavedSubTab('knowledge'); }}
          role="button"
          tabIndex={0}
        >
          <div className={`${styles.metricIconBox} ${styles.iconEmerald}`}>
            <FiTarget />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricNumber}>{stats.savedPromptsCount || initialData.savedPrompts?.length || 0}</span>
            <span className={styles.metricTitle}>AI Knowledge</span>
            <span className={styles.metricSubtitle}>Prompts &amp; guides</span>
          </div>
        </div>

        <div
          className={`${styles.metricCard} ${activeTab === 'recommendations' ? styles.metricActive : ''}`}
          onClick={() => setActiveTab('recommendations')}
          role="button"
          tabIndex={0}
        >
          <div className={`${styles.metricIconBox} ${styles.iconAmber}`}>
            <FiZap />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricNumber}>{recommendedTools.length}</span>
            <span className={styles.metricTitle}>Recommendations</span>
            <span className={styles.metricSubtitle}>Matched to your stack</span>
          </div>
        </div>

        <div
          className={`${styles.metricCard} ${activeTab === 'contributions' ? styles.metricActive : ''}`}
          onClick={() => setActiveTab('contributions')}
          role="button"
          tabIndex={0}
        >
          <div className={`${styles.metricIconBox} ${styles.iconRose}`}>
            <FiLayers />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricNumber}>{stats.contributionsCount || allSubmissions.length}</span>
            <span className={styles.metricTitle}>Contributions</span>
            <span className={styles.metricSubtitle}>Submissions &amp; reviews</span>
          </div>
        </div>

        <div
          className={`${styles.metricCard} ${activeTab === 'settings' ? styles.metricActive : ''}`}
          onClick={() => setActiveTab('settings')}
          role="button"
          tabIndex={0}
        >
          <div className={`${styles.metricIconBox} ${styles.iconSky}`}>
            <FiCode />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricNumber}>{totalStackPreferencesCount || 'Set'}</span>
            <span className={styles.metricTitle}>Stack &amp; Goals</span>
            <span className={styles.metricSubtitle}>Personalize toolkit</span>
          </div>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className={styles.tabsPanel}>
        <div className={styles.tabNavbar}>
          <button
            type="button"
            className={`${styles.tabLink} ${activeTab === 'saved' ? styles.activeTabLink : ''}`}
            onClick={() => setActiveTab('saved')}
            suppressHydrationWarning
          >
            <FiBookmark /> Saved Items
            <span className={styles.tabBadge}>{totalSavedCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabLink} ${activeTab === 'recommendations' ? styles.activeTabLink : ''}`}
            onClick={() => setActiveTab('recommendations')}
            suppressHydrationWarning
          >
            <FiZap /> Recommendations
            <span className={styles.tabBadge}>{recommendedTools.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabLink} ${activeTab === 'contributions' ? styles.activeTabLink : ''}`}
            onClick={() => setActiveTab('contributions')}
            suppressHydrationWarning
          >
            <FiLayers /> My Contributions
            <span className={styles.tabBadge}>{allSubmissions.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabLink} ${activeTab === 'settings' ? styles.activeTabLink : ''}`}
            onClick={() => setActiveTab('settings')}
            suppressHydrationWarning
          >
            <FiSettings /> Personalization &amp; Stack
          </button>
        </div>

        {/* Tab Panes */}
        <div className={styles.tabPaneContainer}>
          {/* TAB 1: Saved Items */}
          {activeTab === 'saved' && (
            <div className={styles.savedSectionWrapper}>
              <div className={styles.subFilterBar}>
                <button
                  type="button"
                  className={`${styles.subFilterPill} ${savedSubTab === 'tools' ? styles.activeSubFilter : ''}`}
                  onClick={() => setSavedSubTab('tools')}
                >
                  <FiBookmark /> Saved Tools ({stats.bookmarksCount})
                </button>
                <button
                  type="button"
                  className={`${styles.subFilterPill} ${savedSubTab === 'knowledge' ? styles.activeSubFilter : ''}`}
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

          {/* TAB 2: Recommended For You */}
          {activeTab === 'recommendations' && (
            <div className={styles.recommendationsSection}>
              <div className={styles.sectionHeaderBox}>
                <div>
                  <h2 className={styles.sectionTitle}>Personalized AI Recommendations</h2>
                  <p className={styles.sectionDescription}>
                    Tailored tools matched dynamically to your role (<strong>{user.role || 'Developer'}</strong>), experience (<strong>{user.experience_level || 'Intermediate'}</strong>), and active stack focus.
                  </p>
                </div>
                <Link href="/build-toolkit" className={styles.toolkitBuilderBtn}>
                  <FiZap /> Open Toolkit Builder &rarr;
                </Link>
              </div>

              {recommendedTools.length > 0 ? (
                <div className={styles.recommendedGrid}>
                  {recommendedTools.map((tool) => (
                    <div key={tool.id || tool.slug} className={styles.recommendationCard}>
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
                <div className={styles.emptyStateBox}>
                  <div className={styles.emptyIconBox}><FiCompass /></div>
                  <h3>No Recommendations Yet</h3>
                  <p>Configure your personalization preferences and tech stack to unlock customized recommendations.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={styles.primaryActionButton}
                  >
                    Configure Preferences &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: My Contributions */}
          {activeTab === 'contributions' && (
            <div className={styles.contributionsSection}>
              <div className={styles.sectionHeaderBox}>
                <div>
                  <h2 className={styles.sectionTitle}>Community Contributions</h2>
                  <p className={styles.sectionDescription}>
                    Track the status of AI tools and prompts you have submitted to the CodeCraft catalog.
                  </p>
                </div>
                <Link href="/community" className={styles.toolkitBuilderBtn}>
                  + Submit New Tool or Prompt
                </Link>
              </div>

              {allSubmissions.length > 0 ? (
                <div className={styles.submissionsList}>
                  {allSubmissions.map((sub) => (
                    <article key={sub.id} className={styles.submissionCard}>
                      <div className={styles.submissionCardHeader}>
                        <div className={styles.submissionBadges}>
                          <span className={styles.subKindBadge}>
                            {sub.kind === 'tool' ? 'AI Tool' : (sub.type || 'Prompt')}
                          </span>
                          <span className={styles.subCategoryBadge}>{sub.category}</span>
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

                      <h3 className={styles.submissionTitle}>{sub.kind === 'tool' ? sub.tool_name : sub.title}</h3>
                      <p className={styles.submissionDesc}>{sub.description}</p>

                      {sub.website && (
                        <a
                          href={sub.website}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.submissionLink}
                        >
                          Visit Website <FiExternalLink />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateBox}>
                  <div className={styles.emptyIconBox}><FiLayers /></div>
                  <h3>No Contributions Yet</h3>
                  <p>You haven't submitted any AI tools or prompts to the catalog yet.</p>
                  <Link href="/community" className={styles.primaryActionButton}>
                    Submit a Tool or Prompt &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Personalization & Preferences */}
          {activeTab === 'settings' && (
            <div className={styles.settingsSection}>
              <div className={styles.sectionHeaderBox}>
                <div>
                  <h2 className={styles.sectionTitle}>Personalization &amp; Stack Preferences</h2>
                  <p className={styles.sectionDescription}>
                    Customize your developer profile to power personalized tool recommendations, workflow presets, and search filters.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePreferences} className={styles.preferencesForm}>
                <div className={styles.preferenceGroupCard}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiUser /></div>
                    <div>
                      <h3>Primary Role</h3>
                      <p>Select the role that best matches your daily work.</p>
                    </div>
                  </div>
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

                <div className={styles.preferenceGroupCard}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiCompass /></div>
                    <div>
                      <h3>Experience Level</h3>
                      <p>Helps us recommend beginner-friendly or advanced pro tooling.</p>
                    </div>
                  </div>
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

                <div className={styles.preferenceGroupCard}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiZap /></div>
                    <div>
                      <h3>Focus Areas &amp; Interests</h3>
                      <p>Choose the domains you actively work in or want to explore.</p>
                    </div>
                  </div>
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

                <div className={styles.preferenceGroupCard}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiCode /></div>
                    <div>
                      <h3>Technologies in Your Stack</h3>
                      <p>Tools and libraries you use regularly for code generation and agent support.</p>
                    </div>
                  </div>
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

                <div className={styles.preferenceGroupCard}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiTarget /></div>
                    <div>
                      <h3>Primary Goals</h3>
                      <p>What do you want AI tools to accomplish for your workflow?</p>
                    </div>
                  </div>
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

                <div className={styles.preferenceGroupCard}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiDollarSign /></div>
                    <div>
                      <h3>Pricing Preference</h3>
                      <p>Filter tool recommendations by your pricing tier.</p>
                    </div>
                  </div>
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

                <div className={styles.preferenceGroupCard}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiMonitor /></div>
                    <div>
                      <h3>Preferred Platforms</h3>
                      <p>Target platforms for your preferred developer environments.</p>
                    </div>
                  </div>
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

                {/* Session & Notifications */}
                <div className={styles.securityBox}>
                  <div className={styles.groupHeading}>
                    <div className={styles.groupIconBox}><FiMail /></div>
                    <div>
                      <h3>Account &amp; Session</h3>
                      <p>You are signed in as <strong>{user.email}</strong>.</p>
                    </div>
                  </div>
                  <label className={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    />
                    <span>Email updates when your submitted tool or prompt is reviewed</span>
                  </label>
                  <Link href="/login" className={styles.secLink}>
                    Manage Credentials / Switch Account &rarr;
                  </Link>
                </div>

                {prefFeedback && (
                  <div className={styles.feedbackAlert}>
                    <FiCheckCircle /> {prefFeedback}
                  </div>
                )}
                {prefError && (
                  <div className={styles.errorAlert}>
                    <FiAlertCircle /> {prefError}
                  </div>
                )}

                <div className={styles.formStickyAction}>
                  <button
                    type="submit"
                    disabled={savingPrefs}
                    className={styles.savePrefsButton}
                    suppressHydrationWarning
                  >
                    {savingPrefs ? 'Saving Preferences...' : 'Save Personalization Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className={styles.modalOverlay} onClick={() => !saving && setIsEditing(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>
                <FiEdit3 />
                <h3 id="edit-profile-title">Edit Profile</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => !saving && setIsEditing(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className={styles.modalBody}>
              {/* Live Avatar Preview */}
              <div className={styles.modalAvatarPreviewBox}>
                <div className={styles.modalAvatarDisplay}>
                  <UserAvatar
                    avatarUrl={formData.avatar_url}
                    username={formData.username || 'User'}
                    size="xl"
                  />
                </div>
                <div className={styles.modalAvatarInfo}>
                  <h4>{formData.username || 'Your Name'}</h4>
                  <p>Choose an avatar preset below to represent your identity.</p>
                </div>
              </div>

              {/* Avatar Picker */}
              <div className={styles.avatarPickerWrapper}>
                <AvatarPicker
                  selectedAvatarId={formData.avatar_url}
                  onSelect={(avatarId) => setFormData((prev) => ({ ...prev, avatar_url: avatarId }))}
                  label="Select Preset Avatar"
                />
              </div>

              {/* Username field */}
              <div className={styles.inputGroup}>
                <div className={styles.inputLabelRow}>
                  <label htmlFor="input-username">Username</label>
                  <span className={styles.charCount}>{formData.username.length} / 50</span>
                </div>
                <input
                  id="input-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. alex_developer"
                  required
                  minLength={2}
                  maxLength={50}
                  className={styles.textInput}
                />
              </div>

              {/* Bio field */}
              <div className={styles.inputGroup}>
                <div className={styles.inputLabelRow}>
                  <label htmlFor="input-bio">Bio &amp; Summary</label>
                  <span className={styles.charCount}>{(formData.bio || '').length} / 500</span>
                </div>
                <textarea
                  id="input-bio"
                  rows="3"
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell the community about what you build, your tech stack, or interests..."
                  maxLength={500}
                  className={styles.textareaInput}
                />
              </div>

              {/* Alerts */}
              {saveError && (
                <div className={styles.errorAlert}>
                  <FiAlertCircle /> {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className={styles.feedbackAlert}>
                  <FiCheckCircle /> Profile saved successfully!
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveProfileButton}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
