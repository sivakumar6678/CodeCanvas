import test from 'node:test';
import assert from 'node:assert/strict';

test('Prompt placeholder extraction matches {{var}}, [VAR], and <VAR>', () => {
  const PLACEHOLDER_REGEX = /(\{\{[^}]+\}\}|\[[A-Z0-9_\s-]+\]|<[A-Z0-9_\s-]+>)/g;

  const extractVariables = (content = '') => {
    const matches = content.match(PLACEHOLDER_REGEX) || [];
    const unique = [];
    matches.forEach((raw) => {
      const cleanKey = raw.replace(/^(\{\{|\[|<)/, '').replace(/(\}\}|\]|>)$/, '').trim();
      if (cleanKey && !unique.some((u) => u.raw === raw)) {
        unique.push({ raw, key: cleanKey });
      }
    });
    return unique;
  };

  const text = 'Build a {{FRAMEWORK}} app with [DATABASE_TYPE] and <UI_LIBRARY>. Also connect {{FRAMEWORK}} to Supabase.';
  const vars = extractVariables(text);

  assert.equal(vars.length, 3);
  assert.equal(vars[0].key, 'FRAMEWORK');
  assert.equal(vars[1].key, 'DATABASE_TYPE');
  assert.equal(vars[2].key, 'UI_LIBRARY');

  // Test interpolation
  const values = {
    '{{FRAMEWORK}}': 'Next.js 16',
    '[DATABASE_TYPE]': 'PostgreSQL',
    '<UI_LIBRARY>': 'Tailwind CSS'
  };

  let interpolated = text;
  vars.forEach(({ raw }) => {
    interpolated = interpolated.split(raw).join(values[raw]);
  });

  assert.equal(
    interpolated,
    'Build a Next.js 16 app with PostgreSQL and Tailwind CSS. Also connect Next.js 16 to Supabase.'
  );
});

