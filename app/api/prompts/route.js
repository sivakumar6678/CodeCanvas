import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request) {
  const supabase = await createClient();
  const query = request.nextUrl.searchParams.get('q')?.trim();
  const category = request.nextUrl.searchParams.get('category')?.trim();
  const model = request.nextUrl.searchParams.get('model')?.trim();
  const type = request.nextUrl.searchParams.get('type')?.trim();
  let queryBuilder = supabase.from('prompt_submissions').select('id,title,type,prompt_content,ai_model,category,use_case,use_cases,tags,description,display_name,is_anonymous,created_date').eq('status', 'approved').order('created_at', { ascending: false });
  if (query) queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,prompt_content.ilike.%${query}%`);
  if (category) queryBuilder = queryBuilder.eq('category', category);
  if (model) queryBuilder = queryBuilder.eq('ai_model', model);
  if (type) queryBuilder = queryBuilder.eq('type', type);
  const { data, error } = await queryBuilder;
  if (error) return NextResponse.json({ error: 'Unable to load prompts' }, { status: 500 });
  return NextResponse.json(data || []);
}