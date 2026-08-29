import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileDashboard from '../../components/user/ProfileDashboard';
import { getAllTools } from '../../lib/data-fetchers';
import styles from './page.module.scss';

export const metadata = {
  title: 'My Profile & Activity Dashboard',
};

export default async function ProfilePage() {
  const supabase = await createClient();
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

  const [{ count: bookmarksCount }, { data: savedRows }] = await Promise.all([
    supabase.from('saved_tools').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('saved_tools').select('tool_slug').eq('user_id', user.id).order('saved_at', { ascending: false }),
  ]);

  const allTools = await getAllTools();
  const savedToolsBySlug = new Map(allTools.map((tool) => [tool.slug, tool]));
  const savedTools = (savedRows || []).map(({ tool_slug }) => savedToolsBySlug.get(tool_slug)).filter(Boolean);

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
    },
    savedTools,
  };

  return (
    <div className={styles.container}>
      <ProfileDashboard initialData={initialData} />
    </div>
  );
}
