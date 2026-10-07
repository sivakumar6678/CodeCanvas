import { createClient } from '../../lib/supabase/server';
import PublicUsersDirectory from '../../components/user/PublicUsersDirectory';

export const metadata = {
  title: 'CodeCanvas Users',
  description: 'Explore the CodeCanvas community of builders, designers, researchers, and creators.',
};

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  let users = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('public_user_profiles')
      .select('username, avatar_url, avatar_id, created_at')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      users = data;
    }
  } catch (error) {
    console.warn('[users] Unable to load public profiles:', error?.message || error);
  }

  return <PublicUsersDirectory users={users} />;
}
