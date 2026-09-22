import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserWithProfile } from '../../../../lib/auth/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import {
  cleanTags,
  cleanText,
  validatePromptSubmission,
  validateToolSuggestion,
  CONTRIBUTION_TYPES,
} from '../../../../lib/contribution-validation';
import { getCatalogFileForCategory } from '../../../../lib/catalog-categories';
import { normalizeToolToCanonical, toCanonicalNames } from '../../../../lib/canonical-tool-schema';
import { normalizeKnowledgeItem } from '../../../../lib/knowledge-schema';
import { getCategories } from '../../../../lib/data-fetchers';

const DATA_DIR = path.join(process.cwd(), 'data', 'ai-tools');
const PROMPTS_FILE = path.join(process.cwd(), 'data', 'default-prompts.json');
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value) {
  return cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

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

export async function publishKnowledge(submission) {
  const items = await readPromptsFile();
  const baseSlug = slugify(submission.title);
  if (!SAFE_SLUG.test(baseSlug)) throw new Error('Title cannot be converted to a valid slug');

  const id = items.some((item) => item.id === baseSlug)
    ? `${baseSlug}-${Date.now().toString(36)}`
    : baseSlug;

  const rawItem = {
    id,
    title: submission.title,
    type: submission.type || 'prompt',
    prompt_content: submission.prompt_content,
    ai_model: submission.ai_model || submission.platform || 'Universal',
    platform: submission.platform || submission.ai_model || 'Universal',
    category: submission.category,
    use_case: submission.use_case || (submission.use_cases && submission.use_cases[0]) || '',
    use_cases: Array.isArray(submission.use_cases) && submission.use_cases.length > 0
      ? submission.use_cases
      : (submission.use_case ? [submission.use_case] : []),
    tags: Array.isArray(submission.tags) ? submission.tags : cleanTags(submission.tags),
    description: submission.description,
    author: submission.is_anonymous ? 'Community Contributor' : (submission.display_name || 'Community Contributor'),
    contributor: {
      displayName: submission.is_anonymous ? 'Community Contributor' : (submission.display_name || 'Community Contributor'),
    },
    status: 'published',
  };

  const normalized = normalizeKnowledgeItem(rawItem);
  const existingIdx = items.findIndex((i) => i.id === normalized.id);
  if (existingIdx !== -1) {
    items[existingIdx] = normalized;
  } else {
    items.unshift(normalized);
  }

  await writePromptsFile(items);
  return normalized;
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

  const slug = tools.some((tool) => tool.slug === baseSlug)
    ? `${baseSlug}-${Date.now().toString(36)}`
    : baseSlug;

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
    hasFree:
      suggestion.hasFree !== undefined
        ? Boolean(suggestion.hasFree)
        : suggestion.pricing === 'Free' || suggestion.pricing === 'Freemium',
    platforms: Array.isArray(suggestion.platforms)
      ? suggestion.platforms
      : typeof suggestion.platforms === 'string'
        ? suggestion.platforms.split(',').map((p) => p.trim()).filter(Boolean)
        : ['Web'],
    tags: Array.isArray(suggestion.tags) ? suggestion.tags : cleanTags(suggestion.tags),
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

  const categories = await getCategories();
  const adminClient = createAdminClient();
  const supabase = adminClient || access.auth.supabase;

  if (!supabase) {
    return NextResponse.json({
      toolSuggestions: [],
      promptSubmissions: [],
      categories: categories || [],
      missingConfig: true,
      warning: 'Supabase client is not available.',
    });
  }

  const type = request.nextUrl.searchParams.get('type') || 'all';
  const status = request.nextUrl.searchParams.get('status');
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';

  const includeTools = type === 'all' || type === 'tool';
  const includePrompts = type === 'all' || type !== 'tool';

  const [toolsRes, promptsRes] = await Promise.all([
    includeTools
      ? (async () => {
          let b = supabase.from('tool_suggestions').select('*').order('created_at', { ascending: false });
          if (status && status !== 'all') b = b.eq('status', status);
          const { data, error } = await b;
          if (error) console.error('tool_suggestions fetch error:', error);
          return data || [];
        })()
      : Promise.resolve([]),
    includePrompts
      ? (async () => {
          let b = supabase.from('prompt_submissions').select('*').order('created_at', { ascending: false });
          if (status && status !== 'all') b = b.eq('status', status);
          if (type !== 'all' && type !== 'prompt' && CONTRIBUTION_TYPES.includes(type)) {
            b = b.eq('type', type);
          }
          const { data, error } = await b;
          if (error) console.error('prompt_submissions fetch error:', error);
          return data || [];
        })()
      : Promise.resolve([]),
  ]);

  let toolSuggestions = toolsRes;
  let promptSubmissions = promptsRes;

  // In-memory query filtering if search term provided
  if (query) {
    toolSuggestions = toolSuggestions.filter(
      (t) =>
        t.tool_name?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.display_name?.toLowerCase().includes(query) ||
        (Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(query)))
    );

    promptSubmissions = promptSubmissions.filter(
      (p) =>
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.prompt_content?.toLowerCase().includes(query) ||
        p.display_name?.toLowerCase().includes(query) ||
        (Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(query)))
    );
  }

  return NextResponse.json({
    toolSuggestions,
    promptSubmissions,
    categories: categories || [],
  });
}

