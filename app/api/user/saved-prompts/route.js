import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import defaultPrompts from '../../../../data/default-prompts.json';

export async function GET(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: savedRows, error } = await supabase
      .from('saved_prompts')
      .select('prompt_id, saved_at')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(savedRows || []);
  } catch (error) {
    console.error('Error fetching saved prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch saved prompts' }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt_id, action } = await request.json();

    if (!prompt_id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }

    if (action === 'save') {
      const { error } = await supabase
        .from('saved_prompts')
        .upsert({ prompt_id: String(prompt_id), user_id: user.id });

      if (error && error.code !== '23505') {
        console.warn('Could not save prompt to Supabase:', error.message);
      }

      // Track analytics save event (non-blocking)
      try {
        await supabase
          .from('analytics_prompt_events')
          .insert({ prompt_id: String(prompt_id), event_type: 'save', user_id: user.id });
      } catch (e) {}
    } else if (action === 'remove') {
      const { error } = await supabase
        .from('saved_prompts')
        .delete()
        .eq('prompt_id', String(prompt_id))
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Action must be save or remove' }, { status: 400 });
    }

    return NextResponse.json({ success: true, saved: action === 'save' });
  } catch (error) {
    console.error('Error toggling prompt bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle prompt bookmark' }, { status: 500 });
  }
}
