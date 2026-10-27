import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getAllTools, getFileTools } from '../../../../lib/data-fetchers';
import { getCurrentUserWithProfile } from '../../../../lib/auth/server';
import { normalizeToolToCanonical, toCanonicalNames, ALLOWED_PRICING } from '../../../../lib/canonical-tool-schema';
import { getCatalogFileForCategory } from '../../../../lib/catalog-categories';
import {
  deleteCatalogTool,
  getCatalogMutationClient,
  loadCatalogForMutation,
  persistenceConfigured,
  upsertCatalogTools,
} from '../../../../lib/catalog-persistence';
import { CATALOG_MUTATION_AUTH_ERROR, catalogDatabaseFailure } from '../../../../lib/catalog-errors';

const DATA_DIR = path.join(process.cwd(), 'data');
const AI_TOOLS_DIR = path.join(DATA_DIR, 'ai-tools');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const toolCreateLocks = new Map();

async function withToolCreateLock(slug, operation) {
  const previous = toolCreateLocks.get(slug) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  toolCreateLocks.set(slug, queued);
  await previous;

  try {
    return await operation();
  } finally {
    release();
    if (toolCreateLocks.get(slug) === queued) toolCreateLocks.delete(slug);
  }
}

function validateTool(tool) {
  if (!tool || typeof tool !== 'object' || Array.isArray(tool)) return 'Tool payload must be an object';
  if (typeof tool.name !== 'string' || !tool.name.trim()) return 'Tool name is required';
  if (typeof tool.slug !== 'string' || !SAFE_SLUG.test(tool.slug)) return 'Slug must use lowercase letters, numbers, and hyphens';
  if (typeof tool.category !== 'string' || !SAFE_SLUG.test(tool.category)) return 'A valid category is required';
  if (typeof tool.description !== 'string' || !tool.description.trim()) return 'Description is required';
  try {
    const website = new URL(tool.website);
    if (!['http:', 'https:'].includes(website.protocol)) throw new Error('Invalid protocol');
  } catch {
    return 'Website must be a valid HTTP or HTTPS URL';
  }
  
  // Accept both canonical and legacy field names
  const pricingModel = tool.pricingModel || tool.pricing;
  if (pricingModel && !ALLOWED_PRICING.includes(pricingModel)) {
    return `Pricing model must be one of: ${ALLOWED_PRICING.join(', ')}`;
  }
  
  for (const field of ['keyFeatures', 'features', 'pros', 'cons', 'platforms', 'platform', 'tags', 'useCases']) {
    if (tool[field] !== undefined && !Array.isArray(tool[field])) return `${field} must be an array`;
  }
  return null;
}

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

function persistentStorageRequired() {
  return process.env.VERCEL === '1' && !persistenceConfigured();
}

function logCatalogMutationFailure(action, error) {
  console.error(`Failed to ${action} tool:`, {
    code: error?.code || error?.status || 'UNKNOWN',
    message: typeof error?.message === 'string' ? error.message.slice(0, 300) : undefined,
  });
}

