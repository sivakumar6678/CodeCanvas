import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserWithProfile } from '../../../../lib/auth/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { cleanTags, cleanText, validatePromptSubmission, validateToolSuggestion } from '../../../../lib/contribution-validation';
import { getCatalogFileForCategory, getCatalogCategorySlugs } from '../../../../lib/catalog-categories';
import { normalizeToolToCanonical, toCanonicalNames } from '../../../../lib/canonical-tool-schema';
import { getCategories } from '../../../../lib/data-fetchers';

const DATA_DIR = path.join(process.cwd(), 'data', 'ai-tools');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value) {
  return cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function readCategory(category) {
  const fileName = getCatalogFileForCategory(category);
  if (!fileName) return [];
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, fileName), 'utf8'));
  } catch {
    return [];
  }
}

async function writeCategory(category, tools) {
  const fileName = getCatalogFileForCategory(category);
  if (!fileName) throw new Error(`No catalog file is mapped for category "${category}"`);
  const filePath = path.join(DATA_DIR, fileName);
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, JSON.stringify(tools, null, 2), 'utf8');
  await fs.rename(temporaryPath, filePath);
}

async function publishTool(suggestion) {
  const category = slugify(suggestion.category);
  const fileName = getCatalogFileForCategory(category);
  if (!fileName) throw new Error(`Category "${suggestion.category}" has no mapped catalog file`);

  const tools = await readCategory(category);
  const baseSlug = slugify(suggestion.tool_name);
  if (!SAFE_SLUG.test(baseSlug)) throw new Error('Tool name cannot be converted to a valid slug');
  
  const slug = tools.some((tool) => tool.slug === baseSlug) ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const rawTool = {
    id: `tool-${Date.now()}`,
    name: suggestion.tool_name,
    slug,
    logoImageUrl: suggestion.logoImageUrl || suggestion.logo || '',
    bannerImageUrl: suggestion.bannerImageUrl || suggestion.banner || '',
    description: suggestion.description,
    fullOverview: suggestion.recommendation_reason || suggestion.fullOverview || suggestion.description || '',
    keyFeatures: Array.isArray(suggestion.keyFeatures) ? suggestion.keyFeatures : [],
    pros: Array.isArray(suggestion.pros) ? suggestion.pros : [],
    cons: Array.isArray(suggestion.cons) ? suggestion.cons : [],
    website: suggestion.website_url || suggestion.website,
    category,
    subCategory: suggestion.subcategory || suggestion.subCategory || '',
    pricingModel: suggestion.pricingModel || suggestion.pricing || 'Free',
    hasFree: suggestion.hasFree !== undefined ? Boolean(suggestion.hasFree) : (suggestion.pricing === 'Free' || suggestion.pricing === 'Freemium'),
    platforms: Array.isArray(suggestion.platforms) ? suggestion.platforms : [],
    tags: suggestion.tags || [],
    useCases: Array.isArray(suggestion.useCases) ? suggestion.useCases : [],
    bestFor: Array.isArray(suggestion.bestFor) ? suggestion.bestFor : [],
    featured: false,
    new: true,
    verified: false,
    suggestedBy: suggestion.is_anonymous ? null : suggestion.display_name,
    createdDate: new Date().toISOString(),
  };

  const canonicalTool = toCanonicalNames(normalizeToolToCanonical(rawTool));
  await writeCategory(category, [...tools, canonicalTool]);
  return canonicalTool;
}

async function requireAdmin() {
  const auth = await getCurrentUserWithProfile();
  if (!auth.user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!auth.isAdmin) return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { auth };
}

export async function GET(request) {
  const access = await requireAdmin();
  if (access.response) return access.response;
  const supabase = createAdminClient();
  const type = request.nextUrl.searchParams.get('type');
  const status = request.nextUrl.searchParams.get('status');
  const categories = await getCategories();
  const tables = type === 'prompt' ? ['prompt_submissions'] : type === 'tool' ? ['tool_suggestions'] : ['tool_suggestions', 'prompt_submissions'];
  
  const results = await Promise.all(tables.map(async (table) => {
    let builder = supabase.from(table).select('*').order('created_at', { ascending: false });
    if (status) builder = builder.eq('status', status);
    const { data, error } = await builder;
    if (error) {
      console.error(`Error querying ${table}:`, error);
      return [];
    }
    return data || [];
  }));

  const resultByTable = Object.fromEntries(tables.map((table, index) => [table, results[index]]));
  return NextResponse.json({
    toolSuggestions: resultByTable.tool_suggestions || [],
    promptSubmissions: resultByTable.prompt_submissions || [],
    categories: categories || []
  });
}

export async function PATCH(request) {
  const access = await requireAdmin();
  if (access.response) return access.response;
  const payload = await request.json().catch(() => null);
  const { type, id, action, data = {} } = payload || {};
  if (!['tool', 'prompt'].includes(type) || !id || !['edit', 'approve', 'edit-and-approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid review operation' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const table = type === 'tool' ? 'tool_suggestions' : 'prompt_submissions';
  const { data: existing, error: findError } = await supabase.from(table).select('*').eq('id', id).single();
  if (findError || !existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  const merged = { ...existing, ...data };
  const validationError = type === 'tool' ? validateToolSuggestion(merged) : validatePromptSubmission(merged);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  
  const changes = {
    ...data,
    tags: cleanTags(merged.tags),
    updated_at: new Date().toISOString(),
  };
  if (action === 'reject') changes.status = 'rejected';
  if (action === 'approve' || action === 'edit-and-approve') changes.status = 'approved';

  if (type === 'tool' && (action === 'approve' || action === 'edit-and-approve')) {
    try {
      const publishedTool = await publishTool(merged);
      changes.published_slug = publishedTool.slug;
    } catch (error) {
      return NextResponse.json({ error: error.message || 'Unable to publish tool' }, { status: 400 });
    }
  }
  const { data: updated, error } = await supabase.from(table).update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'Unable to update submission' }, { status: 500 });
  return NextResponse.json({ submission: updated });
}