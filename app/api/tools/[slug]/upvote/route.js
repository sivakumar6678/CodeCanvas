import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(request, { params }) {
  const supabase = createClient();
  const slug = params.slug;

  try {
    // Get total upvotes count
    const { count, error } = await supabase
      .from('tool_upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('tool_slug', slug);

    if (error) throw error;

    // Check if current user has upvoted
    let hasUpvoted = false;
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userUpvote } = await supabase
        .from('tool_upvotes')
        .select('tool_slug')
        .eq('tool_slug', slug)
        .eq('user_id', user.id)
        .maybeSingle();

      if (userUpvote) {
        hasUpvoted = true;
      }
    }

    return NextResponse.json({ count: count || 0, hasUpvoted });
  } catch (error) {
    console.error('Error fetching upvotes:', error);
    return NextResponse.json({ count: 0, hasUpvoted: false });
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

    // Check if upvote already exists
    const { data: existing } = await supabase
      .from('tool_upvotes')
      .select('tool_slug')
      .eq('tool_slug', slug)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Downvote / remove upvote
      const { error } = await supabase
        .from('tool_upvotes')
        .delete()
        .eq('tool_slug', slug)
        .eq('user_id', user.id);

      if (error) throw error;
      return NextResponse.json({ action: 'removed' });
    } else {
      // Add upvote
      const { error } = await supabase
        .from('tool_upvotes')
        .insert({ tool_slug: slug, user_id: user.id });

      if (error) throw error;
      return NextResponse.json({ action: 'added' });
    }
  } catch (error) {
    console.error('Error toggling upvote:', error);
    return NextResponse.json({ error: 'Failed to toggle upvote' }, { status: 500 });
  }
}
