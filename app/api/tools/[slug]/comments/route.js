import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request, { params }) {
  const supabase = await createClient();
  const slug = (await params).slug;
  if (!SAFE_SLUG.test(slug)) return NextResponse.json({ error: 'Invalid tool slug' }, { status: 400 });

  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user_profiles (username, avatar_url)
      `)
      .eq('tool_slug', slug)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Comments fetch warning:', error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(comments || []);
  } catch (error) {
    console.warn('Error fetching comments:', error.message);
    return NextResponse.json([]);
  }
}

export async function POST(request, { params }) {
  const supabase = await createClient();
  const slug = (await params).slug;
  if (!SAFE_SLUG.test(slug)) return NextResponse.json({ error: 'Invalid tool slug' }, { status: 400 });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parent_id = null } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Comment must be 2,000 characters or fewer' }, { status: 400 });
    }
    if (parent_id !== null && !UUID.test(parent_id)) {
      return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
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
