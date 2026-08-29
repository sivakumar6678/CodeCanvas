import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Get stats
    const { count: bookmarksCount } = await supabase
      .from('saved_tools')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: collectionsCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: reviewsCount } = await supabase
      .from('tool_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: upvotesCount } = await supabase
      .from('tool_upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: profile?.username || user.email?.split('@')[0] || 'User',
        avatar_url: profile?.avatar_url || '',
        bio: profile?.bio || '',
        created_at: profile?.created_at || user.created_at
      },
      stats: {
        bookmarksCount: bookmarksCount || 0,
        collectionsCount: collectionsCount || 0,
        reviewsCount: reviewsCount || 0,
        upvotesCount: upvotesCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, avatar_url, bio } = await request.json();
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedAvatar = typeof avatar_url === 'string' ? avatar_url.trim() : '';
    const normalizedBio = typeof bio === 'string' ? bio.trim() : '';

    if (!/^[a-zA-Z0-9_\- ]{2,40}$/.test(normalizedUsername)) {
      return NextResponse.json({ error: 'Username must be 2–40 characters and use letters, numbers, spaces, _ or -.' }, { status: 400 });
    }

    if (normalizedAvatar) {
      try {
        const avatarUrl = new URL(normalizedAvatar);
        if (!['http:', 'https:'].includes(avatarUrl.protocol)) throw new Error('Invalid protocol');
      } catch {
        return NextResponse.json({ error: 'Avatar URL must be a valid HTTP or HTTPS URL.' }, { status: 400 });
      }
    }

    if (normalizedBio.length > 500) {
      return NextResponse.json({ error: 'Bio must be 500 characters or fewer.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        username: normalizedUsername,
        avatar_url: normalizedAvatar,
        bio: normalizedBio
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'That username is already in use.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
