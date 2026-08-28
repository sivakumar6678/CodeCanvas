import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { serializeToolSuggestion, validateToolSuggestion } from '../../../../lib/contribution-validation';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('tool_suggestions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load suggestions' }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to suggest a tool' }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const validationError = validateToolSuggestion(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data, error } = await supabase.from('tool_suggestions').insert(serializeToolSuggestion(payload, user.id)).select().single();
  if (error) return NextResponse.json({ error: 'Unable to submit this suggestion' }, { status: 500 });
  return NextResponse.json({ suggestion: data }, { status: 201 });
}

export async function PUT(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...payload } = await request.json().catch(() => ({}));
  const validationError = validateToolSuggestion(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  const { data, error } = await supabase.from('tool_suggestions').update(serializeToolSuggestion(payload, user.id)).eq('id', id).eq('user_id', user.id).eq('status', 'pending').select().single();
  if (error || !data) return NextResponse.json({ error: 'Only your pending suggestion can be edited' }, { status: 403 });
  return NextResponse.json({ suggestion: data });
}