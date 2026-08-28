import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCategories, getAllTools } from '../../../../../lib/data-fetchers';
import { getCurrentUserWithProfile } from '../../../../../lib/auth/server';
import { classifyToolRecords } from '../../../../../lib/tool-json-validation';
import { getCatalogCategorySlugs, getCatalogFileForCategory } from '../../../../../lib/catalog-categories';

const TOOLS_DIR = path.join(process.cwd(), 'data', 'ai-tools');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function readCategory(category) {
  const fileName = getCatalogFileForCategory(category);
  if (!fileName) throw new Error(`No catalog file is mapped for category "${category}"`);
  const contents = await fs.readFile(path.join(TOOLS_DIR, fileName), 'utf8');
  return JSON.parse(contents);
}

async function writeCategory(category, records) {
  const fileName = getCatalogFileForCategory(category);
  if (!fileName) throw new Error(`No catalog file is mapped for category "${category}"`);
  const filePath = path.join(TOOLS_DIR, fileName);
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, JSON.stringify(records, null, 2), 'utf8');
  await fs.rename(temporaryPath, filePath);
}

async function adminOnly() {
  const auth = await getCurrentUserWithProfile();
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function POST(request) {
  const denied = await adminOnly();
  if (denied) return denied;
  const payload = await request.json().catch(() => null);
  const categories = await getCategories();
  const existingTools = await getAllTools();
  const categoryFiles = await fs.readdir(TOOLS_DIR);
  if (!['preview', 'apply'].includes(payload?.action)) return NextResponse.json({ error: 'Action must be preview or apply' }, { status: 400 });
  const classification = classifyToolRecords(payload.records, { categories, categoryFiles, existingTools });
  if (classification.conflicts.length > 0) return NextResponse.json(classification, { status: 409 });

  const mode = payload.mode || 'upsert';
  if (!['update-existing', 'import-new', 'upsert'].includes(mode)) return NextResponse.json({ error: 'Invalid import mode' }, { status: 400 });
  const existingIndexes = new Map(existingTools.map((tool, index) => [tool.id, { tool, index }]));
  const existingSlugIndexes = new Map(existingTools.map((tool, index) => [tool.slug, { tool, index }]));
  const selected = classification.existingTools.filter((item) => mode !== 'import-new').map((item) => ({ ...item, action: 'update' }))
    .concat(classification.newTools.filter(() => mode !== 'update-existing').map((item) => ({ ...item, action: 'add' })));
  const preview = {
    added: selected.filter((item) => item.action === 'add'),
    updated: selected.filter((item) => item.action === 'update'),
    skipped: mode === 'update-existing' ? classification.newTools : mode === 'import-new' ? classification.existingTools : [],
    invalid: classification.invalidRecords,
  };
  if (payload.action === 'preview') return NextResponse.json({ ...classification, preview, summary: { existing: classification.existingTools.length, new: classification.newTools.length, invalid: classification.invalidRecords.length, conflicts: classification.conflicts.length } });

  const changes = new Map();
  for (const item of selected) {
    const match = item.existing || existingIndexes.get(item.record.id)?.tool || existingSlugIndexes.get(item.record.slug)?.tool;
    for (const category of getCatalogCategorySlugs()) {
      const recordsInCategory = await readCategory(category);
      const nextRecords = recordsInCategory.filter((record) => !match || record.id !== match.id);
      if (nextRecords.length !== recordsInCategory.length) changes.set(category, nextRecords);
    }
    const categoryRecords = changes.get(item.record.category) || await readCategory(item.record.category);
    changes.set(item.record.category, [...categoryRecords, item.record]);
  }
  for (const [category, recordsForCategory] of changes) await writeCategory(category, recordsForCategory);
  return NextResponse.json({ imported: preview.added.length, updated: preview.updated.length, skipped: preview.skipped.length, categories: [...changes.keys()], preview });
}