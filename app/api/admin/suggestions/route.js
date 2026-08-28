import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserWithProfile } from '../../../../lib/auth/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { cleanTags, cleanText, validatePromptSubmission, validateToolSuggestion } from '../../../../lib/contribution-validation';

const DATA_DIR = path.join(process.cwd(), 'data', 'ai-tools');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value) {
  return cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function readCategory(category) {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${category}.json`), 'utf8'));
  } catch {
    return [];
  }
}

async function writeCategory(category, tools) {
  const filePath = path.join(DATA_DIR, `${category}.json`);
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, JSON.stringify(tools, null, 2), 'utf8');
  await fs.rename(temporaryPath, filePath);
}

async function publishTool(suggestion) {
  const category = slugify(suggestion.category);
  if (!SAFE_SLUG.test(category)) throw new Error('Suggestion category cannot be published');
  const tools = await readCategory(category);
  const baseSlug = slugify(suggestion.tool_name);
  if (!SAFE_SLUG.test(baseSlug)) throw new Error('Suggestion name cannot be published');
  const slug = tools.some((tool) => tool.slug === baseSlug) ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
  const tool = {
    id: `tool-${Date.now()}`,
    name: suggestion.tool_name,
    slug,
    logo: '',
    banner: '',
    description: suggestion.description,
    overview: suggestion.recommendation_reason,
    features: [],
    pros: [],
    cons: [],
    website: suggestion.website_url,
    category,
    subCategory: suggestion.subcategory || '',
    pricing: suggestion.pricing,
    freeTrial: false,
    platform: [],
    tags: suggestion.tags || [],
    featured: false,
    new: true,
    verified: false,
    suggestedBy: suggestion.is_anonymous ? null : suggestion.display_name,
    createdDate: new Date().toISOString(),
  };
  await writeCategory(category, [...tools, tool]);
  return tool;
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
  const tables = type === 'prompt' ? ['prompt_submissions'] : type === 'tool' ? ['tool_suggestions'] : ['tool_suggestions', 'prompt_submissions'];
  const results = await Promise.all(tables.map(async (table) => {
    let builder = supabase.from(table).select('*').order('created_at', { ascending: false });
    if (status) builder = builder.eq('status', status);
    const { data, error } = await builder;
    if (error) throw error;
    return data || [];
  }));
  const resultByTable = Object.fromEntries(tables.map((table, index) => [table, results[index]]));
  return NextResponse.json({ toolSuggestions: resultByTable.tool_suggestions || [], promptSubmissions: resultByTable.prompt_submissions || [] });
}

export async function PATCH(request) {
  const access = await requireAdmin();
  if (access.response) return access.response;
  const payload = await request.json().catch(() => null);
  const { type, id, action, data = {} } = payload || {};
  if (!['tool', 'prompt'].includes(type) || !id || !['edit', 'approve', 'edit-and-approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Invalid review operation' }, { status: 400 });

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