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

test('Multi-attribute filtering engine filters accurately across all dimensions', async () => {
  const { getCatalogFileForCategory } = await import('./catalog-categories.js');

  function filterCatalog(tools, filters, query) {
    return tools.filter(t => {
      if (query) {
        const q = query.toLowerCase().trim();
        const matchName = t.name?.toLowerCase().includes(q);
        const matchSlug = t.slug?.toLowerCase().includes(q);
        const matchCategory = t.category?.toLowerCase().includes(q);
        const matchSubCategory = t.subCategory?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchOverview = (t.fullOverview || t.overview || '').toLowerCase().includes(q);
        const matchTags = Array.isArray(t.tags) && t.tags.some(tag => tag?.toLowerCase().includes(q));
        const rawUseCases = Array.isArray(t.useCases) ? t.useCases : [];
        const matchUseCases = rawUseCases.some(uc => uc?.toLowerCase().includes(q));

        if (!matchName && !matchSlug && !matchCategory && !matchSubCategory && !matchDesc && !matchOverview && !matchTags && !matchUseCases) {
          return false;
        }
      }

      if (filters.category && filters.category !== 'all') {
        const matchesCategory = t.category === filters.category ||
          (getCatalogFileForCategory(t.category) && getCatalogFileForCategory(t.category) === getCatalogFileForCategory(filters.category));
        if (!matchesCategory) return false;
      }

      if (filters.subCategory && filters.subCategory !== 'all') {
        const toolSub = (t.subCategory || '').toLowerCase().trim();
        if (toolSub !== filters.subCategory.toLowerCase().trim()) return false;
      }

      if (filters.pricing && filters.pricing !== 'all') {
        const p = (t.pricingModel || t.pricing || 'Free').toLowerCase();
        const filterP = filters.pricing.toLowerCase();
        const isFreemium = p.includes('freemium');
        if (filterP === 'free' && (!p.includes('free') || (isFreemium && !p.includes('/')))) return false;
        if (filterP === 'freemium' && !isFreemium) return false;
        if (filterP === 'free / freemium' && !p.includes('free') && !isFreemium) return false;
        if (filterP === 'paid' && !p.includes('paid')) return false;
      }

      if (filters.platform && filters.platform !== 'all') {
        const toolPlatforms = Array.isArray(t.platforms) ? t.platforms : [];
        const targetP = filters.platform.toLowerCase();
        if (!toolPlatforms.some(p => p.toLowerCase().includes(targetP))) return false;
      }

      if (filters.status && filters.status !== 'all') {
        const isArchived = t.status === 'archived';
        const isDraft = t.status === 'draft' || t.status === 'pending';
        const isActive = !isArchived && !isDraft;

        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'draft' && !isDraft) return false;
        if (filters.status === 'archived' && !isArchived) return false;
        if (filters.status === 'featured' && !t.featured) return false;
      }

      if (filters.health && filters.health !== 'all') {
        const health = evaluateToolHealth(t);
        if (filters.health === 'healthy' && !health.isHealthy) return false;
        if (filters.health === 'broken-url' && !health.brokenUrl) return false;
        if (filters.health === 'missing-images' && !health.missingImages) return false;
        if (filters.health === 'missing-meta' && !health.missingMetadata) return false;
      }

      return true;
    });
  }

  // 1. Filter by category with alias: 'development' alias resolves to 'ai-development'
  const devAliasResult = filterCatalog(SAMPLE_TOOLS, { category: 'development' });
  assert.equal(devAliasResult.length, 1);
  assert.equal(devAliasResult[0].slug, 'cursor');

  // 2. Filter by pricing
  assert.equal(filterCatalog(SAMPLE_TOOLS, { pricing: 'Free' }).length, 2); // v0 (Free) + Draft Assistant (Free)
  assert.equal(filterCatalog(SAMPLE_TOOLS, { pricing: 'Paid' }).length, 1); // Legacy Generator (Paid)
  assert.equal(filterCatalog(SAMPLE_TOOLS, { pricing: 'Freemium' }).length, 1); // Cursor AI (Freemium)

  // 3. Filter by platform
  assert.equal(filterCatalog(SAMPLE_TOOLS, { platform: 'macOS' }).length, 1); // Cursor
  assert.equal(filterCatalog(SAMPLE_TOOLS, { platform: 'Web' }).length, 2); // v0 + Draft Assistant

  // 4. Filter by status
  assert.equal(filterCatalog(SAMPLE_TOOLS, { status: 'active' }).length, 2); // Cursor + v0
  assert.equal(filterCatalog(SAMPLE_TOOLS, { status: 'draft' }).length, 1); // Draft Assistant
  assert.equal(filterCatalog(SAMPLE_TOOLS, { status: 'archived' }).length, 1); // Legacy Generator
  assert.equal(filterCatalog(SAMPLE_TOOLS, { status: 'featured' }).length, 1); // Cursor

  // 5. Filter by health
  assert.equal(filterCatalog(SAMPLE_TOOLS, { health: 'healthy' }).length, 2); // Cursor + Draft Assistant
  assert.equal(filterCatalog(SAMPLE_TOOLS, { health: 'broken-url' }).length, 1); // Legacy Generator
  assert.equal(filterCatalog(SAMPLE_TOOLS, { health: 'missing-images' }).length, 2); // v0 + Legacy Generator
});

test('Real catalog integrity verification: 131 existing tools intact across 6 categories', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const catalogDir = path.join(process.cwd(), 'data/ai-tools');
  const files = (await fs.readdir(catalogDir)).filter(f => f.endsWith('.json'));

  assert.equal(files.length, 6, 'Must have exactly 6 catalog category files');

  let totalTools = 0;
  const slugSet = new Set();
  const idSet = new Set();

  for (const file of files) {
    const raw = await fs.readFile(path.join(catalogDir, file), 'utf8');
    const parsed = JSON.parse(raw);
    assert.ok(Array.isArray(parsed), `${file} must contain an array of tools`);
    totalTools += parsed.length;

    parsed.forEach((tool, index) => {
      assert.ok(tool.name, `Tool at ${file}[${index}] must have a name`);
      assert.ok(tool.slug, `Tool at ${file}[${index}] must have a slug`);
      assert.ok(tool.category, `Tool at ${file}[${index}] must have a category`);

      // Verify no duplicate slugs or IDs
      assert.ok(!slugSet.has(tool.slug), `Duplicate slug detected in catalog: ${tool.slug}`);
      slugSet.add(tool.slug);

      if (tool.id) {
        assert.ok(!idSet.has(tool.id), `Duplicate ID detected in catalog: ${tool.id}`);
        idSet.add(tool.id);
      }
    });
  }

  assert.ok(totalTools >= 131, 'Existing 131 catalog tools must remain intact (can grow)');
});
