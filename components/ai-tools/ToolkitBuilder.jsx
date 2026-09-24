'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookmark,
  FiCheck,
  FiExternalLink,
  FiLayers,
  FiRefreshCw,
  FiShare2,
  FiSliders,
  FiTrash2,
} from 'react-icons/fi';
import BookmarkButton, { invalidateBookmarksCache } from './BookmarkButton';
import {
  buildToolkitWorkflow,
  TOOLKIT_BUDGET_OPTIONS,
  TOOLKIT_EXPERIENCE_OPTIONS,
  TOOLKIT_GOALS,
  TOOLKIT_PLATFORMS,
  TOOLKIT_ROLES,
  TOOLKIT_TECHNOLOGIES,
} from '../../lib/toolkit-recommender';
import styles from './ToolkitBuilder.module.scss';

const STEPS = [
  { id: 'goal', label: 'Goal' },
  { id: 'context', label: 'Context' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'tools', label: 'Tool Selection' },
  { id: 'review', label: 'Review Kit' },
];

function deriveGoal(profile, paramGoal) {
  if (paramGoal && TOOLKIT_GOALS.some((goal) => goal.id === paramGoal)) return paramGoal;
  const profileGoals = Array.isArray(profile?.goals) ? profile.goals.join(' ').toLowerCase() : '';
  if (profileGoals.includes('saas') || profileGoals.includes('mvp')) return 'build-saas';
  if (profileGoals.includes('design') || profileGoals.includes('ui')) return 'design-ui';
  if (profileGoals.includes('automate')) return 'automate-workflows';
  return '';
}

function ToolOption({ tool, selected, onSelect }) {
  const logo = tool.logoImageUrl || tool.logo;
  return (
    <article className={`${styles.kitToolOption} ${selected ? styles.kitToolSelected : ''}`}>
      <button type="button" className={styles.kitToolSelect} onClick={() => onSelect(tool.slug)} aria-pressed={selected}>
        <span className={styles.kitToolCheck}>{selected ? <FiCheck aria-hidden="true" /> : null}</span>
        {logo ? <img src={logo} alt="" className={styles.kitToolLogo} loading="lazy" referrerPolicy="no-referrer" /> : <span className={styles.kitToolFallback}>{(tool.name || 'T').charAt(0)}</span>}
        <span className={styles.kitToolCopy}>
          <strong>{tool.name}</strong>
          <small>{tool.pricingModel || tool.pricing || 'Catalog tool'}</small>
        </span>
      </button>
      <p>{tool.fitReason || 'Matches the metadata for this workflow stage.'}</p>
      <Link href={`/ai-tools/tool/${tool.slug}`} className={styles.kitViewLink}>View <FiExternalLink aria-hidden="true" /></Link>
    </article>
  );
}

