import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { isSafeRedirectPath } from '../../../lib/auth/access';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const redirectPath = isSafeRedirectPath(next) ? next : '/profile';

  if (!code) {
    console.warn('[auth] callback:missing-code');
    return NextResponse.redirect(new URL('/login?error=missing_confirmation_code', requestUrl.origin));
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth] callback:exchange-failed', { code: error.code, message: error.message });
      return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin));
    }

    console.info('[auth] callback:success', { redirectPath });
    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  } catch (error) {
    console.error('[auth] callback:request-failed', { name: error?.name, message: error?.message });
    return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin));
  }
}