export async function PATCH(request) {
  const access = await requireAdmin();
  if (access.response) return access.response;

  const payload = await request.json().catch(() => null);
  const { type, id, action, data = {} } = payload || {};

  if (
    !['tool', 'prompt'].includes(type) ||
    !id ||
    !['edit', 'approve', 'edit-and-approve', 'publish', 'reject', 'delete'].includes(action)
  ) {
    return NextResponse.json({ error: 'Invalid review operation' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const supabase = adminClient || access.auth.supabase;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase database client unavailable.' }, { status: 503 });
  }

  const table = type === 'tool' ? 'tool_suggestions' : 'prompt_submissions';

  if (action === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
    return NextResponse.json({ success: true, deletedId: id });
  }

  const { data: existing, error: findError } = await supabase.from(table).select('*').eq('id', id).single();
  if (findError || !existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  const merged = { ...existing, ...data };
  const validationError = type === 'tool' ? validateToolSuggestion(merged) : validatePromptSubmission(merged);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const changes = {
    ...data,
    tags: cleanTags(merged.tags),
    admin_notes: cleanText(data.admin_notes !== undefined ? data.admin_notes : existing.admin_notes, 1000),
    updated_at: new Date().toISOString(),
  };

  if (action === 'reject') changes.status = 'rejected';
  if (action === 'approve' || action === 'edit-and-approve' || action === 'publish') {
    changes.status = 'approved';
  }

  if (type === 'tool' && (action === 'approve' || action === 'edit-and-approve' || action === 'publish')) {
    try {
      const publishedTool = await publishTool(merged);
      changes.published_slug = publishedTool.slug;
    } catch (error) {
      return NextResponse.json({ error: error.message || 'Unable to publish tool' }, { status: 400 });
    }
  }

  if (type === 'prompt' && (action === 'approve' || action === 'edit-and-approve' || action === 'publish')) {
    try {
      const publishedKnowledge = await publishKnowledge(merged);
      changes.published_id = publishedKnowledge.id;
    } catch (error) {
      return NextResponse.json({ error: error.message || 'Unable to publish knowledge item' }, { status: 400 });
    }
  }

  const { data: updated, error } = await supabase.from(table).update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'Unable to update submission' }, { status: 500 });
  return NextResponse.json({ submission: updated });
}

export async function DELETE(request) {
  const access = await requireAdmin();
  if (access.response) return access.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!['tool', 'prompt'].includes(type) || !id) {
    return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const supabase = adminClient || access.auth.supabase;
  const table = type === 'tool' ? 'tool_suggestions' : 'prompt_submissions';

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Unable to delete submission' }, { status: 500 });
  return NextResponse.json({ success: true, deletedId: id });
}