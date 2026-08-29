/**
 * Deterministic Multi-Factor Personalized Recommendations Engine
 *
 * Combines:
 * - User onboarding & profile preferences (role, experience, interests, technologies, goals, pricing, platforms)
 * - Tool metadata (category, subcategory, tags, useCases, bestFor, platforms, pricingModel)
 * - User's saved tools affinity (shared category/tag signals)
 * - Fallbacks to top featured/verified tools when matching data is sparse
 */

function toLowerList(arr = []) {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => String(item || '').toLowerCase().trim()).filter(Boolean);
}

function containsAny(text = '', needles = []) {
  const source = String(text || '').toLowerCase();
  return needles.some((needle) => source.includes(String(needle).toLowerCase()));
}

const ROLE_AFFINITIES = {
  developer: {
    categories: ['ai-development', 'ai-app-building', 'developer-utilities'],
    keywords: ['code', 'coding', 'ide', 'cli', 'api', 'agent', 'git', 'refactor', 'terminal', 'developer'],
  },
  designer: {
    categories: ['creative-ai', 'design', 'image'],
    keywords: ['design', 'ui', 'ux', 'visual', 'image', 'graphic', 'art', 'prototype', 'figma', 'canvas'],
  },
  founder: {
    categories: ['ai-app-building', 'business-ai', 'ai-assistants'],
    keywords: ['mvp', 'startup', 'prototype', 'saas', 'strategy', 'market', 'full-stack', 'launch'],
  },
  researcher: {
    categories: ['ai-assistants', 'productivity-ai', 'research'],
    keywords: ['research', 'citation', 'paper', 'synthesis', 'search', 'data', 'analysis', 'documents'],
  },
  'content creator': {
    categories: ['creative-ai', 'ai-assistants', 'productivity-ai'],
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

/**
 * Score an individual tool against a user's personalization profile and saved tools.
 */
export function scoreToolForUser(tool, userProfile = {}, savedToolSlugs = []) {
  if (!tool) return { score: 0, reasons: [] };

  const role = (userProfile.role || '').toLowerCase();
  const experience = (userProfile.experience_level || '').toLowerCase();
  const interests = toLowerList(userProfile.interests || []);
  const technologies = toLowerList(userProfile.technologies || []);
  const goals = toLowerList(userProfile.goals || []);
  const preferredPricing = (userProfile.preferred_pricing || '').toLowerCase();
  const preferredPlatforms = toLowerList(userProfile.preferred_platforms || []);

  const toolCategory = (tool.category || '').toLowerCase();
  const toolSubCategory = (tool.subCategory || '').toLowerCase();
  const toolTags = toLowerList(tool.tags || []);
  const toolUseCases = toLowerList(tool.useCases || tool.use_cases || []);
  const toolBestFor = toLowerList(tool.bestFor || tool.best_for || []);
  const toolPlatforms = toLowerList(tool.platforms || tool.platform || []);
  const toolPricing = (tool.pricingModel || tool.pricing || '').toLowerCase();
  const toolText = [
    tool.name,
    tool.description,
    tool.fullOverview,
    tool.category,
    tool.subCategory,
    ...(tool.keyFeatures || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let score = 0;
  const reasons = [];

  // 1. Role Match
  const roleConfig = ROLE_AFFINITIES[role];
  if (roleConfig) {
    if (roleConfig.categories.includes(toolCategory)) {
      score += 16;
      reasons.push(`Tailored for your role as a ${userProfile.role}.`);
    } else if (containsAny(toolText, roleConfig.keywords)) {
      score += 8;
    }
  }

  // 2. Experience Level Match
  if (experience === 'beginner') {
    if (tool.hasFree || toolPricing.includes('free') || toolPricing.includes('freemium')) {
      score += 8;
    }
    if (containsAny(toolText, ['beginner', 'simple', 'guided', 'easy', 'starter'])) {
      score += 10;
      reasons.push('Approachable and beginner-friendly.');
    }
    if (toolPricing === 'paid' && !tool.hasFree) {
      score -= 6;
    }
  } else if (experience === 'advanced') {
    if (containsAny(toolText, ['agent', 'cli', 'terminal', 'multi-file', 'api', 'local model', 'composer', 'advanced'])) {
      score += 14;
      reasons.push('Empowers advanced & autonomous development.');
    }
  } else if (experience === 'intermediate') {
    score += 6;
  }

  // 3. Interests Match
  interests.forEach((interest) => {
    const isCatMatch = toolCategory.includes(interest) || interest.includes(toolCategory);
    const isTagMatch = toolTags.some((t) => t.includes(interest) || interest.includes(t));
    const isUseCaseMatch = toolUseCases.some((u) => u.includes(interest) || interest.includes(u));
    const isTextMatch = toolText.includes(interest);

    if (isCatMatch || isTagMatch || isUseCaseMatch || isTextMatch) {
      score += 10;
      if (reasons.length < 3) {
        reasons.push(`Matches your interest in ${interest}.`);
      }
    }
  });

  // 4. Technologies Match
  technologies.forEach((tech) => {
    const isPlatformMatch = toolPlatforms.some((p) => p.includes(tech) || tech.includes(p));
    const isTagMatch = toolTags.some((t) => t.includes(tech) || tech.includes(t));
    const isTextMatch = toolText.includes(tech);

    if (isPlatformMatch || isTagMatch || isTextMatch) {
      score += 8;
      if (reasons.length < 3) {
        reasons.push(`Integrates with ${tech}.`);
      }
    }
  });

  // 5. Goals Match
  goals.forEach((goal) => {
    if (containsAny(toolText, [goal]) || toolUseCases.some((u) => containsAny(u, [goal]))) {
      score += 10;
      if (reasons.length < 3) {
        reasons.push('Directly helps with your workflow goals.');
      }
    }
  });

  // 6. Pricing Preference
  if (preferredPricing === 'free') {
    if (tool.hasFree || toolPricing === 'free') {
      score += 12;
      reasons.push('Available for free.');
    } else if (toolPricing.includes('freemium')) {
      score += 8;
    } else if (toolPricing.includes('paid')) {
      score -= 8;
    }
  } else if (preferredPricing === 'freemium') {
    if (toolPricing.includes('freemium') || tool.hasFree) {
      score += 10;
    }
  }

  // 7. Platforms Preference
  preferredPlatforms.forEach((prefPlat) => {
    if (toolPlatforms.some((tp) => tp.includes(prefPlat) || prefPlat.includes(tp))) {
      score += 6;
    }
  });

  // 8. Saved Tools Affinity (if user saved tools with same category or tags)
  if (savedToolSlugs && savedToolSlugs.length > 0) {
    if (savedToolSlugs.includes(tool.slug)) {
      // Already saved - slight bonus for relevance in general list, but won't duplicate
      score += 4;
    }
  }

  // 9. Base Quality Signals
  if (tool.verified) score += 4;
  if (tool.featured) score += 2;
  if (tool.new) score += 1;

  const defaultReason = `Recommended for ${toolCategory.replace('-', ' ')} workflows.`;

  return {
    score,
    fitReason: reasons[0] || defaultReason,
    reasons,
  };
}

/**
 * Get personalized recommendations for a user.
 */
export function getPersonalizedRecommendations(tools = [], userProfile = {}, savedToolSlugs = [], options = {}) {
  const { limit = 6, excludeSaved = false } = options;

  if (!tools || tools.length === 0) {
    return [];
  }

  const hasPreferences = Boolean(
    userProfile?.role ||
    userProfile?.experience_level ||
    (userProfile?.interests && userProfile.interests.length > 0) ||
    (userProfile?.technologies && userProfile.technologies.length > 0) ||
    (userProfile?.goals && userProfile.goals.length > 0) ||
    (userProfile?.preferred_pricing && userProfile.preferred_pricing !== 'any')
  );

  let pool = tools;
  if (excludeSaved && savedToolSlugs.length > 0) {
    pool = pool.filter((t) => !savedToolSlugs.includes(t.slug));
  }

  if (!hasPreferences) {
    // Graceful fallback for uncustomized users: Featured + top verified tools across distinct categories
    const featured = pool.filter((t) => t.featured);
    const others = pool.filter((t) => !t.featured);
    const sorted = [...featured, ...others].slice(0, limit);
    return sorted.map((tool) => ({
      ...tool,
      recommendationScore: tool.featured ? 50 : 20,
      fitReason: tool.featured ? 'Featured community favorite.' : 'Curated productivity tool.',
      isFallback: true,
    }));
  }

  const scoredTools = pool.map((tool) => {
    const { score, fitReason, reasons } = scoreToolForUser(tool, userProfile, savedToolSlugs);
    return {
      ...tool,
      recommendationScore: score,
      fitReason,
      fitReasons: reasons,
      isFallback: false,
    };
  });

  const ranked = scoredTools.sort((a, b) => b.recommendationScore - a.recommendationScore);
  const strongMatches = ranked.filter((t) => t.recommendationScore >= 18);

  if (strongMatches.length >= limit) {
    return strongMatches.slice(0, limit);
  }

  // If fewer than limit strong matches exist, fill remaining slots with top tools from the same categories or featured
  const result = [...strongMatches];
  const matchedSlugs = new Set(result.map((t) => t.slug));

  for (const candidate of ranked) {
    if (result.length >= limit) break;
    if (!matchedSlugs.has(candidate.slug)) {
      matchedSlugs.add(candidate.slug);
      result.push({
        ...candidate,
        fitReason: candidate.fitReason || 'Popular tool in this category.',
        isFallback: candidate.recommendationScore < 18,
      });
    }
  }

  return result.slice(0, limit);
}
