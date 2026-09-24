/**
 * Deterministic Rule-Based Toolkit Recommendation Engine
 *
 * Recommends relevant tools based on:
 * - User goal / work type
 * - Role
 * - Experience level
 * - Interests
 * - Technologies / skills
 * - Preferred pricing
 * - Preferred platforms
 *
 * Strict Fallback Order:
 * 1. Exact / use-case match (Tier 1)
 * 2. Category match (Tier 2)
 * 3. Related / popular tools (Tier 3)
 */

export const TOOLKIT_GOALS = [
  {
    id: 'build-website',
    label: 'Build a Website / Web App',
    description: 'Plan the architecture, generate responsive UI, and code modern web experiences.',
    keywords: ['website', 'web app', 'landing page', 'frontend', 'responsive', 'site', 'react', 'nextjs', 'tailwind', 'html', 'css', 'ui'],
    preferredCategories: ['ai-development', 'ai-app-building', 'creative-ai'],
    preferredSubCategories: ['ui-to-code', 'ai-website-builders', 'coding-assistants', 'ai-ides'],
    purposeOrder: ['Planning', 'UI/Design', 'Coding'],
  },
  {
    id: 'build-saas',
    label: 'Build a SaaS / MVP',
    description: 'Ship a full-stack product with databases, auth, dashboards, and automated workflows.',
    keywords: ['saas', 'mvp', 'startup', 'full-stack', 'dashboard', 'product', 'backend', 'database', 'api', 'auth'],
    preferredCategories: ['ai-development', 'ai-app-building', 'business-ai'],
    preferredSubCategories: ['full-stack-app-builders', 'ai-ides', 'coding-agents', 'analytics-bi'],
    purposeOrder: ['Planning', 'Coding', 'UI/Design'],
  },
  {
    id: 'build-mobile-app',
    label: 'Build a Mobile App',
    description: 'Focus on mobile architecture, cross-platform UI, and native mobile functionality.',
    keywords: ['mobile', 'app', 'ios', 'android', 'react native', 'flutter', 'swift', 'cross-platform', 'native'],
    preferredCategories: ['ai-development', 'ai-app-building', 'creative-ai'],
    preferredSubCategories: ['coding-assistants', 'ai-ides', 'ui-to-code', 'graphic-design'],
    purposeOrder: ['Planning', 'Coding', 'UI/Design'],
  },
  {
    id: 'build-ai-app',
    label: 'Build an AI App / Agent',
    description: 'Build with LLMs, autonomous agents, prompt orchestration, and intelligent APIs.',
    keywords: ['ai app', 'ai', 'agent', 'automation', 'assistant', 'llm', 'rag', 'langchain', 'inference', 'model', 'agentic'],
    preferredCategories: ['ai-development', 'ai-assistants', 'ai-app-building'],
    preferredSubCategories: ['coding-agents', 'developer-utilities', 'general-assistants'],
    purposeOrder: ['Planning', 'Coding', 'Optimization'],
  },
  {
    id: 'design-ui',
    label: 'Design UI & Assets',
    description: 'Explore concept visuals, create design systems, mockups, and convert UI to code.',
    keywords: ['ui', 'ux', 'design', 'prototype', 'mockup', 'visual', 'interface', 'graphic', 'figma', 'icon', 'asset', 'image'],
    preferredCategories: ['creative-ai', 'ai-app-building'],
    preferredSubCategories: ['ui-to-code', 'graphic-design', 'image-generation', 'ai-website-builders'],
    purposeOrder: ['UI/Design', 'Planning', 'Coding'],
  },
  {
    id: 'create-content',
    label: 'Create Content & Media',
    description: 'Draft long-form copy, generate marketing visuals, videos, audio, and social media.',
    keywords: ['content', 'writing', 'copy', 'blog', 'video', 'voice', 'audio', 'marketing', 'social', 'newsletter'],
    preferredCategories: ['creative-ai', 'ai-assistants', 'business-ai'],
    preferredSubCategories: ['writing-assistants', 'video-generation', 'audio-speech', 'marketing-seo'],
    purposeOrder: ['Content', 'Planning'],
  },
  {
    id: 'research',
    label: 'Deep Research & Analysis',
    description: 'Surface papers, synthesize complex documentation, and extract actionable data.',
    keywords: ['research', 'analysis', 'data', 'paper', 'citation', 'synthesis', 'document', 'search', 'insight'],
    preferredCategories: ['ai-assistants', 'productivity-ai', 'business-ai'],
    preferredSubCategories: ['academic-research', 'search-engines', 'analytics-bi', 'knowledge-bases'],
    purposeOrder: ['Research', 'Planning'],
  },
  {
    id: 'automate-workflows',
    label: 'Automate Workflows & Tasks',
    description: 'Connect repetitive tasks, manage automated schedules, notes, and productivity pipelines.',
    keywords: ['automation', 'workflow', 'automate', 'task', 'schedule', 'productivity', 'integration', 'pipeline', 'notes'],
    preferredCategories: ['productivity-ai', 'business-ai', 'ai-development'],
    preferredSubCategories: ['workflow-automation', 'task-management', 'notes-docs'],
    purposeOrder: ['Planning', 'Automation'],
  },
  {
    id: 'learn-study',
    label: 'Learn & Explore AI',
    description: 'Discover accessible coding utilities, concept explanations, and structured practice.',
    keywords: ['learn', 'study', 'education', 'notes', 'tutorial', 'practice', 'beginner', 'explain', 'fundamentals'],
    preferredCategories: ['ai-assistants', 'ai-development', 'productivity-ai'],
    preferredSubCategories: ['general-assistants', 'coding-assistants', 'notes-docs'],
    purposeOrder: ['Learning', 'Coding'],
  },
];

