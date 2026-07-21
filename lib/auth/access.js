export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSafeRedirectPath(pathname) {
  return typeof pathname === 'string' && pathname.startsWith('/') && !pathname.startsWith('//');
}

export function isAdminIdentity({ user, profile }) {
  if (!user) {
    return false;
  }

  const email = user.email?.toLowerCase();
  const role =
    profile?.role ||
    user.app_metadata?.role ||
    user.user_metadata?.role ||
    null;

  return role === 'admin' || (!!email && getAdminEmails().includes(email));
}
