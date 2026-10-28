import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCategories, getAllTools, getFileTools } from '../../../../../lib/data-fetchers';
import { getCurrentUserWithProfile } from '../../../../../lib/auth/server';
import { classifyToolRecords } from '../../../../../lib/tool-json-validation';
import { normalizeCategorySlug, resolveCategorySlug } from '../../../../../lib/tool-json-validation';
import { getCatalogCategorySlugs, getCatalogFileForCategory } from '../../../../../lib/catalog-categories';
import { normalizeToolToCanonical, toCanonicalNames } from '../../../../../lib/canonical-tool-schema';
import { findDuplicateGroups, mergeToolFields } from '../../../../../lib/catalog-duplicates';
import {
  deleteCatalogTool,
  getCatalogMutationClient,
  loadCatalogForMutation,
  persistenceConfigured,
  upsertCatalogTools,
} from '../../../../../lib/catalog-persistence';
import {
  CATALOG_MUTATION_AUTH_ERROR,
  catalogDatabaseFailure,
  logCatalogDatabaseFailure,
} from '../../../../../lib/catalog-errors';

const TOOLS_DIR = path.join(process.cwd(), 'data', 'ai-tools');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function catalogFileForCategory(category) {
  const mapped = getCatalogFileForCategory(category);
  const slug = normalizeCategorySlug(category);
  return mapped || (SAFE_SLUG.test(slug) ? `${slug}.json` : null);
}

