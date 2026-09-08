import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserWithProfile } from '../../../../../lib/auth/server';

const DATA_DIR = path.join(process.cwd(), 'data');
const AI_TOOLS_DIR = path.join(DATA_DIR, 'ai-tools');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function categoryPath(category) {
  if (typeof category !== 'string' || !SAFE_SLUG.test(category)) return null;
  return path.join(AI_TOOLS_DIR, `${category}.json`);
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
    const { user, isAdmin } = await getCurrentUserWithProfile();
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
          const destCategory = newCategory || targetCategory || (updates.category && updates.category !== category ? updates.category : null);

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
    console.error('Bulk operation failed:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}