export const TOOLKIT_INTERESTS = [
  'Full-stack Web Development',
  'Frontend & UI/UX',
  'Backend & APIs',
  'AI Agents & Automation',
  'Mobile App Development',
  'Data Science & Analytics',
  'Content Creation & Copy',
  'DevOps & Cloud',
];

export const TOOLKIT_ROLES = [
  { id: 'Developer', label: 'Developer', icon: 'code' },
  { id: 'Designer', label: 'Designer', icon: 'layout' },
  { id: 'Founder', label: 'Founder / Entrepreneur', icon: 'zap' },
  { id: 'Researcher', label: 'Researcher / Analyst', icon: 'book' },
  { id: 'Content Creator', label: 'Content Creator', icon: 'pen' },
  { id: 'Student', label: 'Student', icon: 'smile' },
  { id: 'Freelancer', label: 'Freelancer', icon: 'user' },
  { id: 'Other', label: 'Other', icon: 'compass' },
];

export const TOOLKIT_EXPERIENCE_OPTIONS = [
  { id: 'any', label: 'Any Level' },
  { id: 'beginner', label: 'Beginner', desc: 'Approachable & guided' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Building & shipping' },
  { id: 'advanced', label: 'Advanced', desc: 'Agentic & deep control' },
];

export const TOOLKIT_BUDGET_OPTIONS = [
  { id: 'any', label: 'Any Budget' },
  { id: 'free', label: 'Free only', desc: 'Zero cost' },
  { id: 'freemium', label: 'Free / Freemium', desc: 'Free tiers available' },
  { id: 'paid', label: 'Paid / Pro', desc: 'Commercial tools' },
];

export const TOOLKIT_PRIMARY_GOAL_OPTIONS = [
  { id: 'speed', label: 'Speed', desc: 'Rapid prototyping' },
  { id: 'quality', label: 'Quality', desc: 'Production-ready output' },
  { id: 'simplicity', label: 'Simplicity', desc: 'Clean, focused setup' },
];

export const TOOLKIT_TECHNOLOGIES = [
  'React / Next.js',
  'Python',
  'JavaScript / TypeScript',
  'Tailwind CSS',
  'VS Code',
  'Git / CLI',
  'Node.js',
  'Docker',
  'Supabase',
];

export const TOOLKIT_PLATFORMS = [
  'Web',
  'Desktop (Mac/Win/Linux)',
  'VS Code',
  'CLI / Terminal',
  'Mobile (iOS/Android)',
];

const PURPOSE_ORDER = ['Planning', 'UI/Design', 'Coding', 'Optimization', 'Automation', 'Content', 'Research', 'Learning'];

const PURPOSE_KEYWORDS = {
  Planning: ['plan', 'planning', 'roadmap', 'workflow', 'strategy', 'architecture', 'brainstorm', 'agent', 'spec', 'design-system'],
  'UI/Design': ['ui', 'ux', 'design', 'visual', 'mockup', 'prototype', 'image', 'art', 'layout', 'graphic', 'component'],
  Coding: ['code', 'coding', 'editor', 'implementation', 'refactor', 'autocomplete', 'pair programmer', 'developer', 'ide', 'cli'],
  Optimization: ['optimization', 'performance', 'testing', 'review', 'security', 'debug', 'benchmarking'],
  Automation: ['automation', 'workflow', 'automate', 'pipeline', 'schedule', 'cron', 'trigger'],
  Content: ['content', 'writing', 'copy', 'blog', 'newsletter', 'social', 'video', 'audio'],
  Research: ['research', 'analysis', 'data', 'reference', 'insight', 'citation', 'paper'],
  Learning: ['learn', 'study', 'education', 'tutorial', 'practice', 'notes'],
};

const ROLE_AFFINITIES = {
  developer: {
    categories: ['ai-development', 'ai-app-building'],
    keywords: ['code', 'coding', 'ide', 'cli', 'api', 'agent', 'git', 'refactor', 'terminal', 'developer'],
  },
  designer: {
    categories: ['creative-ai', 'ai-app-building'],
    keywords: ['design', 'ui', 'ux', 'visual', 'image', 'graphic', 'art', 'prototype', 'figma', 'canvas'],
  },
  founder: {
    categories: ['ai-app-building', 'business-ai', 'ai-assistants'],
    keywords: ['mvp', 'startup', 'prototype', 'saas', 'strategy', 'market', 'full-stack', 'launch'],
  },
  researcher: {
    categories: ['ai-assistants', 'productivity-ai'],
    keywords: ['research', 'citation', 'paper', 'synthesis', 'search', 'data', 'analysis', 'documents'],
  },
  'content creator': {
    categories: ['creative-ai', 'ai-assistants'],
    keywords: ['content', 'video', 'writing', 'copy', 'social', 'audio', 'voice', 'marketing', 'media'],
  },
  student: {
    categories: ['ai-assistants', 'ai-development', 'productivity-ai'],
    keywords: ['learn', 'study', 'education', 'notes', 'tutorial', 'practice', 'simple'],
  },
  freelancer: {
    categories: ['ai-app-building', 'ai-development', 'creative-ai', 'productivity-ai'],
    keywords: ['client', 'mvp', 'fast', 'productivity', 'design', 'workflow', 'automate'],
  },
};

function toLowerList(values = []) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value || '').toLowerCase().trim()).filter(Boolean);
}

