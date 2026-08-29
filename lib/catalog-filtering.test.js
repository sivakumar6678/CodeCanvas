import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTools, getAvailableFilterOptions } from './catalog-filtering.js';

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
