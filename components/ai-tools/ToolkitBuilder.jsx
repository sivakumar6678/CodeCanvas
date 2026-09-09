'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiRefreshCw,
  FiShare2,
  FiBookmark,
  FiZap,
  FiLayers,
  FiStar,
  FiUser,
  FiCode,
  FiDollarSign,
  FiMonitor,
} from 'react-icons/fi';
import BookmarkButton, { invalidateBookmarksCache } from './BookmarkButton';
import {
  buildToolkitRecommendations,
  TOOLKIT_GOALS,
  TOOLKIT_ROLES,
  TOOLKIT_EXPERIENCE_OPTIONS,
  TOOLKIT_BUDGET_OPTIONS,
  TOOLKIT_TECHNOLOGIES,
  TOOLKIT_PLATFORMS,
} from '../../lib/toolkit-recommender';
import styles from './ToolkitBuilder.module.scss';

const STEPS = [
  { id: 'goal', label: '1. What are you building?', icon: FiZap },
  { id: 'role', label: '2. Your Role & Experience', icon: FiUser },
  { id: 'tech', label: '3. Technologies & Stack', icon: FiCode },
  { id: 'budget', label: '4. Budget & Platforms', icon: FiDollarSign },
];

function deriveInitialGoal(userProfile, paramGoal) {
  if (paramGoal) return paramGoal;
  if (userProfile?.goals && Array.isArray(userProfile.goals) && userProfile.goals.length > 0) {
    const gText = userProfile.goals.join(' ').toLowerCase();
    if (gText.includes('saas') || gText.includes('mvp')) return 'build-saas';
    if (gText.includes('agent') || gText.includes('ai')) return 'build-ai-app';
    if (gText.includes('ui') || gText.includes('design')) return 'design-ui';
    if (gText.includes('automate')) return 'automate-workflows';
  }
  return 'build-website';
}

function TierBadge({ tier = 'exact' }) {
  if (tier === 'exact') {
    return (
      <span className={`${styles.tierBadge} ${styles.tierExact}`}>
        <FiCheckCircle aria-hidden="true" /> Exact Match
      </span>
    );
  }
  if (tier === 'category') {
    return (
      <span className={`${styles.tierBadge} ${styles.tierCategory}`}>
        <FiLayers aria-hidden="true" /> Category Match
      </span>
    );
  }
  return (
    <span className={`${styles.tierBadge} ${styles.tierPopular}`}>
      <FiStar aria-hidden="true" /> Popular Tool
    </span>
  );
}

