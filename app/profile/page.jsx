import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileDashboard from '../../components/user/ProfileDashboard';
import styles from './page.module.scss';

export const metadata = {
  title: 'My Profile & Activity Dashboard',
};

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch initial profile & stats
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const { count: bookmarksCount } = await supabase
    .from('saved_tools')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: reviewsCount } = await supabase
    .from('tool_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: upvotesCount } = await supabase
    .from('tool_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const initialData = {
    user: {
      id: user.id,
      email: user.email,
      username: profile?.username || user.email?.split('@')[0] || 'User',
      avatar_url: profile?.avatar_url || '',
      bio: profile?.bio || '',
      created_at: profile?.created_at || user.created_at
    },
    stats: {
      bookmarksCount: bookmarksCount || 0,
      reviewsCount: reviewsCount || 0,
      upvotesCount: upvotesCount || 0
    }
  };

  return (
    <div className={styles.container}>
      <ProfileDashboard initialData={initialData} />
    </div>
  );
}
