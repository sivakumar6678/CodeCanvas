import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function POST(request, { params }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const action = (await request.json().catch(() => ({}))).action;
  if (!['save', 'remove', 'copy', 'view'].includes(action)) return NextResponse.json({ error: 'Invalid prompt action' }, { status: 400 });
  const { data: prompt } = await supabase.from('prompt_submissions').select('id').eq('id', params.id).eq('status', 'approved').maybeSingle();
  if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  if (action === 'save' || action === 'remove') {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const table = 'saved_prompts';
    const query = action === 'save'
      ? supabase.from(table).upsert({ user_id: user.id, prompt_id: params.id })
      : supabase.from(table).delete().eq('user_id', user.id).eq('prompt_id', params.id);
    const { error } = await query;
    if (error) return NextResponse.json({ error: 'Unable to update saved prompts' }, { status: 500 });
  }
  if (action === 'copy' || action === 'view' || action === 'save') {
    const { error } = await supabase.from('analytics_prompt_events').insert({ prompt_id: params.id, event_type: action, user_id: user?.id || null });
    if (error) return NextResponse.json({ error: 'Unable to track prompt activity' }, { status: 500 });
  }
  return NextResponse.json({ success: true, saved: action === 'save' });
}