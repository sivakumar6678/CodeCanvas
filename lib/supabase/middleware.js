import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isAdminIdentity, isSafeRedirectPath } from "../auth/access";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  let sessionUser = null;
  let hasAdminAccess = false;

  if (supabaseUrl && supabaseKey) {
    try {
      // 2.5-second timeout prevents request hangs if Supabase is offline or paused
      const authPromise = Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase auth timeout')), 2500)
        ),
      ]);

      const { data, error } = await authPromise;
      if (!error && data?.user) {
        sessionUser = data.user;
      }
    } catch (err) {
      // Supabase is unreachable, paused, or network request failed
      console.warn('[auth] middleware: Supabase auth check unavailable:', err?.message || err);
      sessionUser = null;
    }
  }

  const pathname = request.nextUrl.pathname;
  const isLegacyAdminPath = pathname.startsWith('/admin');
  const isStudioPath = pathname.startsWith('/studio');
  const isProtectedAdminPath = isLegacyAdminPath || isStudioPath;
  const isAuthPath = pathname.startsWith('/login');

  if (sessionUser && (isProtectedAdminPath || isAuthPath)) {
    try {
      const profilePromise = Promise.race([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase profile timeout')), 2000)
        ),
      ]);

      const { data: userProfile } = await profilePromise;
      hasAdminAccess = isAdminIdentity({ user: sessionUser, profile: userProfile });
    } catch (err) {
      console.warn('[auth] middleware: user profile lookup unavailable:', err?.message || err);
      hasAdminAccess = isAdminIdentity({ user: sessionUser, profile: null });
    }
  }

  if (isProtectedAdminPath && !sessionUser) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', isLegacyAdminPath ? '/studio' : pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedAdminPath && sessionUser && !hasAdminAccess) {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = '/forbidden';
    forbiddenUrl.search = '';
    return NextResponse.redirect(forbiddenUrl);
  }

  if (isLegacyAdminPath && sessionUser && hasAdminAccess) {
    const studioUrl = request.nextUrl.clone();
    studioUrl.pathname = pathname.replace(/^\/admin/, '/studio') || '/studio';
    return NextResponse.redirect(studioUrl);
  }

  if (isAuthPath && sessionUser) {
    const nextPath = request.nextUrl.searchParams.get('next');
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname =
      isSafeRedirectPath(nextPath) && (!nextPath.startsWith('/studio') || hasAdminAccess)
        ? nextPath
        : '/profile';
    redirectUrl.search = '';

    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
};
