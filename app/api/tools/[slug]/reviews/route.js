import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(request, { params }) {
  const supabase = createClient();
  const slug = params.slug;

  try {
    const { data: reviews, error } = await supabase
      .from('tool_reviews')
      .select(`
        *,
        user_profiles (
          username,
          avatar_url
        )
      `)
      .eq('tool_slug', slug)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
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

    const { rating, review_text } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tool_reviews')
      .upsert({
        tool_slug: slug,
        user_id: user.id,
        rating,
        review_text,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tool_slug, user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: data });
  } catch (error) {
    console.error('Error posting review:', error);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}
