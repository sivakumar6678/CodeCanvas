import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '../supabase/server';
import { isAdminIdentity } from './access';

export async function getCurrentUserWithProfile() {
  const supabase = await createClient();
  let authUser = null;

  try {
    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (!error && data?.user) {
      authUser = data.user;
    }
  } catch (err) {
    console.warn('[auth] getCurrentUserWithProfile: Supabase auth unavailable:', err?.message || err);
    return { supabase, user: null, profile: null, isAdmin: false };
  }

  if (!authUser) {
    return { supabase, user: null, profile: null, isAdmin: false };
  }

  let userProfile = null;
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    userProfile = data || null;
  } catch (err) {
    console.warn('[auth] getCurrentUserWithProfile: profile query unavailable:', err?.message || err);
  }

  return {
    supabase,
    user: authUser,
    profile: userProfile,
    isAdmin: isAdminIdentity({ user: authUser, profile: userProfile }),
  };
}

export async function requireAdminAccess() {
  const auth = await getCurrentUserWithProfile();

  if (!auth.user) {
    redirect('/login?next=/studio');
  }

  if (!auth.isAdmin) {
    redirect('/forbidden');
  }

  return auth;
}
