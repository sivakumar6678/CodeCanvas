import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { isValidAvatarId } from '../../../../lib/avatars';

export const dynamic = 'force-dynamic';

function toStringArray(val) {
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) return val.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

function sanitizeFallbackUsername(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return 'User';
  const prefix = rawEmail.split('@')[0] || 'User';
  const cleaned = prefix.replace(/[^a-zA-Z0-9_.\- ]/g, '_').trim();
  if (cleaned.length < 2) return `User_${cleaned || '1'}`;
  return cleaned.slice(0, 40);
}

async function resolveAuthenticatedUser(supabase, request) {
  try {
    const { data: { user: cookieUser } } = await supabase.auth.getUser();
    if (cookieUser) return cookieUser;
  } catch {
    // ignore and check authorization header fallback
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();
    if (token) {
      try {
        const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
        if (tokenUser) return tokenUser;
      } catch {
        // token authentication failed
      }
    }
  }

  return null;
}

export async function GET(request) {
  const supabase = await createClient();

  try {
    const user = await resolveAuthenticatedUser(supabase, request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError && (profileError.code === '42P01' || (profileError.message && profileError.message.includes('user_profiles')))) {
      return NextResponse.json({
        error: 'The user_profiles table is missing in Supabase. Please execute data/auth_profiles_schema.sql in the Supabase SQL Editor.',
        code: 'TABLE_MISSING'
      }, { status: 503 });
    }

    // Get stats in parallel
    const [
      bookmarksCountRes,
      savedPromptsCountRes,
      reviewsCountRes,
      upvotesCountRes
    ] = await Promise.allSettled([
      supabase.from('saved_tools').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('saved_prompts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('tool_reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('tool_upvotes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    const bookmarksCount = bookmarksCountRes.status === 'fulfilled' ? bookmarksCountRes.value.count || 0 : 0;
    const savedPromptsCount = savedPromptsCountRes.status === 'fulfilled' ? savedPromptsCountRes.value.count || 0 : 0;
    const reviewsCount = reviewsCountRes.status === 'fulfilled' ? reviewsCountRes.value.count || 0 : 0;
    const upvotesCount = upvotesCountRes.status === 'fulfilled' ? upvotesCountRes.value.count || 0 : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: profile?.username || sanitizeFallbackUsername(user.email),
        avatar_url: profile?.avatar_url || profile?.avatar_id || '',
        avatar_id: profile?.avatar_id || (isValidAvatarId(profile?.avatar_url) ? profile.avatar_url : ''),
        bio: profile?.bio || '',
        role: profile?.role || '',
        experience_level: profile?.experience_level || '',
        interests: Array.isArray(profile?.interests) ? profile.interests : [],
        technologies: Array.isArray(profile?.technologies) ? profile.technologies : [],
        goals: Array.isArray(profile?.goals) ? profile.goals : [],
        preferred_pricing: profile?.preferred_pricing || 'any',
        preferred_platforms: Array.isArray(profile?.preferred_platforms) ? profile.preferred_platforms : [],
        onboarding_completed: Boolean(profile?.onboarding_completed),
        created_at: profile?.created_at || user.created_at
      },
      stats: {
        bookmarksCount: bookmarksCount || 0,
        savedPromptsCount: savedPromptsCount || 0,
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
    const user = await resolveAuthenticatedUser(supabase, request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in again.' }, { status: 401 });
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
      avatar_id,
      avatarId,
      bio,
      // role is intentionally not destructured — users cannot self-set it (admin escalation vector)
      experience_level,
      interests,
      technologies,
      goals,
      preferred_pricing,
      preferred_platforms,
      onboarding_completed,
    } = body;


    const rawUsername = username !== undefined
      ? username
      : (existingProfile?.username || sanitizeFallbackUsername(user.email));
    const normalizedUsername = typeof rawUsername === 'string' ? rawUsername.trim() : 'User';

    const inputAvatar = avatar_id !== undefined ? avatar_id : (avatarId !== undefined ? avatarId : avatar_url);
    const normalizedAvatar = inputAvatar !== undefined
      ? (typeof inputAvatar === 'string' ? inputAvatar.trim() : '')
      : (existingProfile?.avatar_url || existingProfile?.avatar_id || '');
    const normalizedAvatarId = isValidAvatarId(normalizedAvatar) ? normalizedAvatar : (existingProfile?.avatar_id || '');

    const normalizedBio = bio !== undefined
      ? (typeof bio === 'string' ? bio.trim() : '')
      : (existingProfile?.bio || '');

    // Allow 2-50 chars: letters, numbers, spaces, dots, dashes, underscores
    if (!/^[a-zA-Z0-9_.\- ]{2,50}$/.test(normalizedUsername)) {
      return NextResponse.json({
        error: 'Username must be 2–50 characters and can only contain letters, numbers, spaces, dots, dashes, or underscores.'
      }, { status: 400 });
    }

    if (normalizedAvatar) {
      const isPreset = isValidAvatarId(normalizedAvatar) || /^[a-zA-Z0-9_\-:]+$/.test(normalizedAvatar);
      if (!isPreset) {
        try {
          const parsedUrl = new URL(normalizedAvatar);
          if (!['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol');
        } catch {
          return NextResponse.json({ error: 'Avatar must be a valid preset identifier or valid image URL.' }, { status: 400 });
        }
      }
    }

    if (normalizedBio.length > 500) {
      return NextResponse.json({ error: 'Bio must be 500 characters or fewer.' }, { status: 400 });
    }

    // SECURITY: `role` is intentionally excluded from the user PUT payload.
    // `user_profiles.role` is checked by isAdminIdentity() — allowing users to
    // write this field would let any authenticated user self-promote to admin.
    // Role assignment must be done server-side (Supabase service role or SQL).
    const experienceVal = experience_level !== undefined ? String(experience_level || '').trim() : (existingProfile?.experience_level || '');
    const interestsVal = interests !== undefined ? toStringArray(interests) : (existingProfile?.interests || []);
    const technologiesVal = technologies !== undefined ? toStringArray(technologies) : (existingProfile?.technologies || []);
    const goalsVal = goals !== undefined ? toStringArray(goals) : (existingProfile?.goals || []);
    const pricingVal = preferred_pricing !== undefined ? String(preferred_pricing || '').trim() : (existingProfile?.preferred_pricing || 'any');
    const platformsVal = preferred_platforms !== undefined ? toStringArray(preferred_platforms) : (existingProfile?.preferred_platforms || []);
    const onboardingCompletedVal = onboarding_completed !== undefined ? Boolean(onboarding_completed) : Boolean(existingProfile?.onboarding_completed);

    const upsertPayload = {
      id: user.id,
      username: normalizedUsername,
      avatar_url: normalizedAvatar,
      bio: normalizedBio,
      // role is intentionally omitted — preserves existing DB value, cannot be user-set
      experience_level: experienceVal,
      interests: interestsVal,
      technologies: technologiesVal,
      goals: goalsVal,
      preferred_pricing: pricingVal,
      preferred_platforms: platformsVal,
      onboarding_completed: onboardingCompletedVal,
    };


    if (normalizedAvatarId) {
      upsertPayload.avatar_id = normalizedAvatarId;
    }

    let { data, error } = await supabase
      .from('user_profiles')
      .upsert(upsertPayload)
      .select()
      .single();

    // Defensive fallback: if any column does not exist yet in Supabase's schema cache (PGRST204),
    // extract the missing column name from the error message, strip it, and retry.
    // This allows profile data to save even if newly added columns have not been migrated or cached yet.
    let retryAttempts = 0;
    const strippedColumns = [];
    while (
      error &&
      (error.code === 'PGRST204' || (typeof error.message === 'string' && error.message.includes('schema cache'))) &&
      retryAttempts < 12
    ) {
      retryAttempts++;
      const match = error.message?.match(/Could not find the '([^']+)' column/i);
      const missingCol = match ? match[1] : null;
      if (missingCol && missingCol in upsertPayload && missingCol !== 'id' && missingCol !== 'username') {
        console.warn(`[profile:upsert] PostgREST schema cache missing column "${missingCol}". Stripping and retrying.`);
        delete upsertPayload[missingCol];
        strippedColumns.push(missingCol);
        const retryRes = await supabase
          .from('user_profiles')
          .upsert(upsertPayload)
          .select()
          .single();
        data = retryRes.data;
        error = retryRes.error;
      } else if (error.message?.includes('avatar_id') && 'avatar_id' in upsertPayload) {
        delete upsertPayload.avatar_id;
        strippedColumns.push('avatar_id');
        const retryRes = await supabase
          .from('user_profiles')
          .upsert(upsertPayload)
          .select()
          .single();
        data = retryRes.data;
        error = retryRes.error;
      } else {
        break;
      }
    }

    if (error) {
      if (error.code === 'PGRST204' || (error.message && error.message.includes('schema cache'))) {
        return NextResponse.json({
          error: "Supabase schema cache is out of date. Please execute data/auth_profiles_schema.sql in the Supabase SQL Editor to add missing columns and run: NOTIFY pgrst, 'reload schema';",
          code: 'SCHEMA_CACHE_STALE'
        }, { status: 503 });
      }
      if (error.code === '42P01' || (error.message && error.message.includes('user_profiles') && error.message.includes('does not exist'))) {
        return NextResponse.json({
          error: 'The user_profiles table is missing in Supabase. Please execute data/auth_profiles_schema.sql in the Supabase SQL Editor to enable profile persistence.',
          code: 'TABLE_MISSING'
        }, { status: 503 });
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'That username is already taken by another account. Please choose a different one.' }, { status: 409 });
      }
      throw error;
    }

    const returnedProfile = {
      ...data,
      avatar_id: data?.avatar_id || (isValidAvatarId(data?.avatar_url) ? data.avatar_url : ''),
      avatar_url: data?.avatar_url || data?.avatar_id || '',
    };

    const responseJson = { success: true, profile: returnedProfile };
    if (strippedColumns.length > 0) {
      responseJson.warning = `The following columns were not found in your Supabase schema cache: ${strippedColumns.join(', ')}. Run data/auth_profiles_schema.sql in Supabase SQL Editor to enable full personalization.`;
    }

    return NextResponse.json(responseJson);
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error?.code === 'PGRST204' || (error?.message && error.message.includes('schema cache'))) {
      return NextResponse.json({
        error: "Supabase schema cache is out of date. Please execute data/auth_profiles_schema.sql in the Supabase SQL Editor to add missing columns and run: NOTIFY pgrst, 'reload schema';",
        code: 'SCHEMA_CACHE_STALE'
      }, { status: 503 });
    }
    if (error?.code === '42P01' || (error?.message && error.message.includes('user_profiles') && error.message.includes('does not exist'))) {
      return NextResponse.json({
        error: 'The user_profiles table is missing in Supabase. Please execute data/auth_profiles_schema.sql in the Supabase SQL Editor to enable profile persistence.',
        code: 'TABLE_MISSING'
      }, { status: 503 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
