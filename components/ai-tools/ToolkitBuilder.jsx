'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiArrowRight, FiCheck, FiRefreshCw, FiShare2, FiBookmark } from 'react-icons/fi';
import BookmarkButton, { invalidateBookmarksCache } from './BookmarkButton';
import {
  buildToolkitRecommendations,
  TOOLKIT_GOALS,
  TOOLKIT_EXPERIENCE_OPTIONS,
  TOOLKIT_BUDGET_OPTIONS,
  TOOLKIT_PRIMARY_GOAL_OPTIONS,
} from '../../lib/toolkit-recommender';
import styles from './ToolkitBuilder.module.scss';

const STEPS = [
  { id: 'goal', label: 'Your project' },
  { id: 'experience', label: 'Experience' },
  { id: 'budget', label: 'Budget' },
  { id: 'primaryGoal', label: 'Priority' },
];

const INITIAL_SELECTION = { goalId: '', experience: 'any', budget: 'any', primaryGoal: 'speed' };

function SelectionOptions({ options, value, onChange, name }) {
  return (
    <div className={styles.options} role="group" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`${styles.option} ${value === option.id ? styles.selected : ''}`}
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          suppressHydrationWarning
        >
          <span>{option.label}</span>
          {value === option.id && <FiCheck aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

function RecommendationCard({ tool }) {
  return (
    <article className={styles.toolCard}>
      <div className={styles.toolIdentity}>
        {(tool.logoImageUrl || tool.logo) ? (
          <img
            src={tool.logoImageUrl || tool.logo}
            alt={`${tool.name} logo`}
            className={styles.logo}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.logoFallback}>{tool.name.charAt(0)}</span>
        )}
        <div>
          <h3>{tool.name}</h3>
          <span className={styles.fit}>{tool.fitLabel}</span>
        </div>
      </div>
      <p className={styles.reason}>{tool.fitReason}</p>
      <div className={styles.toolActions}>
        <Link href={`/ai-tools/tool/${tool.slug}`} className={styles.detailsLink}>
          View details <FiArrowRight aria-hidden="true" />
        </Link>
        <BookmarkButton slug={tool.slug} showLabel />
      </div>
    </article>
  );
}

export default function ToolkitBuilder({ tools }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selection, setSelection] = useState(() => ({
    goalId: searchParams.get('goal') || '',
    experience: searchParams.get('exp') || 'any',
    budget: searchParams.get('budget') || 'any',
    primaryGoal: searchParams.get('pri') || 'speed',
  }));

  const [step, setStep] = useState(() => (searchParams.get('goal') ? STEPS.length - 1 : 0));
  const [shareToast, setShareToast] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);

  const recommendations = buildToolkitRecommendations(tools, selection);
  const currentStep = STEPS[step];
  const canContinue = currentStep.id !== 'goal' || Boolean(selection.goalId);

  const updateSelection = (key, value) => setSelection((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setSelection(INITIAL_SELECTION);
    setStep(0);
    router.push('/build-toolkit', { scroll: false });
  };

  const handleShareStack = () => {
    const params = new URLSearchParams();
    if (selection.goalId) params.set('goal', selection.goalId);
    if (selection.experience) params.set('exp', selection.experience);
    if (selection.budget) params.set('budget', selection.budget);
    if (selection.primaryGoal) params.set('pri', selection.primaryGoal);

    const shareUrl = `${window.location.origin}/build-toolkit?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareToast('Shareable stack link copied to clipboard!');
      setTimeout(() => setShareToast(''), 3000);
    });
  };

  const handleSaveEntireStack = async () => {
    if (savingBatch || !recommendations.groups) return;
    setSavingBatch(true);
    const allRecommendedSlugs = recommendations.groups.flatMap((g) => g.tools.map((t) => t.slug));

    try {
      await Promise.all(
        allRecommendedSlugs.map((slug) =>
          fetch('/api/user/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool_slug: slug, action: 'save' }),
          })
        )
      );
      invalidateBookmarksCache();
      setShareToast(`Saved ${allRecommendedSlugs.length} tools to your profile!`);
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
          <span className={styles.eyebrow}>Based on your work</span>
          <h1>Build Your Toolkit</h1>
          <p>Tell us what you are making. We will assemble a focused workflow from the tools in the directory.</p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">01</div>
      </header>

      <div className={styles.workspace}>
        <section className={styles.builder} aria-labelledby="builder-title">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.stepCount}>Step {step + 1} of {STEPS.length}</span>
              <h2 id="builder-title">{currentStep.label}</h2>
            </div>
            <button
              type="button"
              className={styles.resetButton}
              onClick={reset}
              title="Start over"
              suppressHydrationWarning
            >
              <FiRefreshCw aria-hidden="true" /> Reset
            </button>
          </div>
          <div className={styles.progress} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((item, index) => (
              <span
                key={item.id}
                className={`${styles.progressStep} ${index <= step ? styles.progressActive : ''}`}
              />
            ))}
          </div>

          {currentStep.id === 'goal' && (
            <SelectionOptions
              options={TOOLKIT_GOALS}
              value={selection.goalId}
              onChange={(value) => updateSelection('goalId', value)}
              name="Project goal"
            />
          )}
          {currentStep.id === 'experience' && (
            <SelectionOptions
              options={TOOLKIT_EXPERIENCE_OPTIONS}
              value={selection.experience}
              onChange={(value) => updateSelection('experience', value)}
              name="Experience level"
            />
          )}
          {currentStep.id === 'budget' && (
            <SelectionOptions
              options={TOOLKIT_BUDGET_OPTIONS}
              value={selection.budget}
              onChange={(value) => updateSelection('budget', value)}
              name="Budget"
            />
          )}
          {currentStep.id === 'primaryGoal' && (
            <SelectionOptions
              options={TOOLKIT_PRIMARY_GOAL_OPTIONS}
              value={selection.primaryGoal}
              onChange={(value) => updateSelection('primaryGoal', value)}
              name="Primary goal"
            />
          )}

          <div className={styles.navigation}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => setStep((current) => current - 1)}
              disabled={step === 0}
              suppressHydrationWarning
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className={styles.nextButton}
                onClick={() => setStep((current) => current + 1)}
                disabled={!canContinue}
                suppressHydrationWarning
              >
                Continue <FiArrowRight aria-hidden="true" />
              </button>
            ) : (
              <a href="#recommendations" className={styles.nextButton}>
                See my toolkit <FiArrowRight aria-hidden="true" />
              </a>
            )}
          </div>
        </section>

        <section className={styles.results} id="recommendations" aria-live="polite">
          <div className={styles.resultsHeader}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className={styles.eyebrow}>Your recommended workflow</span>
                <h2>{recommendations.ready ? recommendations.selectedGoal.label : 'Your toolkit will appear here'}</h2>
              </div>

              {recommendations.ready && recommendations.groups.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleShareStack}
                    className={styles.resetButton}
                    style={{ background: 'var(--bg-surface)', padding: '6px 12px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    suppressHydrationWarning
                  >
                    <FiShare2 /> Share Stack
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEntireStack}
                    disabled={savingBatch}
                    className={styles.resetButton}
                    style={{ background: 'var(--primary)', color: '#fff', padding: '6px 12px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    suppressHydrationWarning
                  >
                    <FiBookmark /> {savingBatch ? 'Saving...' : 'Save All Tools'}
                  </button>
                </div>
              )}
            </div>

            {shareToast && (
              <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#047857', borderRadius: '6px', marginTop: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ {shareToast}
              </div>
            )}

            <p>{recommendations.summary}</p>
          </div>

          {!recommendations.ready ? (
            <div className={styles.emptyState}>Choose a project above to start shaping your toolkit.</div>
          ) : recommendations.groups.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No strong matches yet</h3>
              <p>There are not enough tools in the current catalog for this workflow. Try another project or preference combination.</p>
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