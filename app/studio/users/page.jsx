import { createAdminClient } from '../../../lib/supabase/admin';
import { getCurrentUserWithProfile } from '../../../lib/auth/server';
import StudioUsersView from '../../../components/admin/StudioUsersView';

export const metadata = { title: 'Users Directory | Studio' };

export default async function StudioUsersPage() {
  const auth = await getCurrentUserWithProfile();
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  let users = [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      users = data.map((profile) => ({
        ...profile,
        isAdmin: adminEmails.includes((profile.email || '').toLowerCase()) || (auth.isAdmin && auth.user?.id === profile.id),
      }));
    }
  } catch (err) {
    console.error('Error loading users for Studio:', err);
  }

  // If no profiles loaded but current user is admin, provide self entry
  if (users.length === 0 && auth.user) {
    users = [
      {
        id: auth.user.id,
        username: auth.profile?.username || 'admin',
        full_name: auth.profile?.full_name || 'Admin User',
        avatar_url: auth.profile?.avatar_url || '',
        isAdmin: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  return <StudioUsersView users={users} />;
}

