import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isAdminIdentity, isSafeRedirectPath } from "../auth/access";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLegacyAdminPath = pathname.startsWith('/admin');
  const isStudioPath = pathname.startsWith('/studio');
  const isProtectedAdminPath = isLegacyAdminPath || isStudioPath;
  const isAuthPath = pathname.startsWith('/login');
  let isAdmin = false;

  if (user && (isProtectedAdminPath || isAuthPath)) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    isAdmin = isAdminIdentity({ user, profile });
  }

  if (isProtectedAdminPath && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', isLegacyAdminPath ? '/studio' : pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedAdminPath && user && !isAdmin) {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = '/forbidden';
    forbiddenUrl.search = '';
    return NextResponse.redirect(forbiddenUrl);
  }

  if (isLegacyAdminPath && user && isAdmin) {
    const studioUrl = request.nextUrl.clone();
    studioUrl.pathname = pathname.replace('/admin', '/studio') || '/studio';
    return NextResponse.redirect(studioUrl);
  }

  if (isAuthPath && user) {
    const nextPath = request.nextUrl.searchParams.get('next');
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname =
      isSafeRedirectPath(nextPath) && (!nextPath.startsWith('/studio') || isAdmin)
        ? nextPath
        : '/profile';
    redirectUrl.search = '';

    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
};
