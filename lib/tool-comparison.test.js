import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatToolComparisonValue,
  getToolComparisonFields,
  TOOL_COMPARISON_FIELD_ORDER,
} from './tool-comparison.js';

const catalog = JSON.parse(readFileSync(new URL('../data/ai-tools/ai-development.json', import.meta.url), 'utf8'));

test('Google Antigravity comparison starts with the shared canonical field order', () => {
  const existing = catalog.find((tool) => tool.name === 'Google Antigravity');
  assert.ok(existing);
  const incoming = {
    ...Object.fromEntries(Object.entries(existing).reverse()),
    featured: true,
    status: '',
    additionalData: { imported: true },
  };
  const existingKeysBefore = Object.keys(existing);
  const incomingKeysBefore = Object.keys(incoming);

  const fields = getToolComparisonFields(existing, incoming);
  assert.deepEqual(fields.slice(0, TOOL_COMPARISON_FIELD_ORDER.length), TOOL_COMPARISON_FIELD_ORDER);
  assert.deepEqual(fields.slice(TOOL_COMPARISON_FIELD_ORDER.length), ['additionalData', 'createdDate']);
  assert.deepEqual(Object.keys(existing), existingKeysBefore);
  assert.deepEqual(Object.keys(incoming), incomingKeysBefore);
  assert.equal(formatToolComparisonValue(existing, 'featured'), 'false');
  assert.equal(formatToolComparisonValue(incoming, 'featured'), 'true');
  assert.equal(formatToolComparisonValue(existing, 'hasFree'), 'false');
  assert.equal(formatToolComparisonValue(incoming, 'status'), '""');
  assert.match(formatToolComparisonValue(existing, 'fullOverview'), /Google Antigravity/);
});

test('all standard fields remain visible when both records omit them', () => {
  assert.deepEqual(getToolComparisonFields({}, {}), TOOL_COMPARISON_FIELD_ORDER);
  const fields = getToolComparisonFields(null, { id: 'new-tool' });
  assert.deepEqual(fields.slice(0, TOOL_COMPARISON_FIELD_ORDER.length), TOOL_COMPARISON_FIELD_ORDER);
  for (const field of TOOL_COMPARISON_FIELD_ORDER) {
    assert.equal(formatToolComparisonValue(null, field), '—');
  }
});

test('additional fields from both records are preserved in deterministic alphabetical order', () => {
  const fields = getToolComparisonFields(
    { zeta: 1, metadata: { origin: 'catalog' } },
    { alpha: 2, zeta: 3, createdDate: '2026-01-01' }
  );
  assert.deepEqual(fields.slice(TOOL_COMPARISON_FIELD_ORDER.length), [
    'alpha',
    'createdDate',
    'metadata',
    'zeta',
  ]);
});

test('missing, null, empty string, booleans, and zero display distinctly', () => {
  const record = {
    nullValue: null,
    emptyValue: '',
    trueValue: true,
    falseValue: false,
    zeroValue: 0,
  };
  assert.equal(formatToolComparisonValue(record, 'missingValue'), '—');
  assert.equal(formatToolComparisonValue(record, 'nullValue'), 'null');
  assert.equal(formatToolComparisonValue(record, 'emptyValue'), '""');
  assert.equal(formatToolComparisonValue(record, 'trueValue'), 'true');
  assert.equal(formatToolComparisonValue(record, 'falseValue'), 'false');
  assert.equal(formatToolComparisonValue(record, 'zeroValue'), '0');
});

test('arrays and nested objects display as readable JSON without changing source values', () => {
  const record = {
    pros: ['Fast', 'Reliable'],
    metadata: { source: 'import', flags: [true, false] },
  };
  const before = structuredClone(record);

  assert.equal(formatToolComparisonValue(record, 'pros'), '[\n  "Fast",\n  "Reliable"\n]');
  assert.equal(formatToolComparisonValue(record, 'metadata'), '{\n  "source": "import",\n  "flags": [\n    true,\n    false\n  ]\n}');
  assert.deepEqual(record, before);
});

test('long feature and pros arrays are displayed completely', () => {
  const longArray = Array.from({ length: 60 }, (_, index) => `feature-${index + 1}`);
  const formatted = formatToolComparisonValue({ keyFeatures: longArray }, 'keyFeatures');

  assert.match(formatted, /feature-1/);
  assert.match(formatted, /feature-60/);
  assert.equal(JSON.parse(formatted).length, 60);
});