function RecommendationCard({ tool = {} }) {
  const logo = tool.logoImageUrl || tool.logo;

  return (
    <article className={styles.toolCard}>
      <div className={styles.toolHeader}>
        <div className={styles.toolIdentity}>
          {logo ? (
            <img
              src={logo}
              alt={`${tool.name || 'Tool'} logo`}
              className={styles.logo}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.logoFallback}>{(tool.name || 'T').charAt(0)}</span>
          )}
          <div>
            <div className={styles.titleRow}>
              <h3>{tool.name}</h3>
              <TierBadge tier={tool.tier} />
            </div>
            <span className={styles.subCat}>
              {tool.category?.replace(/^ai-/, '')} &bull; {tool.subCategory?.replace(/-/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <p className={styles.reason}>{tool.fitReason}</p>

      {Array.isArray(tool.matchHighlights) && tool.matchHighlights.length > 0 && (
        <div className={styles.highlights}>
          {tool.matchHighlights.map((hl) => (
            <span key={hl} className={styles.highlightPill}>
              {hl}
            </span>
          ))}
          <span className={styles.pricingPill}>{tool.pricingModel}</span>
        </div>
      )}

      <div className={styles.toolActions}>
        <Link href={`/ai-tools/tool/${tool.slug}`} className={styles.detailsLink}>
          View details <FiArrowRight aria-hidden="true" />
        </Link>
        <BookmarkButton slug={tool.slug} showLabel />
      </div>
    </article>
  );
}

export default function ToolkitBuilder({
  tools = [],
  userProfile = null,
  savedToolSlugs = [],
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialGoal = deriveInitialGoal(userProfile, searchParams.get('goal'));
  const initialRole = searchParams.get('role') || userProfile?.role || 'Developer';
  const initialExperience = searchParams.get('exp') || (userProfile?.experience_level || 'intermediate').toLowerCase();
  const initialBudget = searchParams.get('budget') || userProfile?.preferred_pricing || 'any';
  const initialTechnologies = useMemo(() => {
    const paramTech = searchParams.get('tech');
    if (paramTech) return paramTech.split(',');
    if (userProfile?.technologies && Array.isArray(userProfile.technologies)) {
      return userProfile.technologies;
    }
    return ['React / Next.js', 'VS Code'];
  }, [searchParams, userProfile]);

  const initialPlatforms = useMemo(() => {
    const paramPlat = searchParams.get('plat');
    if (paramPlat) return paramPlat.split(',');
    if (userProfile?.preferred_platforms && Array.isArray(userProfile.preferred_platforms)) {
      return userProfile.preferred_platforms;
    }
    return ['Web'];
  }, [searchParams, userProfile]);

  const [selection, setSelection] = useState({
    goalId: initialGoal,
    role: initialRole,
    experience: initialExperience,
    budget: initialBudget,
    technologies: initialTechnologies,
    platforms: initialPlatforms,
  });

  const [step, setStep] = useState(0);
  const [shareToast, setShareToast] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);

  // Recommendations calculated via deterministic rule-based engine
  const recommendations = useMemo(() => {
    return buildToolkitRecommendations(tools, selection);
  }, [tools, selection]);

  const currentStep = STEPS[step] || STEPS[0];

  const updateField = (key, value) => {
    setSelection((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, item) => {
    setSelection((prev) => {
      const currentList = prev[key] || [];
      const exists = currentList.includes(item);
      const updated = exists
        ? currentList.filter((x) => x !== item)
        : [...currentList, item];
      return { ...prev, [key]: updated };
    });
  };

  const resetToDefaults = () => {
    setSelection({
      goalId: 'build-website',
      role: 'Developer',
      experience: 'intermediate',
      budget: 'any',
      technologies: ['React / Next.js', 'VS Code'],
      platforms: ['Web'],
    });
    setStep(0);
    router.push('/build-toolkit', { scroll: false });
  };

  const resetToProfile = () => {
    if (!userProfile) return;
    setSelection({
      goalId: deriveInitialGoal(userProfile, null),
      role: userProfile.role || 'Developer',
      experience: (userProfile.experience_level || 'intermediate').toLowerCase(),
      budget: userProfile.preferred_pricing || 'any',
      technologies: userProfile.technologies || ['React / Next.js'],
      platforms: userProfile.preferred_platforms || ['Web'],
    });
    setShareToast('Reset criteria to your profile preferences!');
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleShareStack = () => {
    const params = new URLSearchParams();
    if (selection.goalId) params.set('goal', selection.goalId);
    if (selection.role) params.set('role', selection.role);
    if (selection.experience) params.set('exp', selection.experience);
    if (selection.budget) params.set('budget', selection.budget);
    if (selection.technologies.length) params.set('tech', selection.technologies.join(','));
    if (selection.platforms.length) params.set('plat', selection.platforms.join(','));

    const shareUrl = `${window.location.origin}/build-toolkit?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareToast('Shareable stack link copied to clipboard!');
      setTimeout(() => setShareToast(''), 3000);
    });
  };

  const handleSaveEntireStack = async () => {
    if (savingBatch || !recommendations.matchingTools || recommendations.matchingTools.length === 0) return;
    setSavingBatch(true);
    const slugsToSave = recommendations.matchingTools.map((t) => t.slug);

    try {
      await Promise.all(
        slugsToSave.map((slug) =>
          fetch('/api/user/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool_slug: slug, action: 'save' }),
          })
        )
      );
      invalidateBookmarksCache();
      setShareToast(`Successfully saved all ${slugsToSave.length} tools to your profile!`);
      setTimeout(() => setShareToast(''), 3000);
    } catch (err) {
      console.error('Failed to save stack batch:', err);
    } finally {
      setSavingBatch(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrow}>Deterministic Recommendation Engine</span>
            {userProfile && (
              <span className={styles.profileBadge}>
                <FiCheck aria-hidden="true" /> Profile Synced
              </span>
            )}
          </div>
          <h1>Build Your Toolkit</h1>
          <p>
            Assemble a focused set of AI and developer tools tailored to your exact goal, role, and stack.
            Our rule-based engine matches direct use cases first, followed by category and versatile fallbacks.
          </p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">01</div>
      </header>

      <div className={styles.workspace}>
        {/* Left Column: Interactive Stepper Controls */}
        <section className={styles.builder} aria-labelledby="builder-title">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.stepCount}>Step {step + 1} of {STEPS.length}</span>
              <h2 id="builder-title">{currentStep.label}</h2>
            </div>
            <div className={styles.headerActions}>
              {userProfile && (
                <button
                  type="button"
                  className={styles.profileSyncBtn}
                  onClick={resetToProfile}
                  title="Reload preferences from profile"
                >
                  Sync Profile
                </button>
              )}
              <button
                type="button"
                className={styles.resetButton}
                onClick={resetToDefaults}
                title="Start over with defaults"
              >
                <FiRefreshCw aria-hidden="true" /> Reset
              </button>
            </div>
          </div>

          <div className={styles.progress} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.progressStep} ${index <= step ? styles.progressActive : ''}`}
                onClick={() => setStep(index)}
                title={`Jump to ${item.label}`}
              />
            ))}
          </div>

          {/* STEP 1: Goal / Work Type */}
          {step === 0 && (
            <div className={styles.goalGrid} role="radiogroup" aria-label="Project Goal">
              {TOOLKIT_GOALS.map((goal) => {
                const isSelected = selection.goalId === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    className={`${styles.goalCard} ${isSelected ? styles.goalSelected : ''}`}
                    onClick={() => updateField('goalId', goal.id)}
                    aria-checked={isSelected}
                    role="radio"
                  >
                    <div className={styles.goalHeader}>
                      <span className={styles.goalTitle}>{goal.label}</span>
                      {isSelected && <FiCheck className={styles.checkIcon} aria-hidden="true" />}
                    </div>
                    <p className={styles.goalDesc}>{goal.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2: Role & Experience */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>Primary Role</label>
                <div className={styles.pillsGrid}>
                  {TOOLKIT_ROLES.map((r) => {
                    const isSelected = selection.role.toLowerCase() === r.id.toLowerCase();
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`${styles.pillBtn} ${isSelected ? styles.pillSelected : ''}`}
                        onClick={() => updateField('role', r.id)}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>Experience Level</label>
                <div className={styles.optionsList}>
                  {TOOLKIT_EXPERIENCE_OPTIONS.map((opt) => {
                    const isSelected = selection.experience === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`${styles.optionRow} ${isSelected ? styles.optionSelected : ''}`}
                        onClick={() => updateField('experience', opt.id)}
                      >
                        <div>
                          <div className={styles.optionTitle}>{opt.label}</div>
                          {opt.desc && <div className={styles.optionDesc}>{opt.desc}</div>}
                        </div>
                        {isSelected && <FiCheck className={styles.checkIcon} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Technologies & Stack */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <p className={styles.stepHint}>
                Select technologies you plan to use. Direct matches will receive top priority in your toolkit.
              </p>
              <div className={styles.pillsGrid}>
                {TOOLKIT_TECHNOLOGIES.map((tech) => {
                  const isSelected = selection.technologies.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      className={`${styles.pillBtn} ${isSelected ? styles.pillSelected : ''}`}
                      onClick={() => toggleArrayItem('technologies', tech)}
                    >
                      {isSelected && <FiCheck className={styles.checkInline} />} {tech}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Budget & Platforms */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>Budget & Pricing Preference</label>
                <div className={styles.optionsList}>
                  {TOOLKIT_BUDGET_OPTIONS.map((opt) => {
                    const isSelected = selection.budget === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`${styles.optionRow} ${isSelected ? styles.optionSelected : ''}`}
                        onClick={() => updateField('budget', opt.id)}
                      >
                        <div>
                          <div className={styles.optionTitle}>{opt.label}</div>
                          {opt.desc && <div className={styles.optionDesc}>{opt.desc}</div>}
                        </div>
                        {isSelected && <FiCheck className={styles.checkIcon} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>Target Platforms</label>
                <div className={styles.pillsGrid}>
                  {TOOLKIT_PLATFORMS.map((plat) => {
                    const isSelected = selection.platforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        className={`${styles.pillBtn} ${isSelected ? styles.pillSelected : ''}`}
                        onClick={() => toggleArrayItem('platforms', plat)}
                      >
                        {isSelected && <FiCheck className={styles.checkInline} />} {plat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={styles.navigation}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              <FiArrowLeft aria-hidden="true" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className={styles.nextButton}
                onClick={() => setStep((current) => current + 1)}
              >
                Continue <FiArrowRight aria-hidden="true" />
              </button>
            ) : (
              <a href="#recommendations" className={styles.nextButton}>
                See My Toolkit <FiArrowRight aria-hidden="true" />
              </a>
            )}
          </div>
        </section>

        {/* Right Column: Recommendations & Results */}
        <section className={styles.results} id="recommendations" aria-live="polite">
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTopRow}>
              <div>
                <span className={styles.eyebrow}>Curated Workflow Stack</span>
                <h2>{recommendations.ready ? recommendations.selectedGoal?.label : 'Your toolkit'}</h2>
              </div>

              {recommendations.ready && recommendations.matchingTools?.length > 0 && (
                <div className={styles.batchActions}>
                  <button
                    type="button"
                    onClick={handleShareStack}
                    className={styles.actionBtnSecondary}
                    title="Copy shareable link"
                  >
                    <FiShare2 /> Share Stack
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEntireStack}
                    disabled={savingBatch}
                    className={styles.actionBtnPrimary}
                    title="Save all recommended tools to bookmarks"
                  >
                    <FiBookmark /> {savingBatch ? 'Saving...' : 'Save All Tools'}
                  </button>
                </div>
              )}
            </div>

            {shareToast && (
              <div className={styles.toastSuccess}>
                ✓ {shareToast}
              </div>
            )}

            <p className={styles.summaryText}>{recommendations.summary}</p>

            {/* Active criteria chips */}
            <div className={styles.activeCriteria}>
              <span className={styles.criteriaChip}>Role: {selection.role}</span>
              <span className={styles.criteriaChip}>Level: {selection.experience}</span>
              <span className={styles.criteriaChip}>Budget: {selection.budget}</span>
              {selection.technologies.slice(0, 3).map((t) => (
                <span key={t} className={styles.criteriaChip}>{t}</span>
              ))}
            </div>
          </div>

          {!recommendations.ready ? (
            <div className={styles.emptyState}>Choose a project above to start shaping your toolkit.</div>
          ) : recommendations.groups.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No matching tools found</h3>
              <p>No tools in the catalog matched the combination of constraints. Try broadening your budget or platform filters.</p>
              <Link href="/ai-tools" className={styles.catalogLink}>
                Browse the full directory <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className={styles.groups}>
              {recommendations.groups.map((group, index) => (
                <div key={group.purpose} className={styles.group}>
                  <div className={styles.groupHeading}>
                    <span className={styles.groupNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{group.title}</h3>
                      <p>{group.description}</p>
                    </div>
                  </div>
                  <div className={styles.toolList}>
                    {group.tools.map((tool) => (
                      <RecommendationCard key={tool.slug} tool={tool} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}