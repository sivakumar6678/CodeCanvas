import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { serializePromptSubmission, validatePromptSubmission } from '../../../../lib/contribution-validation';
import { recordAnalyticsEvent } from '../../../../lib/analytics';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('prompt_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Unable to load submissions' }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to submit a contribution' }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const validationError = validatePromptSubmission(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data, error } = await supabase
    .from('prompt_submissions')
    .insert(serializePromptSubmission(payload, user.id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Unable to submit this contribution' }, { status: 500 });

  // Record non-blocking analytics event
  recordAnalyticsEvent(supabase, {
    event_type: 'contribution',
    entity_type: 'knowledge',
    entity_id: data.title,
    metadata: { type: data.type, category: data.category },
    user_id: user.id,
  }).catch(() => {});

  return NextResponse.json({ prompt: data }, { status: 201 });
}

export async function PUT(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...payload } = await request.json().catch(() => ({}));
  const validationError = validatePromptSubmission(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data, error } = await supabase
    .from('prompt_submissions')
    .update(serializePromptSubmission(payload, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Only your pending submission can be edited' }, { status: 403 });
  return NextResponse.json({ prompt: data });
}

export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  const { error } = await supabase
    .from('prompt_submissions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) return NextResponse.json({ error: 'Unable to withdraw submission' }, { status: 500 });
  return NextResponse.json({ success: true });
}