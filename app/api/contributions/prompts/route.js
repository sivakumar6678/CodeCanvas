import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { serializePromptSubmission, validatePromptSubmission } from '../../../../lib/contribution-validation';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('prompt_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load prompt submissions' }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to suggest a prompt' }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const validationError = validatePromptSubmission(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  const { data, error } = await supabase.from('prompt_submissions').insert(serializePromptSubmission(payload, user.id)).select().single();
  if (error) return NextResponse.json({ error: 'Unable to submit this prompt' }, { status: 500 });
  return NextResponse.json({ prompt: data }, { status: 201 });
}

export async function PUT(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...payload } = await request.json().catch(() => ({}));
  const validationError = validatePromptSubmission(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  const { data, error } = await supabase.from('prompt_submissions').update(serializePromptSubmission(payload, user.id)).eq('id', id).eq('user_id', user.id).eq('status', 'pending').select().single();
  if (error || !data) return NextResponse.json({ error: 'Only your pending prompt can be edited' }, { status: 403 });
  return NextResponse.json({ prompt: data });
}