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
 * strictly implementing the 3-tier fallback order:
 * Tier 1: Exact / Use-Case Match
 * Tier 2: Category Match
 * Tier 3: Related / Popular Tools
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
  const experience = String(criteria.experience || 'any').toLowerCase();
  const budget = String(criteria.budget || criteria.preferred_pricing || 'any').toLowerCase();
  const technologies = toLowerList(criteria.technologies || []);
  const interests = toLowerList(criteria.interests || []);
  const preferredPlatforms = toLowerList(criteria.platforms || criteria.preferred_platforms || []);
  const primaryGoal = String(criteria.primaryGoal || 'speed').toLowerCase();

  // 1. Budget hard filtering check
  if (budget === 'free' && toolPricing.includes('paid') && !tool.hasFree && !toolPricing.includes('free')) {
    // Paid tool when user strictly wants free
    return null;
  }

  // 2. Platform compatibility bonus / penalty
  let platformMatchCount = 0;
  if (preferredPlatforms.length > 0) {
    platformMatchCount = preferredPlatforms.filter((p) =>
      lowerPlatforms.some((tp) => tp.includes(p) || p.includes(tp))
    ).length;
  }

  // Match highlights collection
  const matchHighlights = [];

  // Technology highlights
  const techMatches = technologies.filter((tech) =>
    toolText.includes(tech) || lowerTags.some((t) => t.includes(tech)) || lowerPlatforms.some((p) => p.includes(tech))
  );
  if (techMatches.length > 0) {
    matchHighlights.push(...techMatches.slice(0, 2));
  }

  // Determine purpose
  let primaryPurpose = 'Coding';
  for (const purpose of (goalProfile.purposeOrder || PURPOSE_ORDER)) {
    const keywords = PURPOSE_KEYWORDS[purpose] || [];
    if (containsAny(toolText, keywords)) {
      primaryPurpose = purpose;
      break;
    }
  }

  // =========================================================================
  // TIER EVALUATION:
  // =========================================================================

  // Check for Exact / Use-Case Match (Tier 1)
  const exactUseCaseMatch = lowerUseCases.some((uc) =>
    goalProfile.keywords.some((kw) => uc.includes(kw) || kw.includes(uc))
  );
  const exactBestForMatch = lowerBestFor.some((bf) =>
    goalProfile.keywords.some((kw) => bf.includes(kw) || kw.includes(bf))
  );
  const exactSubCatMatch = (goalProfile.preferredSubCategories || []).some((sc) =>
    tool.subCategory.includes(sc) || sc.includes(tool.subCategory)
  );
  const exactTechMatch = techMatches.length > 0;

  const isTier1 = (exactUseCaseMatch || exactBestForMatch || exactSubCatMatch) &&
    (goalProfile.preferredCategories || []).includes(tool.category);

  if (isTier1) {
    let score = 80;
    if (exactUseCaseMatch) score += 12;
    if (exactSubCatMatch) score += 10;
    if (exactTechMatch) score += 10;
    if (tool.verified) score += 6;
    if (tool.featured) score += 4;
    if (platformMatchCount > 0) score += 6;

    let fitReason = `Exact match for ${goalProfile.label.toLowerCase()} workflows`;
    if (techMatches.length > 0) {
      fitReason = `Direct match for ${goalProfile.label.toLowerCase()} with ${techMatches[0]}.`;
    } else if (exactUseCaseMatch && tool.useCases.length > 0) {
      fitReason = `Tailored for ${tool.useCases[0].replace(/-/g, ' ')} and ${goalProfile.label.toLowerCase()}.`;
    } else if (exactSubCatMatch) {
      fitReason = `Dedicated ${tool.subCategory.replace(/-/g, ' ')} tool for this workflow.`;
    }

    return {
      ...tool,
      tier: 'exact',
      tierLabel: 'Exact Match',
      tierPriority: 1,
      fitScore: score,
      fitReason,
      matchHighlights,
      purpose: primaryPurpose,
    };
  }

  // Check for Category Match (Tier 2)
  const isCategoryMatch = (goalProfile.preferredCategories || []).includes(tool.category) ||
    (ROLE_AFFINITIES[role]?.categories || []).includes(tool.category);

  if (isCategoryMatch) {
    let score = 55;
    if (tool.verified) score += 8;
    if (tool.featured) score += 6;
    if (containsAny(toolText, goalProfile.keywords)) score += 8;
    if (exactTechMatch) score += 6;
    if (platformMatchCount > 0) score += 4;

    const catName = tool.category.replace(/^ai-/, '').replace(/-/g, ' ');
    const fitReason = `Category match: high-performing ${catName} tool suited for this project.`;

    return {
      ...tool,
      tier: 'category',
      tierLabel: 'Category Match',
      tierPriority: 2,
      fitScore: score,
      fitReason,
      matchHighlights,
      purpose: primaryPurpose,
    };
  }

  // Fallback: Related / Popular Tools (Tier 3)
  const isPopularCandidate = tool.featured || tool.verified || containsAny(toolText, ['assistant', 'productivity', 'code', 'builder']);
  if (isPopularCandidate) {
    let score = 30;
    if (tool.featured) score += 10;
    if (tool.verified) score += 8;
    if (tool.hasFree) score += 4;

    const fitReason = tool.featured
      ? 'Popular community favorite to complement this workflow.'
      : 'Curated versatile tool to support your workflow stages.';

    return {
      ...tool,
      tier: 'popular',
      tierLabel: 'Popular Tool',
      tierPriority: 3,
      fitScore: score,
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
  const goalProfile = getGoalProfile(selection.goalId || selection.goal);
  const normalizedTools = (tools || []).map(normalizeTool);

  if (!selection.goalId && !selection.goal) {
    return {
      ready: false,
      selectedGoal: null,
      summary: 'Choose a project goal above to generate your customized AI toolkit.',
      groups: [],
      matchingTools: [],
      totalTools: normalizedTools.length,
    };
  }

  // Score all tools against the goal & criteria
  const scored = [];
  for (const rawTool of normalizedTools) {
    const evaluated = scoreToolkitTool(rawTool, goalProfile, selection);
    if (evaluated) {
      scored.push(evaluated);
    }
  }

  // Sort by tierPriority (exact: 1, category: 2, popular: 3) then fitScore descending
  scored.sort((a, b) => {
    if (a.tierPriority !== b.tierPriority) {
      return a.tierPriority - b.tierPriority;
    }
    return b.fitScore - a.fitScore;
  });

  // Pick small, focused set (maximum 6 tools overall)
  // Ensure we cover distinct workflow stages where possible
  const purposeOrder = goalProfile.purposeOrder || PURPOSE_ORDER;
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
  const groups = [];
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

      groups.push({
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
  const topTools = [...groups.flatMap((g) => g.tools)].sort((a, b) => {
    if (a.tierPriority !== b.tierPriority) {
      return a.tierPriority - b.tierPriority;
    }
    return b.fitScore - a.fitScore;
  });

  // Counts of each tier in top tools
  const exactCount = topTools.filter((t) => t.tier === 'exact').length;
  const categoryCount = topTools.filter((t) => t.tier === 'category').length;
  const popularCount = topTools.filter((t) => t.tier === 'popular').length;

  let summary = `Assembled ${topTools.length} focused tools for ${goalProfile.label.toLowerCase()}.`;
  if (exactCount > 0) {
    summary += ` Includes ${exactCount} direct use-case match${exactCount === 1 ? '' : 'es'}.`;
  }

  return {
    ready: true,
    selectedGoal: goalProfile,
    summary,
    groups,
    matchingTools: topTools,
    tierBreakdown: { exact: exactCount, category: categoryCount, popular: popularCount },
    totalTools: normalizedTools.length,
  };
}
