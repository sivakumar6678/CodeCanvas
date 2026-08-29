import test from 'node:test';
import assert from 'node:assert/strict';

const EXT_MAP = {
  typescript: 'ts',
  javascript: 'js',
  python: 'py',
  rust: 'rs',
  go: 'go',
  sql: 'sql',
  html: 'html',
  css: 'css',
};

function formatProjectBlueprint(idea) {
  return `# Project Blueprint: ${idea.title}\n\n## Overview\n${idea.description}\n\n## Stack\n${idea.techStack.join(', ')}`;
}

test('Code snippet generator maps file extensions accurately', () => {
  assert.equal(EXT_MAP.typescript, 'ts');
  assert.equal(EXT_MAP.python, 'py');
  assert.equal(EXT_MAP.rust, 'rs');
  assert.equal(EXT_MAP.go, 'go');
  assert.equal(EXT_MAP.sql, 'sql');
});

test('Project idea blueprint generates valid Markdown specification', () => {
  const idea = {
    title: 'Realtime Code Collaboration',
    description: 'A multiplayer coding workspace with audio channels.',
    techStack: ['Next.js', 'WebSockets', 'WebRTC'],
  };

  const md = formatProjectBlueprint(idea);
  assert.match(md, /# Project Blueprint: Realtime Code Collaboration/);
  assert.match(md, /Next\.js, WebSockets, WebRTC/);
});

