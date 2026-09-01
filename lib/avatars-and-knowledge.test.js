import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREDEFINED_AVATARS,
  isValidAvatarId,
  getAvatarPreset,
  resolveAvatarDisplay,
} from './avatars.js';
import {
  ALLOWED_KNOWLEDGE_TYPES,
  normalizeKnowledgeItem,
  validateKnowledgeItem,
  slugify,
} from './knowledge-schema.js';

test('Avatar preset system validates and resolves avatar identifiers', () => {
  assert.equal(PREDEFINED_AVATARS.length >= 10, true);

  // Check built-in avatar preset lookup
  assert.equal(isValidAvatarId('avatar-coder'), true);
  assert.equal(isValidAvatarId('avatar-robot'), true);
  assert.equal(isValidAvatarId('non-existent-avatar'), false);

  const coderPreset = getAvatarPreset('avatar-coder');
  assert.equal(coderPreset.id, 'avatar-coder');
  assert.equal(coderPreset.label, 'Developer');
  assert.equal(coderPreset.icon, '👨‍💻');

  // Resolve preset avatar
  const resolvedPreset = resolveAvatarDisplay('avatar-robot', 'Alex');
  assert.equal(resolvedPreset.type, 'preset');
  assert.equal(resolvedPreset.icon, '🤖');

  // Resolve external image URL
  const resolvedUrl = resolveAvatarDisplay('https://example.com/photo.jpg', 'Sam');
  assert.equal(resolvedUrl.type, 'url');
  assert.equal(resolvedUrl.url, 'https://example.com/photo.jpg');

  // Resolve fallback initials
  const resolvedFallback = resolveAvatarDisplay(null, 'Taylor Swift');
  assert.equal(resolvedFallback.type, 'initials');
  assert.equal(resolvedFallback.initial, 'T');
});

test('Knowledge schema correctly normalizes and validates diverse content types', () => {
  // Check allowed types
  assert.equal(ALLOWED_KNOWLEDGE_TYPES.includes('prompt'), true);
  assert.equal(ALLOWED_KNOWLEDGE_TYPES.includes('trick'), true);
  assert.equal(ALLOWED_KNOWLEDGE_TYPES.includes('shortcut'), true);
  assert.equal(ALLOWED_KNOWLEDGE_TYPES.includes('technique'), true);
  assert.equal(ALLOWED_KNOWLEDGE_TYPES.includes('guide'), true);

  // Normalization of prompt item
  const rawPrompt = {
    title: 'React Server Component Pattern',
    prompt_content: 'Design an async Server Component with streaming suspense boundary.',
    type: 'technique',
    ai_model: 'Claude 3.5 Sonnet',
    category: 'Development',
    tags: ['react', 'nextjs', 'ssr'],
  };

  const normalized = normalizeKnowledgeItem(rawPrompt);
  assert.equal(normalized.title, 'React Server Component Pattern');
  assert.equal(normalized.type, 'technique');
  assert.equal(normalized.id, 'react-server-component-pattern');
  assert.equal(normalized.tags.length, 3);
  assert.equal(validateKnowledgeItem(normalized), null);

  // Test direct support for slash-command type
  const rawSlash = {
    title: 'Git Commit Slash Command',
    content: '/commit generates conventional commit message',
    type: 'slash-command',
  };
  const normSlash = normalizeKnowledgeItem(rawSlash);
  assert.equal(normSlash.type, 'slash-command');
  assert.equal(normSlash.prompt_content, '/commit generates conventional commit message');
  assert.equal(validateKnowledgeItem(normSlash), null);

  // Test validation failures
  assert.equal(typeof validateKnowledgeItem({ title: 'Hi', prompt_content: 'Too short' }), 'string');
  assert.equal(typeof validateKnowledgeItem(null), 'string');
});

test('Slugify utility generates safe, clean slugs', () => {
  assert.equal(slugify('Next.js 15 & React 19 Best Practices!'), 'nextjs-15-react-19-best-practices');
  assert.equal(slugify('   Multiple   Spaces   '), 'multiple-spaces');
  assert.equal(slugify('').startsWith('item-'), true);
});
