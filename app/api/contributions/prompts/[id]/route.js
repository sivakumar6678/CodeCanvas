import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import defaultPrompts from '../../../../../data/default-prompts.json';
import { recordAnalyticsEvent, recordPromptAnalyticsEvent } from '../../../../../lib/analytics';

export async function POST(request, { params }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data: { user } } = await supabase.auth.getUser();
  const action = (await request.json().catch(() => ({}))).action;
  if (!['save', 'remove', 'copy', 'view'].includes(action)) return NextResponse.json({ error: 'Invalid prompt action' }, { status: 400 });

  let prompt = null;
  try {
    const { data } = await supabase.from('prompt_submissions').select('id').eq('id', id).eq('status', 'approved').maybeSingle();
    prompt = data;
  } catch (_err) {
    // Fall back to default prompts
  }

  if (!prompt) {
    prompt = defaultPrompts.find((p) => String(p.id) === String(id)) || null;
  }

  if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });

  if (action === 'save' || action === 'remove') {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const table = 'saved_prompts';
    try {
      const query = action === 'save'
        ? supabase.from(table).upsert({ user_id: user.id, prompt_id: id })
        : supabase.from(table).delete().eq('user_id', user.id).eq('prompt_id', id);
      await query;
    } catch (err) {
      console.warn('Unable to persist saved prompt to Supabase:', err.message);
    }
  }

  if (action === 'copy' || action === 'view' || action === 'save') {
    recordPromptAnalyticsEvent(supabase, {
      prompt_id: id,
      event_type: action,
      user_id: user?.id || null,
    }).catch(() => {});
    const mappedType = action === 'copy' ? 'knowledge_copy' : action === 'view' ? 'knowledge_view' : 'knowledge_save';
    recordAnalyticsEvent(supabase, {
      event_type: mappedType,
      entity_type: 'knowledge',
      entity_id: id,
      user_id: user?.id || null,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, saved: action === 'save' });
}