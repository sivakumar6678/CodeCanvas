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

    // Group items by their source category
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

    if (action === 'delete') {
      for (const [category, items] of Object.entries(categoryGroups)) {
        const filePath = categoryPath(category);
        if (!filePath) continue;

        let fileTools = await readToolsFile(filePath);
        const slugsToDelete = new Set(items.map((i) => i.slug));
        const initialLength = fileTools.length;
        fileTools = fileTools.filter((t) => !slugsToDelete.has(t.slug));
        if (fileTools.length !== initialLength) {
          await writeToolsFile(filePath, fileTools);
          updatedCount += initialLength - fileTools.length;
        }
      }
      return NextResponse.json({ success: true, updatedCount });
    }

    if (action === 'update') {
      // Check if any tool is moving to a new category
      for (const [sourceCategory, items] of Object.entries(categoryGroups)) {
        const sourceFilePath = categoryPath(sourceCategory);
        if (!sourceFilePath) continue;

        let sourceFileTools = await readToolsFile(sourceFilePath);
        let sourceModified = false;

        for (const item of items) {
          const { slug, category, newCategory, targetCategory, ...updates } = item;
          const destinationCategory = newCategory || targetCategory || (updates.category !== sourceCategory ? updates.category : null);

          if (destinationCategory && destinationCategory !== sourceCategory && SAFE_SLUG.test(destinationCategory)) {
            // Move across category files
            const toolIdx = sourceFileTools.findIndex((t) => t.slug === slug);
            if (toolIdx !== -1) {
              const movingTool = { ...sourceFileTools[toolIdx], ...updates, category: destinationCategory };
              sourceFileTools.splice(toolIdx, 1);
              sourceModified = true;

              const destFilePath = categoryPath(destinationCategory);
              if (destFilePath) {
                let destFileTools = await readToolsFile(destFilePath);
                destFileTools = destFileTools.filter((t) => t.slug !== slug);
                destFileTools.push(movingTool);
                await writeToolsFile(destFilePath, destFileTools);
                updatedCount++;
              }
            }
          } else {
            // Update in-place in current category file
            const toolIdx = sourceFileTools.findIndex((t) => t.slug === slug);
            if (toolIdx !== -1) {
              sourceFileTools[toolIdx] = { ...sourceFileTools[toolIdx], ...updates };
              sourceModified = true;
              updatedCount++;
            }
          }
        }

        if (sourceModified) {
          await writeToolsFile(sourceFilePath, sourceFileTools);
        }
      }

      return NextResponse.json({ success: true, updatedCount });
    }

    return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
  } catch (error) {
    console.error('Bulk operation failed:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}
