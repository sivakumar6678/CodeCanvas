import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCategories, getAllTools } from '../../../../../lib/data-fetchers';
import { getCurrentUserWithProfile } from '../../../../../lib/auth/server';
import { classifyToolRecords } from '../../../../../lib/tool-json-validation';
import { getCatalogCategorySlugs, getCatalogFileForCategory } from '../../../../../lib/catalog-categories';
import { normalizeToolToCanonical, toCanonicalNames } from '../../../../../lib/canonical-tool-schema';

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
  const allowedActions = ['preview', 'apply', 'validate', 'import', 'update-images'];
  if (!payload || !allowedActions.includes(payload?.action)) {
    return NextResponse.json({ error: 'Action must be preview, apply, validate, import, or update-images' }, { status: 400 });
  }

  // Handle selective image updates action
  if (payload.action === 'update-images') {
    const updates = Array.isArray(payload.updates) ? payload.updates : [];
    if (updates.length === 0) {
      return NextResponse.json({ success: true, updatedLogos: 0, updatedBanners: 0, toolsAffected: 0, categories: [], message: 'No image updates selected.' });
    }

    const categorySlugs = getCatalogCategorySlugs();
    const categoryMap = new Map();
    for (const slug of categorySlugs) {
      try {
        const records = await readCategory(slug);
        categoryMap.set(slug, Array.isArray(records) ? [...records] : []);
      } catch {
        categoryMap.set(slug, []);
      }
    }

    const findToolLocation = (id, slug) => {
      for (const [catSlug, catRecords] of categoryMap.entries()) {
        if (id) {
          const idx = catRecords.findIndex((t) => t.id === id);
          if (idx !== -1) return { category: catSlug, index: idx, tool: catRecords[idx] };
        }
        if (slug) {
          const idx = catRecords.findIndex((t) => t.slug === slug);
          if (idx !== -1) return { category: catSlug, index: idx, tool: catRecords[idx] };
        }
      }
      return null;
    };

    let updatedLogos = 0;
    let updatedBanners = 0;
    let toolsAffected = 0;
    const touchedCategories = new Set();

    for (const item of updates) {
      if (!item.replaceLogo && !item.replaceBanner) continue;

      const match = findToolLocation(item.id, item.slug);
      if (!match) continue;

      let toolModified = false;
      const toolCopy = { ...match.tool };

      if (item.replaceLogo && item.newLogo && typeof item.newLogo === 'string' && item.newLogo.trim()) {
        toolCopy.logoImageUrl = item.newLogo.trim();
        delete toolCopy.logo;
        delete toolCopy.logoImage;
        updatedLogos++;
        toolModified = true;
      }

      if (item.replaceBanner && item.newBanner && typeof item.newBanner === 'string' && item.newBanner.trim()) {
        toolCopy.bannerImageUrl = item.newBanner.trim();
        delete toolCopy.banner;
        delete toolCopy.bannerImage;
        updatedBanners++;
        toolModified = true;
      }

      if (toolModified) {
        toolsAffected++;
        categoryMap.get(match.category)[match.index] = toCanonicalNames(toolCopy);
        touchedCategories.add(match.category);
      }
    }

    for (const catSlug of touchedCategories) {
      await writeCategory(catSlug, categoryMap.get(catSlug));
    }

    return NextResponse.json({
      success: true,
      updatedLogos,
      updatedBanners,
      toolsAffected,
      categories: Array.from(touchedCategories),
      message: `Successfully updated ${updatedLogos} logo${updatedLogos === 1 ? '' : 's'} and ${updatedBanners} banner${updatedBanners === 1 ? '' : 's'} across ${toolsAffected} tool${toolsAffected === 1 ? '' : 's'}.`
    });
  }

  const normalizedRecords = Array.isArray(payload.records)
    ? payload.records.map((record) => toCanonicalNames(normalizeToolToCanonical(record)))
    : payload.records
      ? [toCanonicalNames(normalizeToolToCanonical(payload.records))]
      : [];

  const classification = classifyToolRecords(normalizedRecords, { categories, categoryFiles, existingTools });
  if (classification.conflicts.length > 0 && !['validate', 'import', 'apply'].includes(payload.action)) {
    return NextResponse.json(classification, { status: 409 });
  }

  if (payload.action === 'validate') {
    return NextResponse.json({
      valid: classification.errors.length === 0,
      records: classification.records,
      imageUpdates: classification.imageUpdates || [],
      errors: classification.errors,
      conflicts: classification.conflicts,
      message: classification.errors.length === 0 ? 'Ready to import.' : 'Validation failed.'
    });
  }

  const mode = payload.mode || 'upsert';
  if (!['update-existing', 'import-new', 'upsert'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid import mode' }, { status: 400 });
  }

  const selected = classification.existingTools.filter(() => mode !== 'import-new').map((item) => ({ ...item, action: 'update' }))
    .concat(classification.newTools.filter(() => mode !== 'update-existing').map((item) => ({ ...item, action: 'add' })));

  const preview = {
    added: selected.filter((item) => item.action === 'add'),
    updated: selected.filter((item) => item.action === 'update'),
    skipped: mode === 'update-existing' ? classification.newTools : mode === 'import-new' ? classification.existingTools : [],
    invalid: classification.invalidRecords,
  };

  if (payload.action === 'preview') {
    return NextResponse.json({
      ...classification,
      records: normalizedRecords,
      imageUpdates: classification.imageUpdates || [],
      preview,
      summary: {
        existing: classification.existingTools.length,
        new: classification.newTools.length,
        invalid: classification.invalidRecords.length,
        conflicts: classification.conflicts.length,
        imageUpdates: classification.imageUpdates?.length || 0,
      }
    });
  }

  // Action is 'apply' or 'import'
  const categorySlugs = getCatalogCategorySlugs();
  const categoryMap = new Map();
  for (const slug of categorySlugs) {
    try {
      const records = await readCategory(slug);
      categoryMap.set(slug, Array.isArray(records) ? [...records] : []);
    } catch {
      categoryMap.set(slug, []);
    }
  }

  const findToolLocation = (id, slug) => {
    for (const [catSlug, catRecords] of categoryMap.entries()) {
      if (id) {
        const idx = catRecords.findIndex((t) => t.id === id);
        if (idx !== -1) return { category: catSlug, index: idx, tool: catRecords[idx] };
      }
      if (slug) {
        const idx = catRecords.findIndex((t) => t.slug === slug);
        if (idx !== -1) return { category: catSlug, index: idx, tool: catRecords[idx] };
      }
    }
    return null;
  };

  let updatedCount = 0;
  let importedCount = 0;
  let skippedCount = 0;
  const touchedCategories = new Set();

  const invalidRecordIndexes = new Set(classification.invalidRecords.map((r) => r.recordIndex));
  const conflictRecordIndexes = new Set(classification.conflicts.map((r) => r.recordIndex));

  normalizedRecords.forEach((record, index) => {
    if (invalidRecordIndexes.has(index) || conflictRecordIndexes.has(index)) {
      skippedCount++;
      return;
    }

    const match = findToolLocation(record.id, record.slug);

    if (match) {
      if (mode === 'import-new') {
        skippedCount++;
        return;
      }

      // Preserve existing images during normal import unless existing tool had none
      const existingLogo = match.tool.logoImageUrl || match.tool.logo || match.tool.logoImage || '';
      const existingBanner = match.tool.bannerImageUrl || match.tool.banner || match.tool.bannerImage || '';

      const updatedRecord = toCanonicalNames({
        ...record,
        id: record.id || match.tool.id,
        createdDate: match.tool.createdDate || record.createdDate || new Date().toISOString(),
        logoImageUrl: existingLogo || record.logoImageUrl || '',
        bannerImageUrl: existingBanner || record.bannerImageUrl || '',
      });

      const targetCategory = updatedRecord.category;
      if (!categoryMap.has(targetCategory)) {
        skippedCount++;
        return;
      }

      if (match.category !== targetCategory) {
        // Remove from old category
        categoryMap.set(match.category, categoryMap.get(match.category).filter((_, i) => i !== match.index));
        touchedCategories.add(match.category);
        // Add to new category
        categoryMap.get(targetCategory).push(updatedRecord);
        touchedCategories.add(targetCategory);
      } else {
        // Update in place
        categoryMap.get(match.category)[match.index] = updatedRecord;
        touchedCategories.add(match.category);
      }
      updatedCount++;
    } else {
      if (mode === 'update-existing') {
        skippedCount++;
        return;
      }

      const newRecord = toCanonicalNames({
        ...record,
        id: record.id || `tool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdDate: record.createdDate || new Date().toISOString(),
      });

      const targetCategory = newRecord.category;
      if (!categoryMap.has(targetCategory)) {
        skippedCount++;
        return;
      }

      categoryMap.get(targetCategory).push(newRecord);
      touchedCategories.add(targetCategory);
      importedCount++;
    }
  });

  for (const catSlug of touchedCategories) {
    await writeCategory(catSlug, categoryMap.get(catSlug));
  }

  return NextResponse.json({
    success: true,
    imported: importedCount,
    updated: updatedCount,
    skipped: skippedCount,
    categories: Array.from(touchedCategories),
    preview
  });
}