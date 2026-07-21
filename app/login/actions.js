'use server';

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminIdentity, isSafeRedirectPath } from '../../lib/auth/access';

export async function login(formData) {
  const supabase = createClient();

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    profile = data;
  }

  const nextPath = formData.get('next');
  const isAdmin = isAdminIdentity({ user, profile });

  if (isSafeRedirectPath(nextPath) && !nextPath.startsWith('/studio')) {
    redirect(nextPath);
  }

  if (isSafeRedirectPath(nextPath) && nextPath.startsWith('/studio')) {
    redirect(isAdmin ? nextPath : '/forbidden');
  }

  redirect(isAdmin ? '/studio' : '/profile');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
