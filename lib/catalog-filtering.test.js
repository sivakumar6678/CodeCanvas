import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE_OPTIONS, filterTools, getAvailableFilterOptions, getPaginationRange, paginateTools } from './catalog-filtering.js';

const mockCatalog = [
  {
    id: '1',
    name: 'Cursor',
    category: 'ai-development',
    subCategory: 'ai-ides',
    pricingModel: 'Freemium',
    hasFree: true,
    platforms: ['Desktop', 'VS Code'],
    useCases: ['coding-assistance', 'refactoring'],
    tags: ['ai-editor', 'code-generation'],
    featured: true,
    createdDate: '2026-01-10',
  },
  {
    id: '2',
    name: 'Claude Code',
    category: 'ai-development',
    subCategory: 'terminal-cli-agents',
    pricingModel: 'Paid',
    hasFree: false,
    platforms: ['CLI/Terminal', 'Desktop'],
    useCases: ['terminal-automation', 'coding-assistance'],
    tags: ['cli', 'agent', 'automation'],
    featured: false,
    createdDate: '2026-02-15',
  },
  {
    id: '3',
    name: 'v0 by Vercel',
    category: 'ai-app-building',
    subCategory: 'ui-to-code',
    pricingModel: 'Freemium',
    hasFree: true,
    platforms: ['Web'],
    useCases: ['ui-generation', 'mvp-building'],
    tags: ['react', 'nextjs', 'tailwind-css'],
    featured: true,
    createdDate: '2026-02-01',
  },
  {
    id: '4',
    name: 'Midjourney',
    category: 'creative-ai',
    subCategory: 'image-generation',
    pricingModel: 'Paid',
    hasFree: false,
    platforms: ['Web', 'Discord'],
    useCases: ['graphic-design', 'concept-art'],
    tags: ['image', 'art', 'design'],
    featured: true,
    createdDate: '2026-01-01',
  },
];

test('catalog pagination uses the supported page sizes with 25 as the default', () => {
  assert.equal(CATALOG_PAGE_SIZE, 25);
  assert.deepEqual(CATALOG_PAGE_SIZE_OPTIONS, [25, 50, 100, 200]);
  assert.ok(!CATALOG_PAGE_SIZE_OPTIONS.includes(500));
});

test('filterTools filters by category and subcategory', () => {
  const result = filterTools(mockCatalog, {
    category: 'ai-development',
    subCategory: 'terminal-cli-agents',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Claude Code');
});

test('filterTools filters by pricing, platform, and useCase', () => {
  const result = filterTools(mockCatalog, {
    pricing: 'freemium',
    platform: 'web',
    useCase: 'ui-generation',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'v0 by Vercel');
});

test('filterTools filters by tag and query', () => {
  const result = filterTools(mockCatalog, {
    tag: 'agent',
    query: 'claude',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Claude Code');
});

test('getAvailableFilterOptions extracts available facets for selected category', () => {
  const facets = getAvailableFilterOptions(mockCatalog, 'ai-development');
  assert.deepEqual(facets.subCategories, ['ai-ides', 'terminal-cli-agents']);
  assert.ok(facets.platforms.includes('CLI/Terminal'));
  assert.ok(facets.useCases.includes('coding-assistance'));
});

test('paginateTools returns the requested slice and display range', () => {
  const tools = Array.from({ length: 25 }, (_, index) => ({ id: String(index + 1) }));
  const result = paginateTools(tools, 2, 10);

  assert.equal(result.currentPage, 2);
  assert.equal(result.pageSize, 10);
  assert.equal(result.totalPages, 3);
  assert.equal(result.rangeStart, 11);
  assert.equal(result.rangeEnd, 20);
  assert.deepEqual(result.items.map((tool) => tool.id), Array.from({ length: 10 }, (_, index) => String(index + 11)));
});

test('paginateTools clamps invalid pages and handles empty results', () => {
  const tools = [{ id: '1' }, { id: '2' }];

  assert.equal(paginateTools(tools, 99, 1).currentPage, 2);
  assert.equal(paginateTools(tools, 0, 1).currentPage, 1);
  assert.deepEqual(paginateTools([], 4, 12), {
    items: [],
    pageSize: 12,
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    rangeStart: 0,
    rangeEnd: 0,
  });
});

test('getPaginationRange keeps compact ellipses for long catalogs', () => {
  assert.deepEqual(getPaginationRange(12, 1), [1, 2, 3, 4, 5, '...', 12]);
  assert.deepEqual(getPaginationRange(12, 6), [1, '...', 5, 6, 7, '...', 12]);
  assert.deepEqual(getPaginationRange(12, 12), [1, '...', 8, 9, 10, 11, 12]);
});
