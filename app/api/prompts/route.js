import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import defaultPrompts from '../../../data/default-prompts.json';

export async function GET(request) {
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
  const category = request.nextUrl.searchParams.get('category')?.trim() || '';
  const model = request.nextUrl.searchParams.get('model')?.trim() || '';
  const type = request.nextUrl.searchParams.get('type')?.trim() || '';

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
      if (model) queryBuilder = queryBuilder.eq('ai_model', model);
      if (type) queryBuilder = queryBuilder.eq('type', type);

      const { data, error } = await queryBuilder;
      if (!error && Array.isArray(data)) {
        prompts = data;
      }
    }
  } catch (err) {
    console.warn('Supabase prompt fetch skipped/failed, using local prompts cache:', err.message);
  }

  // Merge with default static prompts if supabase results are fewer or empty
  const combined = [...prompts];
  const seenIds = new Set(combined.map((p) => String(p.id)));

  for (const p of defaultPrompts) {
    if (!seenIds.has(String(p.id))) {
      const matchQuery = !query || p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.prompt_content.toLowerCase().includes(query);
      const matchCategory = !category || p.category === category;
      const matchModel = !model || p.ai_model === model;
      const matchType = !type || p.type === type;

      if (matchQuery && matchCategory && matchModel && matchType) {
        combined.push(p);
      }
    }
  }

  return NextResponse.json(combined);
}