export default function ToolkitBuilder({ tools = [], userProfile = null }) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [goalId, setGoalId] = useState(deriveGoal(userProfile, searchParams.get('goal')));
  const [customGoal, setCustomGoal] = useState(searchParams.get('goalText') || '');
  const [context, setContext] = useState({
    role: userProfile?.role || 'Developer',
    experience: (userProfile?.experience_level || 'intermediate').toLowerCase(),
    budget: userProfile?.preferred_pricing || 'any',
    platforms: Array.isArray(userProfile?.preferred_platforms) ? userProfile.preferred_platforms : ['Web'],
    technologies: Array.isArray(userProfile?.technologies) ? userProfile.technologies : [],
    priority: 'quality',
  });
  const [workflow, setWorkflow] = useState(null);
  const [selectedByStage, setSelectedByStage] = useState({});
  const [skippedStages, setSkippedStages] = useState([]);
  const [notice, setNotice] = useState('');

  const selection = useMemo(() => ({ goalId, currentGoal: customGoal, ...context }), [goalId, customGoal, context]);
  const selectedTools = useMemo(() => workflow?.stages
    .filter((stage) => !skippedStages.includes(stage.id))
    .map((stage) => stage.alternatives.find((tool) => tool.slug === selectedByStage[stage.id]))
    .filter(Boolean) || [], [workflow, selectedByStage, skippedStages]);

  const updateContext = (key, value) => setContext((current) => ({ ...current, [key]: value }));
  const toggleContextItem = (key, value) => setContext((current) => {
    const values = current[key] || [];
    return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
  });
  const chooseTool = (stageId, slug) => setSelectedByStage((current) => ({ ...current, [stageId]: slug }));
  const toggleStage = (stageId) => setSkippedStages((current) => current.includes(stageId) ? current.filter((id) => id !== stageId) : [...current, stageId]);

  const continueFromGoal = () => {
    if (!goalId && !customGoal.trim()) {
      setNotice('Choose a goal or enter a specific use case to continue.');
      return;
    }
    setNotice('');
    setStep(1);
  };

  const generateWorkflow = () => {
    setWorkflow(buildToolkitWorkflow(tools, selection));
    setSelectedByStage({});
    setSkippedStages([]);
    setNotice('');
    setStep(2);
  };

  const reset = () => {
    setStep(0);
    setGoalId('');
    setCustomGoal('');
    setWorkflow(null);
    setSelectedByStage({});
    setSkippedStages([]);
    setNotice('');
  };

  const saveKit = async () => {
    if (!selectedTools.length) return;
    await Promise.all(selectedTools.map((tool) => fetch('/api/user/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: tool.slug, action: 'save' }),
    })));
    invalidateBookmarksCache();
    setNotice(`Saved ${selectedTools.length} tool${selectedTools.length === 1 ? '' : 's'} to your profile.`);
  };

  const shareKit = () => {
    const params = new URLSearchParams();
    if (goalId) params.set('goal', goalId);
    if (customGoal) params.set('goalText', customGoal);
    navigator.clipboard.writeText(`${window.location.origin}/build-toolkit?${params.toString()}`);
    setNotice('Kit link copied to your clipboard.');
  };

  const compareHref = selectedTools.length > 1
    ? `/ai-tools/compare?tools=${selectedTools.map((tool) => tool.slug).join(',')}`
    : '/ai-tools/compare';

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Build Your Kit</span>
          <h1>A practical stack for the work ahead.</h1>
          <p>Choose a goal, shape the workflow, and select the tools that belong in your kit. Recommendations stay deterministic, transparent, and grounded in the catalog.</p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">KIT</div>
      </header>

      <div className={styles.kitStepper} aria-label="Build Your Kit steps">
        {STEPS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`${styles.kitStep} ${index === step ? styles.kitStepActive : ''} ${index < step ? styles.kitStepDone : ''}`}
            onClick={() => index <= step && setStep(index)}
          >
            <span>{index < step ? <FiCheck /> : index + 1}</span>
            {item.label}
          </button>
        ))}
      </div>

      {notice && <div className={styles.toastSuccess} role="status">{notice}</div>}

      <section className={styles.kitPanel}>
        {step === 0 && (
          <div className={styles.kitStepContent}>
            <div className={styles.kitHeading}><span className={styles.stepCount}>Step 1 of 5</span><h2>What are you trying to accomplish?</h2><p>Start with the outcome. You can refine the details next.</p></div>
            <div className={styles.kitGoalGrid}>
              {TOOLKIT_GOALS.map((goal) => (
                <button type="button" key={goal.id} className={`${styles.goalCard} ${goalId === goal.id ? styles.goalSelected : ''}`} onClick={() => { setGoalId(goal.id); setCustomGoal(''); }}>
                  <strong>{goal.label}</strong><span>{goal.description}</span>
                </button>
              ))}
            </div>
            <label className={styles.kitField}><span>Or describe your own goal</span><input value={customGoal} onChange={(event) => { setCustomGoal(event.target.value); setGoalId(''); }} placeholder="e.g. Launch a client portal with automated onboarding" /></label>
          </div>
        )}

        {step === 1 && (
          <div className={styles.kitStepContent}>
            <div className={styles.kitHeading}><span className={styles.stepCount}>Step 2 of 5</span><h2>What context should shape the kit?</h2><p>Everything here is optional. Use only what matters for this project.</p></div>
            <div className={styles.kitFormGrid}>
              <label className={styles.kitField}><span>Role</span><select value={context.role} onChange={(event) => updateContext('role', event.target.value)}>{TOOLKIT_ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
              <label className={styles.kitField}><span>Experience</span><select value={context.experience} onChange={(event) => updateContext('experience', event.target.value)}>{TOOLKIT_EXPERIENCE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
              <label className={styles.kitField}><span>Budget</span><select value={context.budget} onChange={(event) => updateContext('budget', event.target.value)}>{TOOLKIT_BUDGET_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
              <label className={styles.kitField}><span>Priority</span><select value={context.priority} onChange={(event) => updateContext('priority', event.target.value)}><option value="speed">Speed</option><option value="quality">Quality</option><option value="simplicity">Simplicity</option></select></label>
            </div>
            <div className={styles.kitChoiceSection}><span>Platforms</span><div className={styles.pillsGrid}>{TOOLKIT_PLATFORMS.map((platform) => <button type="button" key={platform} className={`${styles.pillBtn} ${context.platforms.includes(platform) ? styles.pillSelected : ''}`} onClick={() => toggleContextItem('platforms', platform)}>{context.platforms.includes(platform) && <FiCheck />} {platform}</button>)}</div></div>
            <div className={styles.kitChoiceSection}><span>Technologies</span><div className={styles.pillsGrid}>{TOOLKIT_TECHNOLOGIES.map((technology) => <button type="button" key={technology} className={`${styles.pillBtn} ${context.technologies.includes(technology) ? styles.pillSelected : ''}`} onClick={() => toggleContextItem('technologies', technology)}>{context.technologies.includes(technology) && <FiCheck />} {technology}</button>)}</div></div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.kitStepContent}>
            <div className={styles.kitHeading}><span className={styles.stepCount}>Step 3 of 5</span><h2>Your workflow</h2><p>These stages are generated from your goal and catalog metadata. Nothing is selected yet.</p></div>
            {!workflow?.stages?.length ? <div className={styles.emptyState}><FiSliders /><h3>No clear stages yet</h3><p>Try a more specific goal or broaden the context filters.</p></div> : <div className={styles.workflowList}>{workflow.stages.map((stage, index) => <article key={stage.id} className={`${styles.workflowCard} ${skippedStages.includes(stage.id) ? styles.workflowSkipped : ''}`}><div><span className={styles.groupNumber}>{String(index + 1).padStart(2, '0')}</span><div><h3>{stage.title}</h3><p>{stage.description}</p><small>{stage.alternatives.length} catalog alternative{stage.alternatives.length === 1 ? '' : 's'}</small></div></div><button type="button" className={styles.cardAction} onClick={() => toggleStage(stage.id)}>{skippedStages.includes(stage.id) ? 'Include stage' : 'Skip stage'}</button></article>)}</div>}
          </div>
        )}

        {step === 3 && (
          <div className={styles.kitStepContent}>
            <div className={styles.kitHeading}><span className={styles.stepCount}>Step 4 of 5</span><h2>Choose tools for each stage</h2><p>Select one alternative per included stage. You can edit these choices again in the review.</p></div>
            <div className={styles.workflowList}>{workflow?.stages.filter((stage) => !skippedStages.includes(stage.id)).map((stage) => <article key={stage.id} className={styles.selectionStage}><div className={styles.selectionStageHeader}><div><h3>{stage.title}</h3><p>{stage.description}</p></div><span>{selectedByStage[stage.id] ? 'Selected' : 'Choose one'}</span></div><div className={styles.toolOptionGrid}>{stage.alternatives.map((tool) => <ToolOption key={tool.slug} tool={tool} selected={selectedByStage[stage.id] === tool.slug} onSelect={(slug) => chooseTool(stage.id, slug)} />)}</div></article>)}</div>
            {workflow?.stages.every((stage) => skippedStages.includes(stage.id)) && <div className={styles.emptyState}><FiLayers /><h3>All stages are skipped</h3><p>Go back to Workflow and include at least one stage to build a kit.</p></div>}
          </div>
        )}

        {step === 4 && (
          <div className={styles.kitStepContent}>
            <div className={styles.kitHeading}><span className={styles.stepCount}>Step 5 of 5</span><h2>Your kit is ready to review</h2><p>{selectedTools.length ? 'Here is the workflow you assembled.' : 'Your kit is empty. Return to Tool Selection to choose alternatives.'}</p></div>
            {selectedTools.length ? <div className={styles.reviewKit}>{workflow.stages.filter((stage) => selectedTools.some((tool) => stage.alternatives.some((candidate) => candidate.slug === tool.slug))).map((stage) => { const tool = selectedTools.find((item) => stage.alternatives.some((candidate) => candidate.slug === item.slug)); return <article key={stage.id} className={styles.reviewStage}><div><span className={styles.groupNumber}>{stage.title.slice(0, 2).toUpperCase()}</span><div><h3>{stage.title}</h3><p>{tool.fitReason}</p></div></div><div className={styles.reviewTool}><strong>{tool.name}</strong><Link href={`/ai-tools/tool/${tool.slug}`}><FiExternalLink /></Link><button type="button" onClick={() => setStep(3)} title="Edit tool selection"><FiRefreshCw /></button><button type="button" onClick={() => setSelectedByStage((current) => { const next = { ...current }; delete next[stage.id]; return next; })} title="Remove tool"><FiTrash2 /></button></div></article>; })}</div> : <div className={styles.emptyState}><FiLayers /><h3>Nothing selected yet</h3><button type="button" className={styles.nextButton} onClick={() => setStep(3)}>Choose tools</button></div>}
            <div className={styles.reviewActions}><button type="button" className={styles.actionBtnSecondary} onClick={shareKit}><FiShare2 /> Share</button><Link href={compareHref} className={styles.actionBtnSecondary}><FiSliders /> Compare</Link><button type="button" className={styles.actionBtnPrimary} onClick={saveKit} disabled={!selectedTools.length}><FiBookmark /> Save selected tools</button><button type="button" className={styles.resetButton} onClick={reset}><FiRefreshCw /> Start over</button></div>
          </div>
        )}

        <div className={styles.navigation}><button type="button" className={styles.backButton} onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><FiArrowLeft /> Back</button>{step === 0 && <button type="button" className={styles.nextButton} onClick={continueFromGoal}>Continue to Context <FiArrowRight /></button>}{step === 1 && <button type="button" className={styles.nextButton} onClick={generateWorkflow}>Generate Workflow <FiArrowRight /></button>}{step === 2 && <button type="button" className={styles.nextButton} onClick={() => setStep(3)} disabled={!workflow?.stages?.some((stage) => !skippedStages.includes(stage.id))}>Choose Tools <FiArrowRight /></button>}{step === 3 && <button type="button" className={styles.nextButton} onClick={() => setStep(4)}>Review Kit <FiArrowRight /></button>}{step === 4 && <button type="button" className={styles.nextButton} onClick={() => setStep(3)}><FiSliders /> Edit Kit</button>}</div>
      </section>
    </main>
  );
}
