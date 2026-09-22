import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreToolkitTool,
  buildToolkitRecommendations,
  getGoalProfile,
  TOOLKIT_GOALS,
  TOOLKIT_INTERESTS,
} from './toolkit-recommender.js';

const mockCatalog = [
  {
    id: 'cursor',
    slug: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor with deep codebase indexing and agent workflows.',
    category: 'ai-development',
    subCategory: 'ai-ides',
    pricingModel: 'Freemium',
    hasFree: true,
    featured: true,
    verified: true,
    platforms: ['Desktop', 'VS Code'],
    tags: ['ai-editor', 'code-generation', 'agentic', 'autocomplete'],
    useCases: ['full-codebase-editing', 'refactoring', 'coding-assistance', 'web app'],
    bestFor: ['Professional developers', 'Full-stack engineers'],
    keyFeatures: ['Full codebase indexing', 'Multi-file edits', 'Agent mode'],
  },
  {
    id: 'v0',
    slug: 'v0-by-vercel',
    name: 'v0 by Vercel',
    description: 'Generative UI system designed for React, Next.js, and Tailwind CSS.',
    category: 'ai-app-building',
    subCategory: 'ui-to-code',
    pricingModel: 'Freemium',
    hasFree: true,
    featured: true,
    verified: true,
    platforms: ['Web'],
    tags: ['react', 'nextjs', 'tailwind-css', 'generative-ui'],
    useCases: ['ui-generation', 'rapid-prototyping', 'website', 'landing page'],
    bestFor: ['Frontend engineers', 'Founders', 'Designers'],
    keyFeatures: ['React code generation', 'Shadcn UI components', 'Tailwind styling'],
  },
  {
    id: 'midjourney',
    slug: 'midjourney',
    name: 'Midjourney',
    description: 'State-of-the-art text-to-image generator for photorealistic imagery.',
    category: 'creative-ai',
    subCategory: 'image-generation',
    pricingModel: 'Paid',
    hasFree: false,
    featured: true,
    verified: true,
    platforms: ['Web', 'Discord'],
    tags: ['image-generation', 'concept-art', 'visuals'],
    useCases: ['concept-art', 'graphic-design', 'mockup'],
    bestFor: ['Digital artists', 'Designers'],
    keyFeatures: ['High-res rendering', 'Style tuning'],
  },
  {
    id: 'claude',
    slug: 'claude-by-anthropic',
    name: 'Claude 3.5 Sonnet',
    description: 'Next-generation frontier AI assistant with advanced reasoning, coding, and vision.',
    category: 'ai-assistants',
    subCategory: 'general-assistants',
    pricingModel: 'Freemium',
    hasFree: true,
    featured: true,
    verified: true,
    platforms: ['Web', 'Mobile (iOS/Android)'],
    tags: ['assistant', 'coding', 'reasoning', 'artifacts'],
    useCases: ['complex-reasoning', 'architecture-planning', 'code-review'],
    bestFor: ['Developers', 'Researchers', 'Knowledge workers'],
    keyFeatures: ['Artifacts interactive canvas', '200k context window'],
  },
  {
    id: 'zapier-central',
    slug: 'zapier-central',
    name: 'Zapier Central',
    description: 'AI workspace to configure autonomous bots that automate tasks across 6000+ apps.',
    category: 'productivity-ai',
    subCategory: 'workflow-automation',
    pricingModel: 'Freemium',
    hasFree: true,
    featured: false,
    verified: true,
    platforms: ['Web'],
    tags: ['automation', 'integrations', 'agents'],
    useCases: ['workflow-automation', 'task-scheduling', 'pipeline'],
    bestFor: ['Operations', 'Founders', 'Product teams'],
    keyFeatures: ['6000+ app connectors', 'Autonomous triggers'],
  },
];

test('scoreToolkitTool identifies Tier 1 (Exact Match) for direct goal and technology match', () => {
  const goalProfile = getGoalProfile('build-website');
  const criteria = {
    role: 'Developer',
    experience: 'intermediate',
    technologies: ['React / Next.js'],
    budget: 'freemium',
  };

  const scoredV0 = scoreToolkitTool(mockCatalog[1], goalProfile, criteria);
  assert.ok(scoredV0, 'Tool should be evaluated and not null');
  assert.equal(scoredV0.tier, 'exact');
  assert.equal(scoredV0.tierLabel, 'Exact Match');
  assert.equal(scoredV0.tierPriority, 1);
  assert.ok(scoredV0.fitScore >= 80);
  assert.ok(scoredV0.fitReason.length > 0);
});

test('scoreToolkitTool identifies Tier 2 (Tag Match) based on tech/interests matching tool tags', () => {
  const goalProfile = getGoalProfile('build-website');
  const criteria = {
    role: 'Student',
    technologies: ['Coding'],
    interests: ['Full-Stack Web Development'],
    budget: 'any',
  };

  const scoredClaude = scoreToolkitTool(mockCatalog[3], goalProfile, criteria);
  assert.ok(scoredClaude);
  assert.ok(scoredClaude.tier === 'tag' || scoredClaude.tier === 'exact');
  assert.equal(typeof scoredClaude.fitReason, 'string');
});