function containsAny(haystack, needles = []) {
  const source = String(haystack || '').toLowerCase();
  return needles.some((needle) => source.includes(String(needle || '').toLowerCase()));
}

function normalizeTool(tool = {}) {
  return {
    ...tool,
    category: String(tool.category || '').toLowerCase(),
    subCategory: String(tool.subCategory || '').toLowerCase(),
    platforms: Array.isArray(tool.platforms) ? tool.platforms : (tool.platform ? [tool.platform] : []),
    useCases: Array.isArray(tool.useCases) ? tool.useCases : (tool.use_cases || []),
    bestFor: Array.isArray(tool.bestFor) ? tool.bestFor : (tool.best_for || []),
    tags: Array.isArray(tool.tags) ? tool.tags : [],
    keyFeatures: Array.isArray(tool.keyFeatures) ? tool.keyFeatures : [],
    pricingModel: tool.pricingModel || tool.pricing || 'Freemium',
  };
}

export function getGoalProfile(goalId) {
  return TOOLKIT_GOALS.find((goal) => goal.id === goalId) || TOOLKIT_GOALS[0];
}

function collectToolSearchText(tool) {
  return [
    tool.name,
    tool.description,
    tool.fullOverview,
    tool.category,
    tool.subCategory,
    ...(tool.tags || []),
    ...(tool.useCases || []),
    ...(tool.bestFor || []),
    ...(tool.keyFeatures || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Evaluates a single tool against goal and personalization criteria
 * strictly implementing the 4-tier fallback order:
 * Tier 1: Exact goal / use-case match
 * Tier 2: Use-case / tag match
 * Tier 3: Category / subcategory match
 * Tier 4: Related / featured / popular tools
 */
export function scoreToolkitTool(toolInput, goalProfile, criteria = {}) {
  const tool = normalizeTool(toolInput);
  const toolText = collectToolSearchText(tool);
  const toolPricing = tool.pricingModel.toLowerCase();
  const lowerTags = toLowerList(tool.tags);
  const lowerUseCases = toLowerList(tool.useCases);
  const lowerBestFor = toLowerList(tool.bestFor);
  const lowerPlatforms = toLowerList(tool.platforms);

  const role = String(criteria.role || '').toLowerCase();
  const experience = String(criteria.experience || criteria.experience_level || 'any').toLowerCase();
  const budget = String(criteria.budget || criteria.preferred_pricing || 'any').toLowerCase();
  const technologies = toLowerList(criteria.technologies || criteria.skills || []);
  const interests = toLowerList(criteria.interests || []);
  const userGoals = toLowerList(criteria.goals || []);
  const preferredPlatforms = toLowerList(criteria.platforms || criteria.preferred_platforms || []);
  const currentWorkGoal = String(criteria.currentGoal || criteria.workGoal || criteria.customGoal || '').trim().toLowerCase();

  // 1. Budget hard filtering check
  if (budget === 'free' && toolPricing.includes('paid') && !tool.hasFree && !toolPricing.includes('free')) {
    // Paid tool when user strictly wants free
    return null;
  }

  // 2. Extract keywords from goal profile and user's custom current work goal
  const customGoalTokens = currentWorkGoal
    ? currentWorkGoal
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3)
    : [];

  const goalKeywords = [
    ...(goalProfile?.keywords || []),
    ...customGoalTokens,
  ];

  // Match highlights collection
  const matchHighlights = [];

  // Technology highlights
  const techMatches = technologies.filter((tech) =>
    toolText.includes(tech) || lowerTags.some((t) => t.includes(tech)) || lowerPlatforms.some((p) => p.includes(tech))
  );
  if (techMatches.length > 0) {
    matchHighlights.push(...techMatches.slice(0, 2));
  }

  // Interest highlights
  const interestMatches = interests.filter((interest) =>
    tool.category.includes(interest) ||
    interest.includes(tool.category) ||
    lowerTags.some((t) => t.includes(interest) || interest.includes(t)) ||
    lowerUseCases.some((u) => u.includes(interest) || interest.includes(u)) ||
    toolText.includes(interest)
  );
  if (interestMatches.length > 0 && matchHighlights.length < 3) {
    matchHighlights.push(...interestMatches.slice(0, 1));
  }

  // Determine the strongest relevant workflow stage instead of defaulting every
  // tool into Coding when its metadata describes another kind of work.
  const stageMatches = (goalProfile?.purposeOrder || PURPOSE_ORDER).map((purpose) => ({
    purpose,
    score: (PURPOSE_KEYWORDS[purpose] || []).reduce((total, keyword) => total + (toolText.includes(keyword) ? 1 : 0), 0),
  }));
  const primaryPurpose = stageMatches.sort((a, b) => b.score - a.score)[0]?.purpose || 'Coding';

  // =========================================================================
  // TIER 1: EXACT GOAL / USE-CASE MATCH
  // =========================================================================
  const exactUseCaseMatch = lowerUseCases.some((uc) =>
    goalKeywords.some((kw) => uc.includes(kw) || kw.includes(uc))
  );
  const exactBestForMatch = lowerBestFor.some((bf) =>
    goalKeywords.some((kw) => bf.includes(kw) || kw.includes(bf))
  );
  const exactSubCatMatch = (goalProfile?.preferredSubCategories || []).some((sc) =>
    tool.subCategory.includes(sc) || sc.includes(tool.subCategory)
  );
  const isPreferredCategory = (goalProfile?.preferredCategories || []).includes(tool.category);

  // Custom goal direct keyword match in title, description, or use cases
  const customGoalDirectMatch = customGoalTokens.length > 0 && (
    customGoalTokens.some((t) => tool.name.toLowerCase().includes(t)) ||
    lowerUseCases.some((uc) => customGoalTokens.some((t) => uc.includes(t))) ||
    lowerTags.some((tag) => customGoalTokens.some((t) => tag.includes(t)))
  );

  const isTier1 = (exactUseCaseMatch || exactBestForMatch || exactSubCatMatch || customGoalDirectMatch) &&
    (isPreferredCategory || !goalProfile || customGoalDirectMatch);

  if (isTier1) {
    let internalScore = 90;
    if (exactUseCaseMatch) internalScore += 12;
    if (exactSubCatMatch) internalScore += 10;
    if (techMatches.length > 0) internalScore += 10;
    if (tool.verified) internalScore += 6;
    if (tool.featured) internalScore += 4;

    let fitReason = `Exact match for ${goalProfile?.label?.toLowerCase() || 'your project'} workflows.`;
    if (currentWorkGoal && customGoalDirectMatch) {
      fitReason = `Direct match for "${currentWorkGoal.slice(0, 40)}".`;
    } else if (techMatches.length > 0) {
      fitReason = `Direct match for ${goalProfile?.label?.toLowerCase() || 'your project'} with ${techMatches[0]}.`;
    } else if (exactUseCaseMatch && tool.useCases.length > 0) {
      const matchedUc = tool.useCases.find((uc) => goalKeywords.some((kw) => uc.toLowerCase().includes(kw))) || tool.useCases[0];
      fitReason = `Tailored for ${matchedUc.replace(/-/g, ' ')} workflows.`;
    } else if (exactSubCatMatch) {
      fitReason = `Dedicated ${tool.subCategory.replace(/-/g, ' ')} tool for this workflow.`;
    }

    return {
      ...tool,
      tier: 'exact',
      tierLabel: 'Exact Match',
      tierPriority: 1,
      fitScore: internalScore,
      fitReason,
      matchHighlights,
      purpose: primaryPurpose,
    };
  }

  // =========================================================================
  // TIER 2: USE-CASE / TAG MATCH
  // =========================================================================
  const isTagTechMatch = techMatches.length > 0;
  const isTagInterestMatch = interestMatches.length > 0;
  const isGoalKeywordMatch = goalKeywords.some((kw) => lowerTags.some((t) => t.includes(kw) || kw.includes(t)));
  const isUserGoalMatch = userGoals.some((ug) => containsAny(toolText, [ug]));

  const isTier2 = isTagTechMatch || isTagInterestMatch || isGoalKeywordMatch || isUserGoalMatch;

  if (isTier2) {
    let internalScore = 70;
    if (isTagTechMatch) internalScore += 10;
    if (isTagInterestMatch) internalScore += 8;
    if (tool.verified) internalScore += 6;
    if (tool.featured) internalScore += 4;

    let fitReason = `Matches your stack and technical focus.`;
    if (techMatches.length > 0) {
      fitReason = `Matches your stack with ${techMatches[0]}.`;
    } else if (interestMatches.length > 0) {
      fitReason = `Aligned with your interest in ${interestMatches[0]}.`;
    } else if (isGoalKeywordMatch) {
      fitReason = `Tag match for your target workflow requirements.`;
    }

    return {
      ...tool,
      tier: 'tag',
      tierLabel: 'Tag Match',
      tierPriority: 2,
      fitScore: internalScore,
      fitReason,
      matchHighlights,
      purpose: primaryPurpose,
    };
  }

  // =========================================================================
  // TIER 3: CATEGORY / SUBCATEGORY MATCH
  // =========================================================================
  const isCategoryMatch = (goalProfile?.preferredCategories || []).includes(tool.category) ||
    (ROLE_AFFINITIES[role]?.categories || []).includes(tool.category);

  if (isCategoryMatch) {
    let internalScore = 50;
    if (tool.verified) internalScore += 8;
    if (tool.featured) internalScore += 6;

    const catName = tool.category.replace(/^ai-/, '').replace(/-/g, ' ');
    const fitReason = role && ROLE_AFFINITIES[role]?.categories.includes(tool.category)
      ? `Tailored for your role as a ${criteria.role}.`
      : `Category match: reliable ${catName} tool suited for this project.`;

    return {
      ...tool,
      tier: 'category',
      tierLabel: 'Category Match',
      tierPriority: 3,
      fitScore: internalScore,
      fitReason,
      matchHighlights,
      purpose: primaryPurpose,
    };
  }

  // =========================================================================
  // TIER 4: RELATED / FEATURED / POPULAR TOOLS
  // =========================================================================
  const isPopularCandidate = tool.featured || tool.verified || containsAny(toolText, ['assistant', 'productivity', 'code', 'builder', 'ai']);
  if (isPopularCandidate) {
    let internalScore = 30;
    if (tool.featured) internalScore += 10;
    if (tool.verified) internalScore += 8;
    if (tool.hasFree) internalScore += 4;

    const fitReason = tool.featured
      ? 'Popular community favorite to complement this workflow.'
      : 'Curated versatile tool to support your workflow stages.';

    return {
      ...tool,
      tier: 'popular',
      tierLabel: 'Popular Tool',
      tierPriority: 4,
      fitScore: internalScore,
      fitReason,
      matchHighlights,
      purpose: primaryPurpose,
    };
  }

  return null;
}

/**
 * Builds the complete toolkit recommendation set following the strict fallback hierarchy.
 * Returns a small, focused set of useful recommendations (typically 4-6 tools)
 * organized logically by workflow stage with simple explanations.
 */
export function buildToolkitRecommendations(tools = [], selection = {}) {
  const hasPresetGoal = Boolean(selection.goalId || selection.goal);
  const goalProfile = hasPresetGoal ? getGoalProfile(selection.goalId || selection.goal) : null;
  const customWorkGoal = String(selection.currentGoal || selection.workGoal || selection.customGoal || '').trim();
  const excludedSlugs = new Set(Array.isArray(selection.excludedSlugs) ? selection.excludedSlugs : []);
  const normalizedTools = (tools || []).map(normalizeTool).filter((tool) => !excludedSlugs.has(tool.slug));

  const hasAnyGoal = Boolean(hasPresetGoal || customWorkGoal);
  const hasProfileContext = Boolean(
    selection.role ||
    (selection.technologies && selection.technologies.length > 0) ||
    (selection.interests && selection.interests.length > 0)
  );

  if (!hasAnyGoal && !hasProfileContext) {
    return {
      ready: false,
      selectedGoal: null,
      summary: 'Choose a project goal or provide your profile details to generate your customized AI toolkit.',
      groups: [],
      matchingTools: [],
      tierBreakdown: { exact: 0, tag: 0, category: 0, popular: 0 },
      totalTools: normalizedTools.length,
    };
  }

  const activeGoalProfile = goalProfile || (customWorkGoal ? {
    id: 'custom-goal',
    label: customWorkGoal.length > 32 ? `${customWorkGoal.slice(0, 30)}...` : customWorkGoal,
    description: `Targeting: ${customWorkGoal}`,
    purposeOrder: PURPOSE_ORDER,
  } : {
    id: 'profile-tailored',
    label: 'your profile',
    description: 'Recommendations tailored to your stack and experience.',
    purposeOrder: PURPOSE_ORDER,
  });

  // Score all tools against the goal & criteria
  const scored = [];
  for (const rawTool of normalizedTools) {
    const evaluated = scoreToolkitTool(rawTool, goalProfile, selection);
    if (evaluated) {
      scored.push(evaluated);
    }
  }

  // Sort by tierPriority (exact: 1, tag: 2, category: 3, popular: 4) then fitScore descending
  scored.sort((a, b) => {
    if (a.tierPriority !== b.tierPriority) {
      return a.tierPriority - b.tierPriority;
    }
    return b.fitScore - a.fitScore;
  });

  // Pick small, focused set (maximum 6 tools overall)
  // Ensure we cover distinct workflow stages where possible
  const purposeOrder = activeGoalProfile?.purposeOrder || PURPOSE_ORDER;
  const stageGroupsMap = new Map();

  purposeOrder.forEach((purpose) => {
    stageGroupsMap.set(purpose, []);
  });

  // Assign scored tools to their primary stage
  scored.forEach((tool) => {
    const stage = tool.purpose || 'Coding';
    if (!stageGroupsMap.has(stage)) {
      stageGroupsMap.set(stage, []);
    }
    stageGroupsMap.get(stage).push(tool);
  });

  // Build the curated groups (up to 2 tools per stage, max 6 tools total)
  const rawGroups = [];
  const selectedToolSlugs = new Set();
  let totalPicked = 0;

  for (const purpose of purposeOrder) {
    if (totalPicked >= 6) break;
    const candidates = stageGroupsMap.get(purpose) || [];
    const available = candidates.filter((c) => !selectedToolSlugs.has(c.slug));

    if (available.length > 0) {
      // Pick top 1 or 2 tools for this stage
      const pickCount = Math.min(2, available.length, 6 - totalPicked);
      const picked = available.slice(0, pickCount);

      picked.forEach((p) => selectedToolSlugs.add(p.slug));
      totalPicked += picked.length;

      rawGroups.push({
        purpose,
        title: purpose === 'Planning'
          ? 'Planning & Architecture'
          : purpose === 'UI/Design'
            ? 'UI & Visual Design'
            : purpose === 'Coding'
              ? 'Implementation & Code'
              : purpose === 'Optimization'
                ? 'Optimization & Quality'
                : purpose === 'Automation'
                  ? 'Automation & Pipelines'
                  : purpose === 'Content'
                    ? 'Content & Media'
                    : purpose === 'Research'
                      ? 'Research & Synthesis'
                      : 'Learning & Fundamentals',
        description: purpose === 'Planning'
          ? 'Structure your roadmap, technical specs, and prompt strategy.'
          : purpose === 'UI/Design'
            ? 'Generate mockups, component designs, and UI assets.'
            : purpose === 'Coding'
              ? 'Implement, refactor, and ship the application code.'
              : purpose === 'Optimization'
                ? 'Benchmark, test, and polish your outputs.'
                : purpose === 'Automation'
                  ? 'Connect automated triggers and streamline tasks.'
                  : purpose === 'Content'
                    ? 'Draft copy, generate media, and package assets.'
                    : purpose === 'Research'
                      ? 'Synthesize documentation and investigate data.'
                      : 'Master concepts with guided interactive utilities.',
        tools: picked,
      });
    }
  }

  // Flatten the curated list and order strictly by fallback tier priority, then fit score
  const topTools = [...rawGroups.flatMap((g) => g.tools)].sort((a, b) => {
    if (a.tierPriority !== b.tierPriority) {
      return a.tierPriority - b.tierPriority;
    }
    return b.fitScore - a.fitScore;
  });

  // Counts of each tier in top tools
  const exactCount = topTools.filter((t) => t.tier === 'exact').length;
  const tagCount = topTools.filter((t) => t.tier === 'tag').length;
  const categoryCount = topTools.filter((t) => t.tier === 'category').length;
  const popularCount = topTools.filter((t) => t.tier === 'popular').length;

  let summary = activeGoalProfile
    ? `Assembled ${topTools.length} focused tools for ${activeGoalProfile.label.toLowerCase()}.`
    : `Assembled ${topTools.length} focused tools based on your profile.`;

  if (exactCount > 0) {
    summary += ` Includes ${exactCount} direct use-case match${exactCount === 1 ? '' : 'es'}.`;
  } else if (tagCount > 0) {
    summary += ` Includes ${tagCount} tag match${tagCount === 1 ? '' : 'es'}.`;
  } else if (categoryCount > 0) {
    summary += ` Includes ${categoryCount} category match${categoryCount === 1 ? '' : 'es'}.`;
  }

  // Helper to strip internal numeric fitScore from tool representation
  const sanitizeTool = (t) => {
    const { fitScore, ...safeTool } = t;
    return safeTool;
  };

  const sanitizedGroups = rawGroups.map((g) => ({
    ...g,
    tools: g.tools.map(sanitizeTool),
  }));

  const sanitizedMatchingTools = topTools.map(sanitizeTool);

  return {
    ready: true,
    selectedGoal: activeGoalProfile,
    summary,
    groups: sanitizedGroups,
    matchingTools: sanitizedMatchingTools,
    tierBreakdown: {
      exact: exactCount,
      tag: tagCount,
      category: categoryCount,
      popular: popularCount,
    },
    totalTools: normalizedTools.length,
  };
}

export function buildToolkitWorkflow(tools = [], selection = {}) {
  const goalId = selection.goalId || selection.goal;
  const customGoal = String(selection.currentGoal || selection.workGoal || selection.customGoal || '').trim();
  const goalProfile = goalId ? getGoalProfile(goalId) : customGoal ? {
    id: 'custom-goal',
    label: customGoal,
    description: `Workflow for ${customGoal}`,
    keywords: customGoal.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3),
    purposeOrder: PURPOSE_ORDER,
  } : null;

  if (!goalProfile) {
    return { ready: false, stages: [], summary: 'Choose a goal to generate workflow stages.' };
  }

  const excludedSlugs = new Set(Array.isArray(selection.excludedSlugs) ? selection.excludedSlugs : []);
  const scored = (tools || [])
    .filter((tool) => !excludedSlugs.has(tool.slug))
    .map((tool) => scoreToolkitTool(tool, goalProfile, selection))
    .filter(Boolean);

  const purposeOrder = goalProfile.purposeOrder || PURPOSE_ORDER;
  const stages = purposeOrder
    .map((purpose) => {
      const candidates = scored
        .filter((tool) => tool.purpose === purpose)
        .sort((left, right) => (right.fitScore || 0) - (left.fitScore || 0))
        .slice(0, 4)
        .map((tool) => {
          const { fitScore, ...safeTool } = tool;
          return safeTool;
        });
      if (candidates.length === 0) return null;
      return {
        id: purpose.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        purpose,
        title: purpose === 'Planning' ? 'Plan & Define' : purpose === 'UI/Design' ? 'Design & Shape' : purpose === 'Coding' ? 'Build & Implement' : purpose === 'Optimization' ? 'Test & Refine' : purpose === 'Automation' ? 'Automate & Connect' : purpose,
        description: purpose === 'Planning' ? 'Clarify the scope, architecture, and next moves.' : purpose === 'UI/Design' ? 'Shape the interface, visuals, and experience.' : purpose === 'Coding' ? 'Turn the plan into a working product.' : purpose === 'Optimization' ? 'Check quality, performance, and reliability.' : purpose === 'Automation' ? 'Connect repeatable tasks and workflows.' : `Support the ${purpose.toLowerCase()} part of your work.`,
        alternatives: candidates,
      };
    })
    .filter(Boolean);

  return {
    ready: true,
    selectedGoal: goalProfile,
    stages,
    summary: stages.length ? `Your workflow has ${stages.length} relevant stage${stages.length === 1 ? '' : 's'}. Choose the tools that fit each one.` : 'No workflow stages matched this goal yet.',
  };
}
