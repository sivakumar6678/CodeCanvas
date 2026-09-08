import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidHttpUrl, evaluateToolHealth, computeCatalogMetrics } from './tool-health.js';

const SAMPLE_TOOLS = [
  {
    id: 'tool-1',
    name: 'Cursor AI',
    slug: 'cursor',
    category: 'ai-development',
    subCategory: 'Code Assistants',
    description: 'An AI-first code editor built for pair programming.',
    fullOverview: 'Cursor is a fork of VS Code with deep AI integration.',
    website: 'https://cursor.com',
    logoImageUrl: 'https://cursor.com/logo.png',
    bannerImageUrl: 'https://cursor.com/banner.png',
    pricingModel: 'Freemium',
    platforms: ['macOS', 'Windows', 'Linux'],
    tags: ['Editor', 'Coding', 'Productivity'],
    useCases: ['Code completion', 'Refactoring', 'Bug fixing'],
    status: 'active',
    featured: true,
    new: false,
    verified: true,
  },
  {
    id: 'tool-2',
    name: 'v0 by Vercel',
    slug: 'v0',
    category: 'ai-app-building',
    subCategory: 'UI Generators',
    description: 'Generative UI system powered by AI and React.',
    fullOverview: 'Generate shadcn/ui components with plain English prompts.',
    website: 'https://v0.dev',
    logoImageUrl: 'https://v0.dev/logo.png',
    bannerImageUrl: '', // Missing banner
    pricingModel: 'Free',
    platforms: ['Web'],
    tags: ['React', 'Frontend', 'Next.js'],
    useCases: ['UI prototyping', 'Component design'],
    status: 'active',
    featured: false,
    new: true,
    verified: true,
  },
  {
    id: 'tool-3',
    name: 'Legacy Generator',
    slug: 'legacy-generator',
    category: 'creative-ai',
    subCategory: 'Image Synthesis',
    description: 'Old AI tool with invalid link and missing logo.',
    fullOverview: '',
    website: 'invalid-url-without-protocol',
    logoImageUrl: '', // Missing logo
    bannerImageUrl: 'https://example.com/banner.png',
    pricingModel: 'Paid',
    platforms: ['Desktop'],
    tags: ['Images'],
    useCases: ['Art generation'],
    status: 'archived',
    featured: false,
    new: false,
    verified: false,
  },
  {
    id: 'tool-4',
    name: 'Draft Assistant',
    slug: 'draft-assistant',
    category: 'ai-assistants',
    subCategory: 'General Assistants',
    description: 'Work in progress tool pending review.',
    fullOverview: 'Not yet launched.',
    website: 'https://draft.ai',
    logoImageUrl: 'https://draft.ai/logo.png',
    bannerImageUrl: 'https://draft.ai/banner.png',
    pricingModel: 'Free',
    platforms: ['Web'],
    tags: ['Assistant'],
    useCases: ['Research'],
    status: 'draft',
    featured: false,
    new: true,
    verified: false,
  }
];

test('isValidHttpUrl validates HTTP/HTTPS protocols and hostnames', () => {
  assert.equal(isValidHttpUrl('https://codecraft.dev'), true);
  assert.equal(isValidHttpUrl('http://localhost:3000'), true);
  assert.equal(isValidHttpUrl('https://sub.domain.co/path?query=1'), true);

  // Invalid URLs
  assert.equal(isValidHttpUrl(''), false);
  assert.equal(isValidHttpUrl(null), false);
  assert.equal(isValidHttpUrl(undefined), false);
  assert.equal(isValidHttpUrl('cursor.com'), false);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('ftp://example.com'), false);
  assert.equal(isValidHttpUrl('Direct Apply'), false);
});

