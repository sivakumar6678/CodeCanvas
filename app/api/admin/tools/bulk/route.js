import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserWithProfile } from '../../../../../lib/auth/server';
import { getCatalogFileForCategory } from '../../../../../lib/catalog-categories';
import { getFileTools } from '../../../../../lib/data-fetchers';
import { normalizeToolToCanonical, toCanonicalNames } from '../../../../../lib/canonical-tool-schema';
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

const DATA_DIR = path.join(process.cwd(), 'data');
const AI_TOOLS_DIR = path.join(DATA_DIR, 'ai-tools');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function categoryPath(category) {
  if (typeof category !== 'string' || !SAFE_SLUG.test(category)) return null;
  const fileName = getCatalogFileForCategory(category) || `${category}.json`;
  return path.join(AI_TOOLS_DIR, fileName);
}

async function readToolsFile(filePath) {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(fileContents);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to read tools file ${filePath}:`, error);
    }
    return [];
  }
}

async function writeToolsFile(filePath, tools) {
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, JSON.stringify(tools, null, 2), 'utf8');
  await fs.rename(temporaryPath, filePath);
}

export async function POST(request) {
  try {
    const auth = await getCurrentUserWithProfile();
    const { user, isAdmin } = auth;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await request.json();
    const { action, tools } = payload;

    if (!Array.isArray(tools) || tools.length === 0) {
      return NextResponse.json({ error: 'No tools provided' }, { status: 400 });
    }

    if (!['delete', 'update'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (persistenceConfigured()) {
      const supabase = getCatalogMutationClient(auth);
      if (!supabase) {
        return NextResponse.json({ error: CATALOG_MUTATION_AUTH_ERROR }, { status: 403 });
      }
      const catalog = await loadCatalogForMutation(supabase, await getFileTools());
      let updatedCount = 0;
      const deletedSlugs = new Set();

      for (const item of tools) {
        const current = catalog.find((tool) => tool.slug === item.slug);
        if (!current) continue;

        if (action === 'delete') {
          if (deletedSlugs.has(item.slug)) continue;
          deletedSlugs.add(item.slug);
          if (await deleteCatalogTool(supabase, item.slug)) updatedCount += 1;
          continue;
        }

        const { slug, category: sourceCategory, newCategory, targetCategory, ...updates } = item;
        const destinationCategory = newCategory || targetCategory || updates.category || sourceCategory;
        const updatedTool = toCanonicalNames(normalizeToolToCanonical({
          ...current,
          ...updates,
          slug,
          category: destinationCategory,
        }));
        await upsertCatalogTools(supabase, [updatedTool]);
        updatedCount += 1;
      }

      return NextResponse.json({ success: true, updatedCount });
    }

    if (process.env.VERCEL === '1') {
      return NextResponse.json({ error: 'Persistent catalog storage is not configured for this deployment.' }, { status: 503 });
    }

    const categoryGroups = {};
    for (const tool of tools) {
      const { category, slug } = tool;
      if (!category || !slug || !SAFE_SLUG.test(category) || !SAFE_SLUG.test(slug)) continue;
      
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(tool);
    }

    let updatedCount = 0;
    const destAdditions = {};

    for (const [category, items] of Object.entries(categoryGroups)) {
      const filePath = categoryPath(category);
      if (!filePath) continue;

      let fileTools = await readToolsFile(filePath);
      let changed = false;

      if (action === 'delete') {
        const slugsToDelete = new Set(items.map(i => i.slug));
        const initialLength = fileTools.length;
        fileTools = fileTools.filter(t => !slugsToDelete.has(t.slug));
        if (fileTools.length !== initialLength) {
          changed = true;
          updatedCount += (initialLength - fileTools.length);
        }
      } else if (action === 'update') {
        for (const item of items) {
          
          const { slug, category: sourceCategory, newCategory, targetCategory, ...updates } = item;
          const destCategory = newCategory || targetCategory || (sourceCategory !== category ? sourceCategory : null);

          if (destCategory && destCategory !== category && SAFE_SLUG.test(destCategory)) {
            const toolIdx = fileTools.findIndex(t => t.slug === slug);
            if (toolIdx !== -1) {
              const movingTool = { ...fileTools[toolIdx], ...updates, category: destCategory };
              fileTools.splice(toolIdx, 1);
              changed = true;

              if (!destAdditions[destCategory]) {
                destAdditions[destCategory] = [];
              }
              destAdditions[destCategory].push(movingTool);
            }
          } else {
            const index = fileTools.findIndex(t => t.slug === item.slug);
            if (index !== -1) {
              fileTools[index] = { ...fileTools[index], ...updates };
              changed = true;
              updatedCount++;
            }
          }
        }
      }

      if (changed) {
        await writeToolsFile(filePath, fileTools);
      }
    }

    // Apply any cross-category additions
    for (const [destCategory, toolsToAdd] of Object.entries(destAdditions)) {
      const destFilePath = categoryPath(destCategory);
      if (!destFilePath) continue;
      let destTools = await readToolsFile(destFilePath);
      const incomingSlugs = new Set(toolsToAdd.map(t => t.slug));
      destTools = destTools.filter(t => !incomingSlugs.has(t.slug));
      destTools.push(...toolsToAdd);
      await writeToolsFile(destFilePath, destTools);
      updatedCount += toolsToAdd.length;
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    logCatalogDatabaseFailure('admin bulk catalog operation', error);
    const failure = catalogDatabaseFailure(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
