export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

// Safe redirect paths must be relative (start with /), must not be protocol-relative (//),
// and must not contain backslashes (some browsers normalize /\example.com to //example.com).
export function isSafeRedirectPath(pathname) {
  return (
    typeof pathname === 'string' &&
    pathname.startsWith('/') &&
    !pathname.startsWith('//') &&
    !pathname.includes('\\')
  );
}

export function isAdminIdentity({ user, profile }) {
  if (!user) {
    return false;
  }

  const email = user.email?.toLowerCase();

  // Only trust role from:
  // 1. profile.role — stored in public.user_profiles (server-side, via admin-protected API only)
  // 2. user.app_metadata.role — set only by service role key, not user-settable
  // NOTE: user.user_metadata.role is intentionally excluded — it is user-settable via
  // supabase.auth.updateUser() and would allow any authenticated user to self-grant admin.
  const role =
    profile?.role ||
    user.app_metadata?.role ||
    null;

  return role === 'admin' || (!!email && getAdminEmails().includes(email));
}