async function readCategory(category) {
  const fileName = catalogFileForCategory(category);
  if (!fileName) throw new Error(`No catalog file is mapped for category "${category}"`);
  try {
    const contents = await fs.readFile(path.join(TOOLS_DIR, fileName), 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeCategory(category, records) {
  const fileName = catalogFileForCategory(category);
  if (!fileName) throw new Error(`No catalog file is mapped for category "${category}"`);
  const filePath = path.join(TOOLS_DIR, fileName);
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, JSON.stringify(records, null, 2), 'utf8');
  await fs.rename(temporaryPath, filePath);
}

async function getAdminAccess() {
  const auth = await getCurrentUserWithProfile();
  if (!auth.user) {
    return { auth, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!auth.isAdmin) {
    return { auth, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { auth, response: null };
}

async function handlePost(request) {
  const { auth, response: denied } = await getAdminAccess();
  if (denied) return denied;
  const payload = await request.json().catch(() => null);
  const categories = await getCategories();
  const existingTools = await getAllTools();
  const categoryFiles = await fs.readdir(TOOLS_DIR);
  const allowedActions = ['preview', 'apply', 'validate', 'import', 'update-images', 'duplicate-scan', 'duplicate-resolve'];
  if (!payload || !allowedActions.includes(payload?.action)) {
    return NextResponse.json({ error: 'Action must be preview, apply, validate, import, update-images, or duplicate-scan' }, { status: 400 });
  }

  if (payload.action === 'duplicate-scan') {
    return NextResponse.json({ groups: findDuplicateGroups(existingTools), scanned: existingTools.length });
  }

  if (payload.action === 'duplicate-resolve') {
    const action = payload.resolution;
    const selected = Array.isArray(payload.selected) ? payload.selected : [];
    const keep = payload.keep;
    if (!['keep', 'merge', 'delete'].includes(action) || selected.length === 0) {
      return NextResponse.json({ error: 'A duplicate resolution and selected tools are required.' }, { status: 400 });
    }

    if (persistenceConfigured()) {
      const catalogClient = getCatalogMutationClient(auth);
      if (!catalogClient) {
        return NextResponse.json({ error: CATALOG_MUTATION_AUTH_ERROR }, { status: 403 });
      }
      const catalog = await loadCatalogForMutation(catalogClient, await getFileTools());
      const matches = catalog.filter((tool) =>
        selected.some((item) => (item.id && item.id === tool.id) || (item.slug && item.slug === tool.slug))
      );
      const keeper = matches.find((tool) =>
        (keep?.id && keep.id === tool.id) || (keep?.slug && keep.slug === tool.slug)
      ) || matches[0];
      if (!keeper) return NextResponse.json({ error: 'Selected duplicate tools were not found.' }, { status: 404 });

      const mergedKeeper = action === 'merge'
        ? toCanonicalNames(matches.filter((tool) => tool !== keeper)
          .reduce((current, tool) => mergeToolFields(current, tool, Object.keys(tool)), keeper))
        : keeper;
      if (action !== 'delete') await upsertCatalogTools(catalogClient, [mergedKeeper]);

      const removed = action === 'delete' ? matches : matches.filter((tool) => tool !== keeper);
      for (const tool of removed) await deleteCatalogTool(catalogClient, tool.slug);
      return NextResponse.json({
        success: true,
        resolution: action,
        removed: removed.length,
        merged: action === 'merge' ? 1 : 0,
      });
    }

    if (process.env.VERCEL === '1') {
      return NextResponse.json({ error: 'Persistent catalog storage is not configured for this deployment.' }, { status: 503 });
    }

    const files = categoryFiles.filter((file) => file.endsWith('.json'));
    const categoryMap = new Map();
    for (const file of files) {
      const records = await readCategory(file.replace(/\.json$/, ''));
      categoryMap.set(file, Array.isArray(records) ? [...records] : []);
    }
    const matches = [];
    for (const [file, records] of categoryMap.entries()) {
      records.forEach((tool, index) => {
        if (selected.some((item) => (item.id && item.id === tool.id) || (item.slug && item.slug === tool.slug))) matches.push({ file, index, tool });
      });
    }
    const keeper = matches.find(({ tool }) => (keep?.id && keep.id === tool.id) || (keep?.slug && keep.slug === tool.slug)) || matches[0];
    if (!keeper) return NextResponse.json({ error: 'Selected duplicate tools were not found.' }, { status: 404 });

    if (action === 'merge') {
      const merged = matches.filter(({ tool }) => tool !== keeper.tool).reduce((current, match) => mergeToolFields(current, match.tool, Object.keys(match.tool)), keeper.tool);
      categoryMap.get(keeper.file)[keeper.index] = toCanonicalNames({ ...keeper.tool, ...merged });
    }

    const remove = action === 'delete' ? matches : matches.filter(({ tool }) => tool !== keeper.tool);
    for (const { file, index } of remove.sort((left, right) => right.index - left.index)) categoryMap.set(file, categoryMap.get(file).filter((_, itemIndex) => itemIndex !== index));
    for (const [file, records] of categoryMap.entries()) {
      if (remove.some((item) => item.file === file) || (action === 'merge' && file === keeper.file)) await writeCategory(file.replace(/\.json$/, ''), records);
    }
    return NextResponse.json({ success: true, resolution: action, removed: remove.length, merged: action === 'merge' ? 1 : 0 });
  }

  // Handle selective image updates action
  if (payload.action === 'update-images') {
    const updates = Array.isArray(payload.updates) ? payload.updates : [];
    if (updates.length === 0) {
      return NextResponse.json({ success: true, updatedLogos: 0, updatedBanners: 0, toolsAffected: 0, categories: [], message: 'No image updates selected.' });
    }

    if (persistenceConfigured()) {
      const catalogClient = getCatalogMutationClient(auth);
      if (!catalogClient) {
        return NextResponse.json({ error: CATALOG_MUTATION_AUTH_ERROR }, { status: 403 });
      }
      const catalog = await loadCatalogForMutation(catalogClient, await getFileTools());
      let updatedLogos = 0;
      let updatedBanners = 0;
      let toolsAffected = 0;
      const touchedCategories = new Set();

      for (const item of updates) {
        if (!item.replaceLogo && !item.replaceBanner) continue;
        const tool = catalog.find((candidate) =>
          (item.id && candidate.id === item.id) || (item.slug && candidate.slug === item.slug)
        );
        if (!tool) continue;

        const updated = { ...tool };
        if (item.replaceLogo && typeof item.newLogo === 'string') {
          updated.logoImageUrl = item.newLogo.trim();
          updatedLogos += 1;
        }
        if (item.replaceBanner && typeof item.newBanner === 'string') {
          updated.bannerImageUrl = item.newBanner.trim();
          updatedBanners += 1;
        }
        if (updated.logoImageUrl !== tool.logoImageUrl || updated.bannerImageUrl !== tool.bannerImageUrl) {
          await upsertCatalogTools(catalogClient, [toCanonicalNames(updated)]);
          toolsAffected += 1;
          touchedCategories.add(tool.category);
        }
      }

      return NextResponse.json({
        success: true,
        updatedLogos,
        updatedBanners,
        toolsAffected,
        categories: Array.from(touchedCategories),
        message: `Successfully updated ${updatedLogos} logo${updatedLogos === 1 ? '' : 's'} and ${updatedBanners} banner${updatedBanners === 1 ? '' : 's'} across ${toolsAffected} tool${toolsAffected === 1 ? '' : 's'}.`,
      });
    }

    if (process.env.VERCEL === '1') {
      return NextResponse.json({ error: 'Persistent catalog storage is not configured for this deployment.' }, { status: 503 });
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

      if (item.replaceLogo && typeof item.newLogo === 'string') {
        toolCopy.logoImageUrl = item.newLogo.trim();
        delete toolCopy.logo;
        delete toolCopy.logoImage;
        updatedLogos++;
        toolModified = true;
      }

      if (item.replaceBanner && typeof item.newBanner === 'string') {
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

  const normalizedRecords = (Array.isArray(payload.records)
    ? payload.records.map((record) => toCanonicalNames(normalizeToolToCanonical(record)))
    : payload.records
      ? [toCanonicalNames(normalizeToolToCanonical(payload.records))]
      : []).map((record) => ({ ...record, category: resolveCategorySlug(record.category, categories) }));

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
      errorDetails: classification.errorDetails,
      invalidRecords: classification.invalidRecords,
      conflicts: classification.conflicts,
      message: classification.errors.length === 0 ? 'Ready to import.' : 'Validation failed.'
    });
  }

  const reviewConflicts = classification.existingTools.map((item) => ({
    recordIndex: item.recordIndex,
    type: 'existing-match',
    matchedBy: item.matchedBy,
    record: item.record,
    existing: item.existing,
  }));
  const duplicateConflicts = classification.conflicts.filter((conflict) => conflict.reason === 'Duplicate identity in uploaded data.');

  const preview = {
    added: classification.newTools,
    conflicts: reviewConflicts,
    duplicates: duplicateConflicts,
    invalid: classification.invalidRecords,
  };

  if (payload.action === 'preview') {
    return NextResponse.json({
      ...classification,
      records: normalizedRecords,
      imageUpdates: classification.imageUpdates || [],
      preview,
      conflictRecords: reviewConflicts,
      summary: {
        added: classification.newTools.length,
        updated: 0,
        conflicts: reviewConflicts.length,
        skipped: 0,
        invalid: classification.invalidRecords.length,
        duplicates: duplicateConflicts.length,
      }
    });
  }

  // Action is 'apply' or 'import'
  if (process.env.VERCEL === '1' && !persistenceConfigured()) {
    return NextResponse.json({ error: 'Persistent catalog storage is not configured for this deployment.' }, { status: 503 });
  }

  const categorySlugs = [...new Set([
    ...getCatalogCategorySlugs(),
    ...categoryFiles.filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, '')),
  ])];
  const categoryMap = new Map();
  let catalogClient = null;
  if (persistenceConfigured()) {
    catalogClient = getCatalogMutationClient(auth);
    if (!catalogClient) {
      return NextResponse.json({ error: CATALOG_MUTATION_AUTH_ERROR }, { status: 403 });
    }
    const catalog = await loadCatalogForMutation(catalogClient, await getFileTools());
    for (const tool of catalog) {
      if (!categoryMap.has(tool.category)) categoryMap.set(tool.category, []);
      categoryMap.get(tool.category).push(tool);
    }
  } else {
    for (const slug of categorySlugs) {
      try {
        const records = await readCategory(slug);
        categoryMap.set(slug, Array.isArray(records) ? [...records] : []);
      } catch {
        categoryMap.set(slug, []);
      }
    }
  }
  normalizedRecords.forEach((record) => {
    if (record.category && !categoryMap.has(record.category)) categoryMap.set(record.category, []);
  });

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

  const findToolLocationByUrl = (url) => {
    const normalized = url ? url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '') : null;
    if (!normalized) return null;
    for (const [catSlug, catRecords] of categoryMap.entries()) {
      const idx = catRecords.findIndex((t) => t.website && t.website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '') === normalized);
      if (idx !== -1) return { category: catSlug, index: idx, tool: catRecords[idx] };
    }
    return null;
  };

  const findToolLocationByName = (name) => {
    const normalized = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
    if (!normalized) return null;
    for (const [catSlug, catRecords] of categoryMap.entries()) {
      const idx = catRecords.findIndex((t) => t.name && t.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
      if (idx !== -1) return { category: catSlug, index: idx, tool: catRecords[idx] };
    }
    return null;
  };

  let updatedCount = 0;
  let importedCount = 0;
  let skippedCount = 0;
  let conflictCount = 0;
  let duplicateCount = duplicateConflicts.length;
  const touchedCategories = new Set();

  const invalidRecordIndexes = new Set(classification.invalidRecords.map((r) => r.recordIndex));
  const conflictRecordIndexes = new Set(duplicateConflicts.map((r) => r.recordIndex));
  const decisions = payload.decisions || {};

  normalizedRecords.forEach((record, index) => {
    if (invalidRecordIndexes.has(index) || conflictRecordIndexes.has(index)) {
      skippedCount++;
      return;
    }

    const match = findToolLocation(record.id, record.slug) || (record.website ? findToolLocationByUrl(record.website) : null) || (record.name ? findToolLocationByName(record.name) : null);

    if (match) {
      const decision = decisions[index] || decisions[String(index)] || { action: 'keep-existing' };
      if (decision.action === 'skip' || decision.action === 'keep-existing') {
        skippedCount++;
        conflictCount++;
        return;
      }
      if (!['use-new', 'manual-merge'].includes(decision.action)) {
        skippedCount++;
        conflictCount++;
        return;
      }

      // Preserve existing images during normal import unless existing tool had none
      const existingLogo = match.tool.logoImageUrl || match.tool.logo || match.tool.logoImage || '';
      const existingBanner = match.tool.bannerImageUrl || match.tool.banner || match.tool.bannerImage || '';

      const selectedFields = decision.action === 'manual-merge'
        ? Object.keys(decision.fields || {}).filter((field) => decision.fields[field] === 'new')
        : Object.keys(record);
      const incomingRecord = decision.action === 'manual-merge' && decision.mergedRecord
        ? decision.mergedRecord
        : record;
      const mergedRecord = mergeToolFields(match.tool, incomingRecord, selectedFields);
      const allowLogoReplacement = selectedFields.includes('logoImageUrl');
      const allowBannerReplacement = selectedFields.includes('bannerImageUrl');
      const updatedRecord = toCanonicalNames({
        ...match.tool,
        ...mergedRecord,
        id: record.id || match.tool.id,
        createdDate: match.tool.createdDate || record.createdDate || new Date().toISOString(),
        logoImageUrl: allowLogoReplacement ? record.logoImageUrl || existingLogo : existingLogo,
        bannerImageUrl: allowBannerReplacement ? record.bannerImageUrl || existingBanner : existingBanner,
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
      conflictCount++;
    } else {
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

  if (persistenceConfigured()) {
    const changedTools = Array.from(touchedCategories).flatMap((category) => categoryMap.get(category) || []);
    await upsertCatalogTools(catalogClient, changedTools);
  } else {
    for (const catSlug of touchedCategories) {
      await writeCategory(catSlug, categoryMap.get(catSlug));
    }
  }

  const newCategorySlugs = normalizedRecords
    .map((record) => record.category)
    .filter((slug) => slug && !getCatalogFileForCategory(slug));
  if (newCategorySlugs.length > 0) {
    const categoriesPath = path.join(process.cwd(), 'data', 'categories.json');
    const existingCategories = JSON.parse(await fs.readFile(categoriesPath, 'utf8'));
    const existingSlugs = new Set(existingCategories.map((category) => category.slug));
    const additions = [...new Set(newCategorySlugs)]
      .filter((slug) => !existingSlugs.has(slug))
      .map((slug) => ({
        id: `cat-${slug}`,
        name: slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        slug,
        description: 'Catalog category created from an approved import.',
      }));
    if (additions.length > 0 && !persistenceConfigured()) {
      await fs.writeFile(categoriesPath, JSON.stringify([...existingCategories, ...additions], null, 2), 'utf8');
    }
  }

  return NextResponse.json({
    success: true,
    added: importedCount,
    updated: updatedCount,
    merged: updatedCount,
    conflicts: conflictCount,
    skipped: skippedCount,
    invalid: classification.invalidRecords.length,
    duplicates: duplicateCount,
    categories: Array.from(touchedCategories),
    preview
  });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    logCatalogDatabaseFailure('admin tools import', error);
    const failure = catalogDatabaseFailure(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}