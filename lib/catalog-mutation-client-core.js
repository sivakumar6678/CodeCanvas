export function selectCatalogMutationClient({
  user,
  isAdmin,
  profile,
  sessionClient,
  adminClient,
}) {
  if (!user || !isAdmin) return null;
  if (adminClient) return adminClient;
  if (profile?.role === 'admin') return sessionClient || null;
  return null;
}