export async function GET() {
  try {
    const { user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allTools = await getAllTools();
    return NextResponse.json(allTools);
  } catch (error) {
    logCatalogMutationFailure('fetch', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
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

    let newTool = await request.json();
    
    // Normalize to canonical schema
    newTool = normalizeToolToCanonical(newTool);
    newTool = toCanonicalNames(newTool);
    
    const validationError = validateTool(newTool);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    
    // Auto-generate some fields if missing
    newTool.id = newTool.id || `tool-${Date.now()}`;
    newTool.createdDate = newTool.createdDate || new Date().toISOString();
    
    const categorySlug = newTool.category;
    if (!categorySlug) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const categoryFilePath = categoryPath(categorySlug);

    return await withToolCreateLock(newTool.slug, async () => {
      if (persistentStorageRequired()) {
        return NextResponse.json({ error: 'Persistent catalog storage is not configured for this deployment.' }, { status: 503 });
      }

      const supabase = persistenceConfigured() ? getCatalogMutationClient(auth) : null;
      if (persistenceConfigured() && !supabase) {
        return NextResponse.json({ error: CATALOG_MUTATION_AUTH_ERROR }, { status: 403 });
      }
      const existing = supabase
        ? await loadCatalogForMutation(supabase, await getFileTools())
        : await getAllTools();
      if (existing.some((tool) => tool.slug === newTool.slug)) {
        return NextResponse.json({ error: 'A tool with this slug already exists' }, { status: 409 });
      }

      if (supabase) {
        await upsertCatalogTools(supabase, [newTool]);
        return NextResponse.json({ success: true, tool: newTool });
      }

      const categoryTools = await readToolsFile(categoryFilePath);
      if (categoryTools.some((tool) => tool.slug === newTool.slug)) {
        return NextResponse.json({ error: 'A tool with this slug already exists' }, { status: 409 });
      }
      categoryTools.push(newTool);
      await writeToolsFile(categoryFilePath, categoryTools);
      return NextResponse.json({ success: true, tool: newTool });
    });
  } catch (error) {
    logCatalogMutationFailure('create', error);
    const failure = catalogDatabaseFailure(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}

export async function PUT(request) {
  try {
    const auth = await getCurrentUserWithProfile();
    const { user, isAdmin } = auth;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let updatedTool = await request.json();
    
    // Normalize to canonical schema
    updatedTool = normalizeToolToCanonical(updatedTool);
    updatedTool = toCanonicalNames(updatedTool);
    
    const oldSlug = request.nextUrl.searchParams.get('oldSlug');
    const oldCategory = request.nextUrl.searchParams.get('oldCategory');

    const validationError = validateTool(updatedTool);
    if (validationError || !oldSlug || !oldCategory) {
      return NextResponse.json({ error: validationError || 'Missing required parameters' }, { status: 400 });
    }
    if (!SAFE_SLUG.test(oldSlug) || !SAFE_SLUG.test(oldCategory)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (persistentStorageRequired()) {
      return NextResponse.json({ error: 'Persistent catalog storage is not configured for this deployment.' }, { status: 503 });
    }

    if (persistenceConfigured()) {
      const supabase = getCatalogMutationClient(auth);
      if (!supabase) {
        return NextResponse.json({ error: CATALOG_MUTATION_AUTH_ERROR }, { status: 403 });
      }
      const tools = await loadCatalogForMutation(supabase, await getFileTools());
      const existing = tools.find((tool) => tool.slug === oldSlug);
      if (!existing) return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      if (oldSlug !== updatedTool.slug && tools.some((tool) => tool.slug === updatedTool.slug)) {
        return NextResponse.json({ error: 'A tool with this slug already exists' }, { status: 409 });
      }
      await upsertCatalogTools(supabase, [updatedTool]);
      if (oldSlug !== updatedTool.slug) await deleteCatalogTool(supabase, oldSlug);
      return NextResponse.json({ success: true, tool: updatedTool });
    }

    // If category changed, we need to remove from old file and add to new file
    if (oldCategory !== updatedTool.category) {
      // Remove from old
      const oldFilePath = categoryPath(oldCategory);
      let oldTools = await readToolsFile(oldFilePath);
      const oldToolIndex = oldTools.findIndex((tool) => tool.slug === oldSlug);

      if (oldToolIndex === -1) {
        return NextResponse.json({ error: 'Tool not found in source category' }, { status: 404 });
      }

      oldTools = oldTools.filter((tool) => tool.slug !== oldSlug);
      await writeToolsFile(oldFilePath, oldTools);

      // Add to new
      const newFilePath = categoryPath(updatedTool.category);
      let newTools = await readToolsFile(newFilePath);
      if (newTools.some((tool) => tool.slug === updatedTool.slug)) {
        return NextResponse.json({ error: 'A tool with this slug already exists in the destination category' }, { status: 409 });
      }
      newTools.push(updatedTool);
      await writeToolsFile(newFilePath, newTools);
    } else {
      // Just update in existing file
      const filePath = categoryPath(updatedTool.category);
      let tools = await readToolsFile(filePath);
      const index = tools.findIndex((tool) => tool.slug === oldSlug);

      if (index === -1) {
        return NextResponse.json({ error: 'Tool not found in category' }, { status: 404 });
      }

      if (index !== -1 && tools.some((tool, toolIndex) => toolIndex !== index && tool.slug === updatedTool.slug)) {
        return NextResponse.json({ error: 'A tool with this slug already exists in this category' }, { status: 409 });
      }
      if (index !== -1) {
        tools[index] = updatedTool;
      }
      await writeToolsFile(filePath, tools);
    }

    return NextResponse.json({ success: true, tool: updatedTool });
  } catch (error) {
    logCatalogMutationFailure('update', error);
    const failure = catalogDatabaseFailure(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}

export async function DELETE(request) {
  try {
    const auth = await getCurrentUserWithProfile();
    const { user, isAdmin } = auth;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const slug = request.nextUrl.searchParams.get('slug');
    const category = request.nextUrl.searchParams.get('category');

    if (!slug || !category) {
      return NextResponse.json({ error: 'Missing slug or category' }, { status: 400 });
    }

    const filePath = categoryPath(category);
    if (!filePath || !SAFE_SLUG.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug or category' }, { status: 400 });
    }
    if (persistentStorageRequired()) {
      return NextResponse.json({ error: 'Persistent catalog storage is not configured for this deployment.' }, { status: 503 });
    }

    if (persistenceConfigured()) {
      const supabase = getCatalogMutationClient(auth);
      if (!supabase) {
        return NextResponse.json({ error: CATALOG_MUTATION_AUTH_ERROR }, { status: 403 });
      }
      const tools = await loadCatalogForMutation(supabase, await getFileTools());
      if (!tools.some((tool) => tool.slug === slug)) return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      await deleteCatalogTool(supabase, slug);
      return NextResponse.json({ success: true });
    }
    let tools = await readToolsFile(filePath);
    const nextTools = tools.filter((tool) => tool.slug !== slug);

    if (nextTools.length === tools.length) {
      return NextResponse.json({ error: 'Tool not found in category' }, { status: 404 });
    }

    await writeToolsFile(filePath, nextTools);

    return NextResponse.json({ success: true });
  } catch (error) {
    logCatalogMutationFailure('delete', error);
    const failure = catalogDatabaseFailure(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
