import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreToolForUser, getPersonalizedRecommendations } from './recommendations.js';

const mockTools = [
  {
    id: 'cursor',
    slug: 'cursor',
    name: 'Cursor',
    description: 'AI-first code editor with deep codebase indexing and agent workflows.',
    category: 'ai-development',
    subCategory: 'ai-ides',
    pricingModel: 'Freemium',
    hasFree: true,
    featured: true,
    verified: true,
    platforms: ['Desktop (Mac/Win/Linux)', 'VS Code'],
    tags: ['ai-editor', 'code-generation', 'agentic', 'autocomplete'],
    useCases: ['full-codebase-editing', 'refactoring', 'coding-assistance'],
    bestFor: ['Professional developers', 'Full-stack engineers'],
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
    useCases: ['ui-generation', 'rapid-prototyping', 'mvp-building'],
    bestFor: ['Frontend engineers', 'Founders'],
  },
  {
    id: 'midjourney',
    slug: 'midjourney',
    name: 'Midjourney',
    description: 'Text-to-image AI generator for photo-realistic visuals and concept art.',
    category: 'creative-ai',
    subCategory: 'image-generation',
    pricingModel: 'Paid',
    hasFree: false,
    featured: true,
    verified: true,
    platforms: ['Web', 'Discord'],
    tags: ['image-generation', 'concept-art', 'visual-design'],
    useCases: ['concept-art', 'graphic-design', 'asset-creation'],
    bestFor: ['Digital artists', 'Designers'],
  },
  {
    id: 'chatgpt',
    slug: 'chatgpt',
    name: 'ChatGPT',
    description: 'General conversational AI assistant for research, synthesis, and writing.',
    category: 'ai-assistants',
    subCategory: 'general-assistants',
    pricingModel: 'Freemium',
    hasFree: true,
    featured: true,
    verified: true,
    platforms: ['Web', 'Mobile (iOS/Android)', 'Desktop'],
    tags: ['assistant', 'writing', 'research', 'reasoning'],
    useCases: ['research', 'content-drafting', 'brainstorming'],
    bestFor: ['Everyone', 'Researchers', 'Writers'],
  },
];

test('scoreToolForUser prioritizes developer tools for developer profile', () => {
  const devProfile = {
    role: 'Developer',
    experience_level: 'Advanced',
    interests: ['Web Development', 'AI Agents & Automation'],
    technologies: ['React / Next.js', 'VS Code'],
    goals: ['Speed up coding & implementation'],
    preferred_pricing: 'freemium',
  };

  const cursorScore = scoreToolForUser(mockTools[0], devProfile);
  const midjourneyScore = scoreToolForUser(mockTools[2], devProfile);

  assert.ok(cursorScore.score > midjourneyScore.score);
  assert.ok(cursorScore.fitReason.length > 0);
});

test('scoreToolForUser prioritizes creative tools for designer profile', () => {
  const designerProfile = {
    role: 'Designer',
    experience_level: 'Intermediate',
    interests: ['UI/UX Design'],
    technologies: ['Tailwind CSS'],
    goals: ['Improve UI design quality'],
    preferred_pricing: 'any',
  };

  const midjourneyScore = scoreToolForUser(mockTools[2], designerProfile);
  const cursorScore = scoreToolForUser(mockTools[0], designerProfile);

  assert.ok(midjourneyScore.score > cursorScore.score);
});

test('getPersonalizedRecommendations returns top ranked tools and handles empty preferences via fallback', () => {
  const emptyProfile = {};
  const recs = getPersonalizedRecommendations(mockTools, emptyProfile, [], { limit: 3 });

  assert.equal(recs.length, 3);
  assert.ok(recs[0].isFallback);
  assert.ok(recs[0].fitReason.length > 0);
});

test('getPersonalizedRecommendations integrates technology and goal matches', () => {
  const reactDevProfile = {
    role: 'Developer',
    experience_level: 'Intermediate',
    interests: ['Web Development'],
    technologies: ['React / Next.js', 'Tailwind CSS'],
    goals: ['Build full-stack MVPs faster'],
  };

  const recs = getPersonalizedRecommendations(mockTools, reactDevProfile, [], { limit: 2 });
  assert.ok(recs.length >= 2);
  const topToolSlugs = recs.map((r) => r.slug);
  assert.ok(topToolSlugs.includes('v0-by-vercel') || topToolSlugs.includes('cursor'));
});
