import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getToolBySlug } from '../../../../lib/data-fetchers';

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bookmarks, error } = await supabase
      .from('saved_tools')
      .select('tool_slug, saved_at')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });

    if (error) {
      // If table doesn't exist yet in Supabase (PGRST205 / 42P01), return empty list gracefully
      if (error.code === 'PGRST205' || error.code === '42P01') {
        console.warn('saved_tools table not found in Supabase schema cache. Return empty array.');
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(bookmarks || []);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tool_slug, action } = await request.json();

    if (!tool_slug || !SAFE_SLUG.test(tool_slug)) {
      return NextResponse.json({ error: 'Tool slug is required' }, { status: 400 });
    }

    if (action === 'save') {
      const tool = await getToolBySlug(tool_slug);
      if (!tool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }
      const { error } = await supabase
        .from('saved_tools')
        .insert({ tool_slug, user_id: user.id });
      
      if (error && error.code !== '23505') throw error; // Ignore duplicate key error
    } else if (action === 'remove') {
      const { error } = await supabase
        .from('saved_tools')
        .delete()
        .eq('tool_slug', tool_slug)
        .eq('user_id', user.id);
        
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Action must be save or remove' }, { status: 400 });
    }

    return NextResponse.json({ success: true, saved: action === 'save' });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}
