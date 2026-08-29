const TOOLKIT_GOALS = [
  {
    id: 'build-website',
    label: 'Build a Website',
    description: 'Plan the structure, shape the UI, and code the experience.',
    keywords: ['website', 'web app', 'landing page', 'frontend', 'responsive', 'site'],
    preferredCategories: ['ai-development', 'ai-app-building', 'creative-ai', 'development', 'design', 'website-app-builders'],
    purposeOrder: ['Planning', 'UI/Design', 'Coding'],
  },
  {
    id: 'build-saas',
    label: 'Build a SaaS',
    description: 'Ship an MVP with product planning, UI design, and implementation support.',
    keywords: ['saas', 'mvp', 'startup', 'dashboard', 'product', 'workflow'],
    preferredCategories: ['ai-development', 'ai-app-building', 'business-ai', 'development', 'design', 'website-app-builders'],
    purposeOrder: ['Planning', 'Coding', 'UI/Design'],
  },
  {
    id: 'build-mobile-app',
    label: 'Build a Mobile App',
    description: 'Focus on app architecture, implementation, and polished visuals.',
    keywords: ['mobile', 'app', 'ios', 'android', 'cross-platform', 'native'],
    preferredCategories: ['ai-development', 'ai-app-building', 'creative-ai', 'development', 'design', 'website-app-builders'],
    purposeOrder: ['Planning', 'Coding', 'UI/Design'],
  },
  {
    id: 'build-ai-app',
    label: 'Build an AI App',
    description: 'Choose tools that help with agentic coding and rapid iteration.',
    keywords: ['ai app', 'ai', 'agent', 'automation', 'assistant', 'llm'],
    preferredCategories: ['ai-development', 'ai-assistants', 'ai-app-building', 'development'],
    purposeOrder: ['Planning', 'Coding'],
  },
  {
    id: 'design-ui',
    label: 'Design a UI',
    description: 'Explore concept visuals and refine the interface direction.',
    keywords: ['ui', 'design', 'prototype', 'mockup', 'visual', 'interface'],
    preferredCategories: ['creative-ai', 'ai-app-building', 'design', 'image'],
    purposeOrder: ['UI/Design', 'Planning'],
  },
  {
    id: 'create-content',
    label: 'Create Content',
    description: 'Find tools for drafting, writing, and packaging content workflows.',
    keywords: ['content', 'writing', 'copy', 'blog', 'newsletter', 'social'],
    preferredCategories: ['creative-ai', 'ai-assistants', 'productivity-ai', 'writing', 'marketing-seo'],
    purposeOrder: ['Content'],
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Surface tools that help explore, synthesize, and validate information.',
    keywords: ['research', 'analysis', 'data', 'reference', 'investigate', 'study'],
    preferredCategories: ['ai-assistants', 'productivity-ai', 'research', 'documents', 'productivity'],
    purposeOrder: ['Research'],
  },
  {
    id: 'learn-study',
    label: 'Learn / Study',
    description: 'Recommend tools that support learning, practice, and structured notes.',
    keywords: ['learn', 'study', 'education', 'notes', 'tutorial', 'practice'],
    preferredCategories: ['ai-assistants', 'ai-development', 'productivity-ai', 'education', 'productivity'],
    purposeOrder: ['Learning'],
  },
];

