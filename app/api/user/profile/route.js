import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

function toStringArray(val) {
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) return val.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

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
        role: profile?.role || '',
        experience_level: profile?.experience_level || '',
        interests: Array.isArray(profile?.interests) ? profile.interests : [],
        technologies: Array.isArray(profile?.technologies) ? profile.technologies : [],
        goals: Array.isArray(profile?.goals) ? profile.goals : [],
        preferred_pricing: profile?.preferred_pricing || '',
        preferred_platforms: Array.isArray(profile?.preferred_platforms) ? profile.preferred_platforms : [],
        onboarding_completed: Boolean(profile?.onboarding_completed),
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

    // Fetch existing profile for safe merging of partial updates
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const body = await request.json().catch(() => ({}));
    const {
      username,
      avatar_url,
      bio,
      role,
      experience_level,
      interests,
      technologies,
      goals,
      preferred_pricing,
      preferred_platforms,
      onboarding_completed,
    } = body;

    const rawUsername = username !== undefined ? username : (existingProfile?.username || user.email?.split('@')[0] || 'User');
    const normalizedUsername = typeof rawUsername === 'string' ? rawUsername.trim() : 'User';
    const normalizedAvatar = avatar_url !== undefined ? (typeof avatar_url === 'string' ? avatar_url.trim() : '') : (existingProfile?.avatar_url || '');
    const normalizedBio = bio !== undefined ? (typeof bio === 'string' ? bio.trim() : '') : (existingProfile?.bio || '');

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

    const roleVal = role !== undefined ? String(role || '').trim() : (existingProfile?.role || '');
    const experienceVal = experience_level !== undefined ? String(experience_level || '').trim() : (existingProfile?.experience_level || '');
    const interestsVal = interests !== undefined ? toStringArray(interests) : (existingProfile?.interests || []);
    const technologiesVal = technologies !== undefined ? toStringArray(technologies) : (existingProfile?.technologies || []);
    const goalsVal = goals !== undefined ? toStringArray(goals) : (existingProfile?.goals || []);
    const pricingVal = preferred_pricing !== undefined ? String(preferred_pricing || '').trim() : (existingProfile?.preferred_pricing || '');
    const platformsVal = preferred_platforms !== undefined ? toStringArray(preferred_platforms) : (existingProfile?.preferred_platforms || []);
    const onboardingCompletedVal = onboarding_completed !== undefined ? Boolean(onboarding_completed) : Boolean(existingProfile?.onboarding_completed);

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        username: normalizedUsername,
        avatar_url: normalizedAvatar,
        bio: normalizedBio,
        role: roleVal,
        experience_level: experienceVal,
        interests: interestsVal,
        technologies: technologiesVal,
        goals: goalsVal,
        preferred_pricing: pricingVal,
        preferred_platforms: platformsVal,
        onboarding_completed: onboardingCompletedVal,
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

