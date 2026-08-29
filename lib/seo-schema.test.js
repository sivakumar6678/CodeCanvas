import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToolSchema, generatePromptSchema, generateBreadcrumbSchema } from './seo-schema.js';

test('generateToolSchema builds valid SoftwareApplication JSON-LD', () => {
  const tool = {
    name: 'Cursor',
    slug: 'cursor',
    description: 'AI Code Editor',
    fullOverview: 'Cursor is built on VS Code with native AI intelligence.',
    category: 'development',
    pricingModel: 'Freemium',
    hasFree: true,
    platforms: ['Mac', 'Windows', 'Linux'],
    logoImageUrl: 'https://example.com/cursor.png'
  };

  const schema = generateToolSchema(tool, 'https://codecraft.dev');

  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'SoftwareApplication');
  assert.equal(schema.name, 'Cursor');
  assert.equal(schema.applicationCategory, 'developmentApplication');
  assert.equal(schema.operatingSystem, 'Mac, Windows, Linux');
  assert.equal(schema.offers.price, '0.00');
  assert.equal(schema.url, 'https://codecraft.dev/ai-tools/tool/cursor');
  assert.equal(schema.image, 'https://example.com/cursor.png');
});

test('generatePromptSchema builds valid CreativeWork JSON-LD', () => {
  const prompt = {
    title: 'Next.js App Router Architecture Prompt',
    description: 'Generates robust Next.js 16 App Router folder layouts.',
    prompt_content: 'Act as a Senior Next.js engineer and design {{architecture}} for {{app_name}}.',
    ai_model: 'Claude 3.5 Sonnet',
    category: 'Coding',
    type: 'prompt',
    display_name: 'Alex Developer',
    is_anonymous: false
  };

  const schema = generatePromptSchema(prompt, 'https://codecraft.dev');

  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'CreativeWork');
  assert.equal(schema.name, 'Next.js App Router Architecture Prompt');
  assert.equal(schema.author.name, 'Alex Developer');
  assert.match(schema.keywords, /Claude 3.5 Sonnet/);
});

test('generateBreadcrumbSchema formats BreadcrumbList with positions', () => {
  const items = [
    { name: 'Home', url: '/' },
    { name: 'AI Tools', url: '/ai-tools' },
    { name: 'Development', url: '/ai-tools/development' }
  ];

  const schema = generateBreadcrumbSchema(items, 'https://codecraft.dev');

  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.equal(schema.itemListElement.length, 3);
  assert.equal(schema.itemListElement[0].position, 1);
  assert.equal(schema.itemListElement[0].item, 'https://codecraft.dev/');
  assert.equal(schema.itemListElement[2].name, 'Development');
});

