import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import defaultPrompts from '../../../data/default-prompts.json';
import { groupKnowledgeType } from '../../../lib/knowledge-schema';

export async function GET(request) {
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
  const category = request.nextUrl.searchParams.get('category')?.trim() || '';
  const model = request.nextUrl.searchParams.get('model')?.trim().toLowerCase() || '';
  const type = request.nextUrl.searchParams.get('type')?.trim().toLowerCase() || '';
  const useCase = request.nextUrl.searchParams.get('useCase')?.trim().toLowerCase() || '';
  const tag = request.nextUrl.searchParams.get('tag')?.trim().toLowerCase() || '';

  let prompts = [];

  try {
    const supabase = await createClient();
    if (supabase) {
      let queryBuilder = supabase
        .from('prompt_submissions')
        .select('id,title,type,prompt_content,ai_model,category,use_case,use_cases,tags,description,display_name,is_anonymous,created_date,created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (query) queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,prompt_content.ilike.%${query}%`);
      if (category) queryBuilder = queryBuilder.eq('category', category);
      if (useCase) queryBuilder = queryBuilder.or(`use_case.ilike.%${useCase}%,use_cases.cs.{${useCase}}`);
      if (tag) queryBuilder = queryBuilder.contains('tags', [tag]);

      const { data, error } = await queryBuilder;
      if (!error && Array.isArray(data)) {
        prompts = data;
      }
    }
  } catch (err) {
    console.warn('Supabase prompt fetch skipped/failed, using local prompts cache:', err.message);
  }

  // Merge with default static prompts
  const combined = [...prompts];
  const seenIds = new Set(combined.map((p) => String(p.id)));

  for (const p of defaultPrompts) {
    if (!seenIds.has(String(p.id))) {
      combined.push(p);
    }
  }

  // Filter combined set with full grouped type matching and model/platform support
  const filtered = combined.filter((p) => {
    // Exclude draft or unpublished items
    if (p.status === 'draft') {
      return false;
    }

    if (query) {
      const matchQuery =
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.prompt_content?.toLowerCase().includes(query);
      if (!matchQuery) return false;
    }

    if (category && p.category?.toLowerCase() !== category.toLowerCase()) {
      return false;
    }

    if (model) {
      const itemModel = (p.ai_model || '').toLowerCase();
      if (itemModel !== model && !itemModel.includes(model)) {
        return false;
      }
    }

    if (type) {
      const itemGroup = groupKnowledgeType(p.type);
      const targetGroup = groupKnowledgeType(type);
      if (itemGroup !== targetGroup && p.type?.toLowerCase() !== type) {
        return false;
      }
    }

    if (useCase) {
      const promptUseCases = [p.use_case, ...(p.use_cases || [])].filter(Boolean).map((u) => String(u).toLowerCase());
      if (!promptUseCases.some((u) => u.includes(useCase) || useCase.includes(u))) {
        return false;
      }
    }

    if (tag) {
      const promptTags = (p.tags || []).map((t) => String(t).toLowerCase());
      if (!promptTags.some((t) => t === tag || t.includes(tag))) {
        return false;
      }
    }

    return true;
  });

  return NextResponse.json(filtered);
}