test('evaluateToolHealth accurately identifies missing images, broken URLs, and complete health', () => {
  // Tool 1: 100% Healthy
  const health1 = evaluateToolHealth(SAMPLE_TOOLS[0]);
  assert.equal(health1.isHealthy, true);
  assert.equal(health1.hasValidUrl, true);
  assert.equal(health1.missingImages, false);
  assert.equal(health1.missingMetadata, false);
  assert.equal(health1.brokenUrl, false);

  // Tool 2: Missing banner
  const health2 = evaluateToolHealth(SAMPLE_TOOLS[1]);
  assert.equal(health2.isHealthy, false);
  assert.equal(health2.missingImages, true);
  assert.equal(health2.hasBanner, false);
  assert.equal(health2.brokenUrl, false);

  // Tool 3: Broken URL + missing logo + missing overview
  const health3 = evaluateToolHealth(SAMPLE_TOOLS[2]);
  assert.equal(health3.isHealthy, false);
  assert.equal(health3.brokenUrl, true);
  assert.equal(health3.hasLogo, false);
  assert.equal(health3.missingMetadata, true);

  // Tool 4: Draft tool with all fields healthy
  const health4 = evaluateToolHealth(SAMPLE_TOOLS[3]);
  assert.equal(health4.isHealthy, true);
});

test('Catalog metrics calculate active, draft, archived, missing images, and health score', () => {
  let active = 0;
  let draft = 0;
  let archived = 0;
  let missingImages = 0;
  let missingMetadata = 0;
  let brokenUrls = 0;
  let healthyCount = 0;

  SAMPLE_TOOLS.forEach(t => {
    if (t.status === 'archived') archived++;
    else if (t.status === 'draft' || t.status === 'pending') draft++;
    else active++;

    const h = evaluateToolHealth(t);
    if (h.missingImages) missingImages++;
    if (h.missingMetadata) missingMetadata++;
    if (h.brokenUrl) brokenUrls++;
    if (h.isHealthy) healthyCount++;
  });

  const total = SAMPLE_TOOLS.length;
  const healthScore = Math.round((healthyCount / total) * 100);

  assert.equal(total, 4);
  assert.equal(active, 2);
  assert.equal(draft, 1);
  assert.equal(archived, 1);
  assert.equal(missingImages, 2); // Tool 2 (no banner) + Tool 3 (no logo)
  assert.equal(missingMetadata, 1); // Tool 3 (empty fullOverview)
  assert.equal(brokenUrls, 1); // Tool 3
  assert.equal(healthyCount, 2); // Tool 1 + Tool 4
  assert.equal(healthScore, 50); // 2 / 4 = 50%

  // Verify computeCatalogMetrics function directly
  const metrics = computeCatalogMetrics(SAMPLE_TOOLS);
  assert.deepEqual(metrics, {
    total: 4,
    active: 2,
    draft: 1,
    archived: 1,
    missingImages: 2,
    missingMetadata: 1,
    brokenUrls: 1,
    healthyCount: 2,
    healthScore: 50
  });
});

test('Deep search matches by name, category, subcategory, tags, and use cases', () => {
  function search(query) {
    const q = query.toLowerCase().trim();
    return SAMPLE_TOOLS.filter(t => {
      const matchName = t.name?.toLowerCase().includes(q);
      const matchSlug = t.slug?.toLowerCase().includes(q);
      const matchCategory = t.category?.toLowerCase().includes(q);
      const matchSubCategory = t.subCategory?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTags = Array.isArray(t.tags) && t.tags.some(tag => tag?.toLowerCase().includes(q));
      const matchUseCases = Array.isArray(t.useCases) && t.useCases.some(uc => uc?.toLowerCase().includes(q));

      return matchName || matchSlug || matchCategory || matchSubCategory || matchDesc || matchTags || matchUseCases;
    });
  }

  // Name match
  assert.equal(search('Cursor').length, 1);
  // Category match
  assert.equal(search('development').length, 1);
  // Subcategory match
  assert.equal(search('UI Generators').length, 1);
  // Tag match
  assert.equal(search('Next.js').length, 1);
  // Use case match
  assert.equal(search('Refactoring').length, 1);
  // Non-matching query
  assert.equal(search('NonExistentQueryXYZ').length, 0);
});

test('Pagination range builder handles short and long page lists with ellipsis', () => {
  function getPaginationRange(totalPages, currentPage) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }

  assert.deepEqual(getPaginationRange(5, 1), [1, 2, 3, 4, 5]);
  assert.deepEqual(getPaginationRange(10, 2), [1, 2, 3, 4, 5, '...', 10]);
  assert.deepEqual(getPaginationRange(10, 9), [1, '...', 6, 7, 8, 9, 10]);
  assert.deepEqual(getPaginationRange(10, 6), [1, '...', 5, 6, 7, '...', 10]);
});
