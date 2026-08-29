import { getCurrentUserWithProfile } from '../../../lib/auth/server';
import { getCategories, getAllTools } from '../../../lib/data-fetchers';
import { getCatalogCategorySlugs, getCatalogFileForCategory } from '../../../lib/catalog-categories';
import StudioSettingsView from '../../../components/admin/StudioSettingsView';

export const metadata = { title: 'Settings & Diagnostics | Studio' };

export default async function StudioSettingsPage() {
  const auth = await getCurrentUserWithProfile();
  const categories = await getCategories();
  const allTools = await getAllTools();
  const categorySlugs = getCatalogCategorySlugs();

  const mappedFilesCount = categorySlugs.filter((slug) => Boolean(getCatalogFileForCategory(slug))).length;

  const status = {
    supabase: {
      urlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    catalog: {
      categoryCount: categories.length,
      mappedFilesCount,
      totalTools: allTools.length,
    },
    auth: {
      currentUserIsAdmin: Boolean(auth.isAdmin),
      currentUserEmail: auth.user?.email || '',
      adminCount: (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean).length || 1,
    },
    platform: {
      env: process.env.NODE_ENV || 'development',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  };

  return <StudioSettingsView status={status} />;
}

