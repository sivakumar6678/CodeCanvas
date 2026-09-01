import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserWithProfile } from '../../../../../lib/auth/server';
import { normalizeKnowledgeItem, validateKnowledgeItem } from '../../../../../lib/knowledge-schema';

const PROMPTS_FILE = path.join(process.cwd(), 'data', 'default-prompts.json');

async function readPromptsFile() {
  try {
    const raw = await fs.readFile(PROMPTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to read prompts file:', error);
    }
    return [];
  }
}

async function writePromptsFile(prompts) {
  const temporaryPath = `${PROMPTS_FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, JSON.stringify(prompts, null, 2), 'utf8');
  await fs.rename(temporaryPath, PROMPTS_FILE);
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await request.json().catch(() => ({}));
    const { action = 'preview', items = [], overwriteExisting = false } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No knowledge items provided for import.' }, { status: 400 });
    }

    const currentCatalog = await readPromptsFile();
    const existingById = new Map(currentCatalog.map((i) => [String(i.id).toLowerCase(), i]));
    const existingByTitle = new Map(currentCatalog.map((i) => [i.title.toLowerCase().trim(), i]));

    const validItems = [];
    const existingItems = [];
    const invalidItems = [];

    items.forEach((raw, idx) => {
      const normalized = normalizeKnowledgeItem(raw);
      if (!normalized) {
        invalidItems.push({ index: idx, raw, error: 'Invalid record format' });
        return;
      }

      const error = validateKnowledgeItem(normalized);
      if (error) {
        invalidItems.push({ index: idx, title: normalized.title || `Item #${idx + 1}`, error });
        return;
      }

      const isExisting =
        existingById.has(normalized.id.toLowerCase()) ||
        existingByTitle.has(normalized.title.toLowerCase());

      if (isExisting) {
        existingItems.push({ index: idx, item: normalized });
      } else {
        validItems.push({ index: idx, item: normalized });
      }
    });

    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        summary: {
          total: items.length,
          validCount: validItems.length,
          existingCount: existingItems.length,
          invalidCount: invalidItems.length,
        },
        valid: validItems.map((v) => v.item),
        existing: existingItems.map((e) => e.item),
        invalid: invalidItems,
      });
    }

    if (action === 'import') {
      let updatedCatalog = [...currentCatalog];
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      // Add new valid items
      validItems.forEach(({ item }) => {
        updatedCatalog.unshift(item);
        importedCount++;
      });

      // Handle existing items
      existingItems.forEach(({ item }) => {
        if (overwriteExisting) {
          const idx = updatedCatalog.findIndex(
            (c) => c.id === item.id || c.title.toLowerCase() === item.title.toLowerCase()
          );
          if (idx !== -1) {
            updatedCatalog[idx] = { ...updatedCatalog[idx], ...item };
            updatedCount++;
          } else {
            updatedCatalog.unshift(item);
            importedCount++;
          }
        } else {
          skippedCount++;
        }
      });

      await writePromptsFile(updatedCatalog);

      return NextResponse.json({
        success: true,
        importedCount,
        updatedCount,
        skippedCount,
        totalCatalogCount: updatedCatalog.length,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Admin knowledge import error:', error);
    return NextResponse.json({ error: 'Knowledge import operation failed.' }, { status: 500 });
  }
}
