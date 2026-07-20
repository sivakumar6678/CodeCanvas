import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(request, { params }) {
  const supabase = createClient();
  const slug = params.slug;

  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user_profiles (username, avatar_url)
      `)
      .eq('tool_slug', slug)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const supabase = createClient();
  const slug = params.slug;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parent_id = null } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        tool_slug: slug,
        user_id: user.id,
        parent_id,
        content
      })
      .select(`
        *,
        user_profiles (username, avatar_url)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, comment: data });
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
