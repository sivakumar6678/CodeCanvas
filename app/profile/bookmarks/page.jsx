import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllTools } from '../../../lib/data-fetchers';
import AIToolCard from '../../../components/ai-tools/AIToolCard';
import styles from './page.module.scss';

export const metadata = {
  title: 'My Saved Tools | CodeCraft',
  description: 'View and manage your saved AI productivity tools.',
};

export default async function BookmarksPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let bookmarkedSlugs = [];
  try {
    const { data: bookmarks, error } = await supabase
      .from('saved_tools')
      .select('tool_slug')
      .eq('user_id', user.id);

    if (!error && bookmarks) {
      bookmarkedSlugs = bookmarks.map(b => b.tool_slug);
    }
  } catch (err) {
    console.error('Error loading bookmarks:', err);
  }
  
  // Fetch full tool data
  const allTools = await getAllTools();
  const savedToolsData = allTools.filter(tool => bookmarkedSlugs.includes(tool.slug));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Saved Tools</h1>
        <p>Your personalized stack of saved AI developer tools ({savedToolsData.length})</p>
      </div>

      {savedToolsData.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't saved any AI tools yet.</p>
          <Link href="/ai-tools" className={styles.exploreBtn}>
            Explore AI Tools Directory
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {savedToolsData.map(tool => (
            <AIToolCard key={tool.id || tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