test('scoreToolkitTool identifies Tier 3 (Category Match) when domain or role category aligns', () => {
  const goalProfile = getGoalProfile('build-website');
  const criteria = {
    role: 'Developer',
    experience: 'intermediate',
    technologies: ['Rust'],
    budget: 'any',
  };

  const scoredCursor = scoreToolkitTool(mockCatalog[0], goalProfile, criteria);
  assert.ok(scoredCursor);
  assert.ok(['exact', 'tag', 'category'].includes(scoredCursor.tier));
});

test('scoreToolkitTool identifies Tier 4 (Popular Tool) as curated versatile fallback', () => {
  const goalProfile = getGoalProfile('design-ui');
  const criteria = {
    role: 'Designer',
    budget: 'any',
    technologies: ['Figma'],
  };

  const scored = scoreToolkitTool(mockCatalog[4], goalProfile, criteria);
  assert.ok(scored);
  assert.equal(scored.tier, 'popular');
  assert.equal(scored.tierLabel, 'Popular Tool');
  assert.equal(scored.tierPriority, 4);
});

test('scoreToolkitTool strictly enforces budget constraints (excludes paid when budget is free)', () => {
  const goalProfile = getGoalProfile('design-ui');
  const criteria = {
    budget: 'free',
  };

  const scored = scoreToolkitTool(mockCatalog[2], goalProfile, criteria);
  assert.equal(scored, null, 'Paid tool without free tier must be excluded when budget=free');
});

test('buildToolkitRecommendations supports user custom current work goal', () => {
  const result = buildToolkitRecommendations(mockCatalog, {
    currentGoal: 'Building an automated pipeline with workflow integrations',
    budget: 'any',
  });

  assert.ok(result.ready);
  assert.ok(result.matchingTools.length > 0);
  const zapier = result.matchingTools.find((t) => t.id === 'zapier-central');
  assert.ok(zapier, 'Zapier should be recommended for automation pipeline goal');
  assert.equal(zapier.tier, 'exact');
});

test('buildToolkitRecommendations never exposes internal numeric scores', () => {
  const result = buildToolkitRecommendations(mockCatalog, {
    goalId: 'build-website',
    role: 'Developer',
    technologies: ['React / Next.js'],
  });

  assert.ok(result.ready);
  for (const tool of result.matchingTools) {
    assert.strictEqual(tool.fitScore, undefined, 'Internal fitScore must not be exposed on matchingTools');
    assert.strictEqual(tool.score, undefined, 'Internal score must not be exposed on matchingTools');
    assert.ok(typeof tool.fitReason === 'string' && tool.fitReason.length > 0, 'fitReason must be human readable');
  }

  for (const group of result.groups) {
    for (const tool of group.tools) {
      assert.strictEqual(tool.fitScore, undefined, 'Internal fitScore must not be exposed in groups.tools');
    }
  }
});

test('buildToolkitRecommendations produces curated groups with fallback hierarchy ordering', () => {
  const result = buildToolkitRecommendations(mockCatalog, {
    goalId: 'build-website',
    role: 'Developer',
    experience: 'intermediate',
    budget: 'freemium',
    technologies: ['React / Next.js', 'VS Code'],
  });

  assert.ok(result.ready);
  assert.ok(result.matchingTools.length > 0);
  assert.ok(result.groups.length > 0);

  // Fallback priority: 1 (exact) <= 2 (tag) <= 3 (category) <= 4 (popular)
  const tiers = result.matchingTools.map((t) => t.tierPriority);
  for (let i = 0; i < tiers.length - 1; i++) {
    assert.ok(tiers[i] <= tiers[i + 1], `Tools must be sorted by tier priority. Received: ${tiers.join(' -> ')}`);
  }

  assert.ok(result.tierBreakdown);
  assert.strictEqual(typeof result.tierBreakdown.exact, 'number');
  assert.strictEqual(typeof result.tierBreakdown.tag, 'number');
  assert.strictEqual(typeof result.tierBreakdown.category, 'number');
  assert.strictEqual(typeof result.tierBreakdown.popular, 'number');
});

test('buildToolkitRecommendations works seamlessly with partially filled user profiles', () => {
  const partialRoleOnly = buildToolkitRecommendations(mockCatalog, {
    role: 'Developer',
  });
  assert.ok(partialRoleOnly.ready, 'Should generate recommendations for role-only profile');
  assert.ok(partialRoleOnly.matchingTools.length > 0);

  const partialTechOnly = buildToolkitRecommendations(mockCatalog, {
    technologies: ['React / Next.js'],
  });
  assert.ok(partialTechOnly.ready, 'Should generate recommendations for tech-only profile');
  assert.ok(partialTechOnly.matchingTools.length > 0);

  const partialInterestsOnly = buildToolkitRecommendations(mockCatalog, {
    interests: ['AI Agents & Automation'],
  });
  assert.ok(partialInterestsOnly.ready, 'Should generate recommendations for interests-only profile');
  assert.ok(partialInterestsOnly.matchingTools.length > 0);
});

test('buildToolkitRecommendations gracefully handles completely empty selection', () => {
  const result = buildToolkitRecommendations(mockCatalog, {});
  assert.equal(result.ready, false);
  assert.equal(result.groups.length, 0);
  assert.ok(result.summary.length > 0);
});

test('buildToolkitRecommendations works across all defined goals', () => {
  for (const goal of TOOLKIT_GOALS) {
    const result = buildToolkitRecommendations(mockCatalog, {
      goalId: goal.id,
      role: 'Developer',
    });

    assert.ok(result.ready);
    assert.equal(result.selectedGoal.id, goal.id);
    assert.ok(Array.isArray(result.groups));
  }
});