const EXPERIENCE_OPTIONS = [
  { id: 'any', label: 'Any' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const BUDGET_OPTIONS = [
  { id: 'any', label: 'Any' },
  { id: 'free', label: 'Free' },
  { id: 'freemium', label: 'Freemium' },
];

const PRIMARY_GOAL_OPTIONS = [
  { id: 'speed', label: 'Speed' },
  { id: 'quality', label: 'Quality' },
  { id: 'simplicity', label: 'Simplicity' },
];

const PURPOSE_ORDER = ['Planning', 'UI/Design', 'Coding', 'Deployment', 'Content', 'Research', 'Learning'];

const PURPOSE_KEYWORDS = {
  Planning: ['plan', 'planning', 'roadmap', 'workflow', 'strategy', 'architecture', 'multi-step', 'brainstorm', 'agent'],
  'UI/Design': ['ui', 'ux', 'design', 'visual', 'mockup', 'prototype', 'image', 'art', 'layout'],
  Coding: ['code', 'coding', 'editor', 'implementation', 'refactor', 'autocomplete', 'pair programmer', 'developer'],
  Deployment: ['deploy', 'deployment', 'ship', 'release', 'performance', 'production'],
  Content: ['content', 'writing', 'copy', 'blog', 'newsletter', 'social'],
  Research: ['research', 'analysis', 'data', 'reference', 'insight'],
  Learning: ['learn', 'study', 'education', 'tutorial', 'practice'],
};

const TEXT_FIELDS = ['name', 'description', 'overview', 'category', 'subCategory'];

function toLowerList(values = []) {
  return values.map((value) => String(value).toLowerCase());
}

function normalizeTool(tool) {
  return {
    ...tool,
    platforms: tool.platforms || tool.platform || [],
    useCases: tool.useCases || [],
    bestFor: tool.bestFor || [],
  };
}

function getGoalProfile(goalId) {
  return TOOLKIT_GOALS.find((goal) => goal.id === goalId) || TOOLKIT_GOALS[0];
}

function containsAny(haystack, needles) {
  const source = String(haystack || '').toLowerCase();
  return needles.some((needle) => source.includes(String(needle).toLowerCase()));
}

function collectToolText(tool) {
  return TEXT_FIELDS.map((field) => tool[field]).filter(Boolean).join(' ').toLowerCase();
}

function scoreBudget(tool, budget, scoreBreakdown) {
  const pricing = String(tool.pricing || '').toLowerCase();
  const hasFree = pricing.includes('free');
  const hasFreemium = pricing.includes('freemium');
  const hasPaid = pricing.includes('paid');

  if (budget === 'free') {
    if (hasFree && !hasPaid) {
      scoreBreakdown.score += 14;
      scoreBreakdown.reasons.push('Fits a free-first budget.');
    } else if (hasPaid && !hasFree) {
      scoreBreakdown.score -= 8;
    }
  }

  if (budget === 'freemium') {
    if (hasFreemium || (hasFree && hasPaid)) {
      scoreBreakdown.score += 14;
      scoreBreakdown.reasons.push('Offers a freemium starting point.');
    } else if (hasPaid && !hasFree) {
      scoreBreakdown.score -= 6;
    }
  }
}

function scoreExperience(tool, experience, scoreBreakdown) {
  const text = collectToolText(tool);
  const pricing = String(tool.pricing || '').toLowerCase();
  const beginnerFriendly = containsAny(text, ['simple', 'guided', 'autocomplete', 'freemium', 'free', 'start']);
  const advancedFriendly = containsAny(text, ['agent', 'codebase', 'multi-file', 'refactor', 'workflow', 'deep']);

  if (experience === 'beginner' && beginnerFriendly) {
    scoreBreakdown.score += 10;
    scoreBreakdown.reasons.push('Feels approachable for a first setup.');
  }

  if (experience === 'intermediate' && (beginnerFriendly || advancedFriendly)) {
    scoreBreakdown.score += 6;
  }

  if (experience === 'advanced' && advancedFriendly) {
    scoreBreakdown.score += 12;
    scoreBreakdown.reasons.push('Gives you more control for complex work.');
  }

  if (experience === 'beginner' && pricing.includes('paid') && !pricing.includes('free')) {
    scoreBreakdown.score -= 4;
  }
}

function scorePrimaryGoal(tool, primaryGoal, scoreBreakdown) {
  const text = collectToolText(tool);
  const pricing = String(tool.pricing || '').toLowerCase();

  if (primaryGoal === 'speed' && containsAny(text, ['fast', 'autocomplete', 'instant', 'agent', 'pair programmer', 'multi-line'])) {
    scoreBreakdown.score += 12;
    scoreBreakdown.reasons.push('Optimized for quick iteration.');
  }

  if (primaryGoal === 'quality' && (tool.verified || containsAny(text, ['high-quality', 'deep', 'professional', 'premium']))) {
    scoreBreakdown.score += 10;
    scoreBreakdown.reasons.push('Leans toward higher-confidence output.');
  }

  if (primaryGoal === 'simplicity' && (pricing.includes('free') || pricing.includes('freemium') || containsAny(text, ['simple', 'guided', 'easy']))) {
    scoreBreakdown.score += 10;
    scoreBreakdown.reasons.push('Keeps the workflow lightweight.');
  }
}

function getPurposeSignal(tool, goalProfile) {
  const text = collectToolText(tool);
  const signals = Object.fromEntries(PURPOSE_ORDER.map((purpose) => [purpose, 0]));

  if (containsAny(text, PURPOSE_KEYWORDS.Planning) || ['ide', 'agentic', 'brainstorming'].some((needle) => String(tool.subCategory || '').toLowerCase().includes(needle))) {
    signals.Planning += 24;
  }

  if (['design', 'image', 'video'].includes(tool.category) || containsAny(text, PURPOSE_KEYWORDS['UI/Design'])) {
    signals['UI/Design'] += 28;
  }

  if (['development', 'developer-utilities', 'website-app-builders'].includes(tool.category) || containsAny(text, PURPOSE_KEYWORDS.Coding)) {
    signals.Coding += 28;
  }

  if (containsAny(text, PURPOSE_KEYWORDS.Deployment)) {
    signals.Deployment += 18;
  }

  if (containsAny(text, PURPOSE_KEYWORDS.Content)) {
    signals.Content += 20;
  }

  if (containsAny(text, PURPOSE_KEYWORDS.Research)) {
    signals.Research += 20;
  }

  if (containsAny(text, PURPOSE_KEYWORDS.Learning)) {
    signals.Learning += 20;
  }

  if (goalProfile.purposeOrder.includes('Planning') && containsAny(text, ['roadmap', 'workflow', 'agent', 'plan'])) {
    signals.Planning += 10;
  }

  return signals;
}

function getGoalMatchSignals(tool, goalProfile) {
  const text = collectToolText(tool);
  const lowerUseCases = toLowerList(tool.useCases);
  const lowerBestFor = toLowerList(tool.bestFor);
  const lowerTags = toLowerList(tool.tags || []);
  const lowerPlatforms = toLowerList(tool.platforms || []);
  const signals = {
    score: 0,
    reasons: [],
    meaningful: false,
  };

  if (goalProfile.preferredCategories.includes(tool.category)) {
    signals.score += 28;
    signals.reasons.push(`Matches the ${tool.category} category.`);
  }

  if (containsAny(text, goalProfile.keywords) || goalProfile.keywords.some((keyword) => lowerTags.some((tag) => tag.includes(keyword)))) {
    signals.score += 18;
    signals.meaningful = true;
    signals.reasons.push(`Aligns with ${goalProfile.label.toLowerCase()} workflows.`);
  }

  if (lowerUseCases.some((useCase) => containsAny(useCase, goalProfile.keywords))) {
    signals.score += 14;
    signals.meaningful = true;
    signals.reasons.push('Its use cases line up with this goal.');
  }

  if (lowerBestFor.some((item) => containsAny(item, goalProfile.keywords))) {
    signals.score += 10;
    signals.meaningful = true;
  }

  if (goalProfile.id === 'build-mobile-app' && lowerPlatforms.some((platform) => ['ios', 'android', 'mobile', 'cross-platform'].some((needle) => platform.includes(needle)))) {
    signals.score += 8;
    signals.meaningful = true;
    signals.reasons.push('Has a mobile-friendly platform fit.');
  }

  if (goalProfile.id === 'design-ui' && tool.category === 'design') {
    signals.score += 8;
    signals.meaningful = true;
  }

  return signals;
}

function getToolFitLabel(score) {
  if (score >= 78) return 'Excellent fit';
  if (score >= 58) return 'Strong fit';
  if (score >= 40) return 'Good fit';
  return 'Worth considering';
}

function determinePrimaryPurpose(tool, goalProfile) {
  const signals = getPurposeSignal(tool, goalProfile);
  const ranked = PURPOSE_ORDER
    .map((purpose) => ({ purpose, score: signals[purpose] || 0 }))
    .sort((a, b) => b.score - a.score);

  const topPurpose = ranked[0];
  if (topPurpose && topPurpose.score > 0) {
    return topPurpose.purpose;
  }

  if (goalProfile.purposeOrder.length > 0) {
    return goalProfile.purposeOrder[0];
  }

  return 'Coding';
}

function scoreTool(tool, goalProfile, preferences) {
  const normalizedTool = normalizeTool(tool);
  const breakdown = {
    score: 0,
    reasons: [],
  };

  const goalSignals = getGoalMatchSignals(normalizedTool, goalProfile);
  breakdown.score += goalSignals.score;
  breakdown.reasons.push(...goalSignals.reasons);

  if (normalizedTool.verified) {
    breakdown.score += 8;
    breakdown.reasons.push('Verified listing.');
  }

  if (normalizedTool.featured) {
    breakdown.score += 4;
  }

  if (normalizedTool.new) {
    breakdown.score += preferences.primaryGoal === 'speed' ? 4 : 2;
  }

  scoreBudget(normalizedTool, preferences.budget, breakdown);
  scoreExperience(normalizedTool, preferences.experience, breakdown);
  scorePrimaryGoal(normalizedTool, preferences.primaryGoal, breakdown);

  const purpose = determinePrimaryPurpose(normalizedTool, goalProfile);
  const purposeSignals = getPurposeSignal(normalizedTool, goalProfile);
  breakdown.score += purposeSignals[purpose] || 0;

  if (purposeSignals[purpose] > 0) {
    breakdown.reasons.push(`Best suited for ${purpose.toLowerCase()} work.`);
  }

  const fitLabel = getToolFitLabel(breakdown.score);
  const primaryReason = breakdown.reasons[0] || `A useful fit for ${goalProfile.label.toLowerCase()}.`;

  return {
    ...normalizedTool,
    fitScore: breakdown.score,
    fitLabel,
    fitReason: primaryReason,
    purpose,
    purposeScore: purposeSignals[purpose] || 0,
    meaningfulMatch: goalSignals.meaningful || (normalizedTool.category === goalProfile.preferredCategories[0] && purposeSignals[purpose] >= 28),
  };
}

function groupRecommendations(scoredTools, goalProfile) {
  const grouped = new Map();

  scoredTools.forEach((tool) => {
    const bucket = grouped.get(tool.purpose) || [];
    bucket.push(tool);
    grouped.set(tool.purpose, bucket);
  });

  return (goalProfile.purposeOrder.length > 0 ? goalProfile.purposeOrder : PURPOSE_ORDER)
    .filter((purpose) => grouped.has(purpose))
    .map((purpose) => ({
      purpose,
      title: purpose,
      description: purpose === 'Planning'
        ? 'Start with planning and workflow direction.'
        : purpose === 'UI/Design'
          ? 'Shape the interface and visual direction.'
          : purpose === 'Coding'
            ? 'Build, refactor, and ship the product.'
            : purpose === 'Deployment'
              ? 'Prepare for release and operational readiness.'
              : purpose === 'Content'
                ? 'Support content creation and publishing.'
                : purpose === 'Research'
                  ? 'Help with investigation and synthesis.'
                  : 'Support learning and practice.',
      tools: grouped.get(purpose)
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 2),
    }));
}

export function buildToolkitRecommendations(tools, selection = {}) {
  const goalProfile = getGoalProfile(selection.goalId);
  const normalizedTools = (tools || []).map(normalizeTool);

  if (!selection.goalId) {
    return {
      ready: false,
      selectedGoal: null,
      summary: 'Choose a goal to get a tailored toolkit.',
      groups: [],
      matchingTools: [],
      totalTools: normalizedTools.length,
    };
  }

  const scoredTools = normalizedTools
    .map((tool) => scoreTool(tool, goalProfile, {
      experience: selection.experience || 'any',
      budget: selection.budget || 'any',
      primaryGoal: selection.primaryGoal || 'speed',
    }))
    .filter((tool) => tool.fitScore >= 20 && tool.meaningfulMatch)
    .sort((a, b) => b.fitScore - a.fitScore);

  if (scoredTools.length === 0) {
    return {
      ready: true,
      selectedGoal: goalProfile,
      summary: `We could not find a strong match for ${goalProfile.label.toLowerCase()} in the current catalog.`,
      groups: [],
      matchingTools: [],
      totalTools: normalizedTools.length,
    };
  }

  const groups = groupRecommendations(scoredTools, goalProfile);
  const topTools = scoredTools.slice(0, 6);

  return {
    ready: true,
    selectedGoal: goalProfile,
    summary: `We found ${scoredTools.length} matching tool${scoredTools.length === 1 ? '' : 's'} for ${goalProfile.label.toLowerCase()}.`,
    groups,
    matchingTools: topTools,
    totalTools: normalizedTools.length,
  };
}

export {
  TOOLKIT_GOALS,
  EXPERIENCE_OPTIONS as TOOLKIT_EXPERIENCE_OPTIONS,
  BUDGET_OPTIONS as TOOLKIT_BUDGET_OPTIONS,
  PRIMARY_GOAL_OPTIONS as TOOLKIT_PRIMARY_GOAL_OPTIONS,
};
