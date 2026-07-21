import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '../supabase/server';
import { isAdminIdentity } from './access';

export async function getCurrentUserWithProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile,
    isAdmin: isAdminIdentity({ user, profile }),
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
