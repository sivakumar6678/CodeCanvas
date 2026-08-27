'use server';

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminIdentity, isSafeRedirectPath } from '../../lib/auth/access';

const redactEmail = (email) => {
  if (typeof email !== 'string' || !email.includes('@')) return '[invalid-email]';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};

export async function login(formData) {
  const supabase = createClient();

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  console.info('[auth] login:start', { email: redactEmail(data.email) });

  let authError;
  try {
    ({ error: authError } = await supabase.auth.signInWithPassword(data));
  } catch (error) {
    console.error('[auth] login:request-failed', { name: error?.name, message: error?.message });
    return { error: 'Unable to reach Supabase. Check your connection and try again.' };
  }

  if (authError) {
    console.warn('[auth] login:rejected', { email: redactEmail(data.email), code: authError.code, status: authError.status, message: authError.message });
    return { error: authError.message };
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
    console.info('[auth] login:authenticated', { userId: user.id, hasProfile: Boolean(profile) });
    if (!profile) {
      const username = user.user_metadata?.username || user.email?.split('@')[0] || `user-${user.id.slice(0, 8)}`;
      const { data: provisionedProfile } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, username, avatar_url: '', bio: '' }, { onConflict: 'id' })
        .select()
        .maybeSingle();
      profile = provisionedProfile;
      console.info('[auth] login:profile-provisioned', { userId: user.id, success: Boolean(profile) });
    }
  }

  const nextPath = formData.get('next');
  const isAdmin = isAdminIdentity({ user, profile });

  const redirectTo =
    isSafeRedirectPath(nextPath) && (!nextPath.startsWith('/studio') || isAdmin)
      ? nextPath
      : isSafeRedirectPath(nextPath) && nextPath.startsWith('/studio')
        ? '/forbidden'
        : isAdmin
          ? '/studio'
          : '/profile';

  console.info('[auth] login:success', { userId: user?.id, redirectTo });
  return { success: 'Signed in successfully.', redirectTo };
}

export async function signup(formData) {
  const supabase = createClient();
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();
  const username = formData.get('username')?.toString().trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

  if (!email || !password || !username) {
    return { error: 'Username, email, and password are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  if (!/^[a-zA-Z0-9_\- ]{2,40}$/.test(username)) {
    return { error: 'Username must be 2–40 characters and use letters, numbers, spaces, _ or -.' };
  }

  console.info('[auth] signup:start', { email: redactEmail(email), username });

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        ...(siteUrl ? { emailRedirectTo: `${siteUrl}/auth/callback` } : {}),
      },
    }));
  } catch (signupError) {
    console.error('[auth] signup:request-failed', { name: signupError?.name, message: signupError?.message });
    return { error: 'Unable to reach Supabase. Check your connection and try again.' };
  }
  if (error) {
    console.warn('[auth] signup:rejected', { email: redactEmail(email), code: error.code, status: error.status, message: error.message });
    return { error: error.message };
  }

  console.info('[auth] signup:accepted', { userId: data.user?.id, hasSession: Boolean(data.session) });

  if (data.user && data.session) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ id: data.user.id, username, avatar_url: '', bio: '' }, { onConflict: 'id' });

    if (profileError) {
      console.error('[auth] signup:profile-failed', { userId: data.user.id, code: profileError.code, message: profileError.message });
      if (profileError.code === '23505') {
        return { error: 'That username is already in use.' };
      }
      console.error('Failed to create user profile:', profileError);
      return { error: 'Account created, but your profile could not be initialized. Please try signing in.' };
    }
  }

  if (!data.session) {
    return {
      success: 'Account created. Check your email to confirm your account, then sign in.',
      requiresConfirmation: true,
    };
  }

  return { success: 'Account created successfully.', redirectTo: '/profile' };
}

export async function resendConfirmation(formData) {
  const supabase = createClient();
  const email = formData.get('email')?.toString().trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

  if (!email) return { error: 'Enter your email address first.' };

  console.info('[auth] confirmation:resend-start', { email: redactEmail(email) });
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      ...(siteUrl ? { options: { emailRedirectTo: `${siteUrl}/auth/callback` } } : {}),
    });
    if (error) {
      console.warn('[auth] confirmation:resend-rejected', { code: error.code, status: error.status, message: error.message });
      return { error: error.message };
    }
    console.info('[auth] confirmation:resend-success');
    return { success: 'A new confirmation email has been sent.' };
  } catch (error) {
    console.error('[auth] confirmation:resend-failed', { name: error?.name, message: error?.message });
    return { error: 'Unable to resend the confirmation email. Please try again.' };
  }
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('[auth] logout:failed', { code: error.code, message: error.message });
  else console.info('[auth] logout:success');
  redirect('/login');
}
