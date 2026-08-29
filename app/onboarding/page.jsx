'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import {
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiUser,
  FiCompass,
  FiCode,
  FiTarget,
  FiDollarSign,
  FiMonitor,
  FiZap
} from 'react-icons/fi';
import styles from './page.module.scss';

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
  { id: 'Beginner', label: 'Beginner', desc: 'Exploring AI tools & fundamentals' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Building projects & shipping apps' },
  { id: 'Advanced', label: 'Advanced', desc: 'Architecting complex systems & workflows' }
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

export default function OnboardingPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [role, setRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [pricingPreference, setPricingPreference] = useState('any');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/onboarding');
        return;
      }

      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const { user: profile } = await res.json();
          if (profile.role) setRole(profile.role);
          if (profile.experience_level) setExperienceLevel(profile.experience_level);
          if (profile.interests?.length) setSelectedInterests(profile.interests);
          if (profile.technologies?.length) setSelectedTechnologies(profile.technologies);
          if (profile.goals?.length) setSelectedGoals(profile.goals);
          if (profile.preferred_pricing) setPricingPreference(profile.preferred_pricing);
          if (profile.preferred_platforms?.length) setSelectedPlatforms(profile.preferred_platforms);
        }
      } catch (err) {
        console.error('Failed to load profile for onboarding:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router, supabase]);

  const toggleArrayItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSaveAndComplete = async (isSkip = false) => {
    setSaving(true);
    setError(null);
    try {
      const payload = isSkip
        ? { onboarding_completed: true }
        : {
            role,
            experience_level: experienceLevel,
            interests: selectedInterests,
            technologies: selectedTechnologies,
            goals: selectedGoals,
            preferred_pricing: pricingPreference,
            preferred_platforms: selectedPlatforms,
            onboarding_completed: true,
          };

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.replace('/profile');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save preferences.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while saving preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your personalization workspace...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Progress Bar & Header */}
        <div className={styles.header}>
          <div className={styles.progressTracker}>
            <div className={styles.stepsIndicator}>
              <span className={step >= 1 ? styles.activeStep : ''}>1. Role & Level</span>
              <span className={step >= 2 ? styles.activeStep : ''}>2. Focus & Skills</span>
              <span className={step >= 3 ? styles.activeStep : ''}>3. Preferences</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
          <h1 className={styles.title}>Personalize Your CodeCraft Experience</h1>
          <p className={styles.subtitle}>
            Help us tailor AI tool suggestions, workflow blueprints, and catalog recommendations for you.
          </p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Step 1: Role & Experience */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <FiUser /> What best describes your primary role?
              </label>
              <div className={styles.pillGrid}>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`${styles.selectionPill} ${role === r ? styles.selected : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {role === r && <FiCheck className={styles.checkIcon} />}
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <FiCompass /> What is your experience level?
              </label>
              <div className={styles.cardsGrid}>
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <div
                    key={lvl.id}
                    className={`${styles.levelCard} ${experienceLevel === lvl.id ? styles.selectedCard : ''}`}
                    onClick={() => setExperienceLevel(lvl.id)}
                  >
                    <div className={styles.levelHeader}>
                      <strong>{lvl.label}</strong>
                      {experienceLevel === lvl.id && <FiCheck className={styles.checkIcon} />}
                    </div>
                    <p>{lvl.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Interests, Technologies & Goals */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <FiZap /> Work areas &amp; interests (select all that apply):
              </label>
              <div className={styles.pillGrid}>
                {INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleArrayItem(selectedInterests, setSelectedInterests, interest)}
                    >
                      {isSelected && <FiCheck className={styles.checkIcon} />}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <FiCode /> Technologies &amp; tools in your stack:
              </label>
              <div className={styles.pillGrid}>
                {TECHNOLOGIES.map((tech) => {
                  const isSelected = selectedTechnologies.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleArrayItem(selectedTechnologies, setSelectedTechnologies, tech)}
                    >
                      {isSelected && <FiCheck className={styles.checkIcon} />}
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <FiTarget /> What are your primary goals?
              </label>
              <div className={styles.pillGrid}>
                {GOALS.map((goal) => {
                  const isSelected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleArrayItem(selectedGoals, setSelectedGoals, goal)}
                    >
                      {isSelected && <FiCheck className={styles.checkIcon} />}
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preferred Pricing & Platforms */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <FiDollarSign /> Budget / Pricing preference:
              </label>
              <div className={styles.pillGrid}>
                {PRICING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${styles.selectionPill} ${pricingPreference === opt.id ? styles.selected : ''}`}
                    onClick={() => setPricingPreference(opt.id)}
                  >
                    {pricingPreference === opt.id && <FiCheck className={styles.checkIcon} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <FiMonitor /> Preferred platforms &amp; environments:
              </label>
              <div className={styles.pillGrid}>
                {PLATFORMS.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      className={`${styles.selectionPill} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleArrayItem(selectedPlatforms, setSelectedPlatforms, plat)}
                    >
                      {isSelected && <FiCheck className={styles.checkIcon} />}
                      {plat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.skipBtn}
            onClick={() => handleSaveAndComplete(true)}
            disabled={saving}
          >
            Skip for now
          </button>

          <div className={styles.rightActions}>
            {step > 1 && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(step - 1)}
                disabled={saving}
              >
                <FiArrowLeft /> Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setStep(step + 1)}
              >
                Continue <FiArrowRight />
              </button>
            ) : (
              <button
                type="button"
                className={styles.finishBtn}
                onClick={() => handleSaveAndComplete(false)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Complete & View Profile'} <FiCheck />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
