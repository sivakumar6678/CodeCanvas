import { createClient } from '../../../lib/supabase/server';
import { getAllTools } from '../../../lib/data-fetchers';
import { redirect } from 'next/navigation';
import AdminAnalyticsView from '../../../components/admin/AdminAnalyticsView';
import styles from './page.module.scss';

export const metadata = {
  title: 'Admin Analytics Dashboard',
};

export default async function AdminAnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Aggregate metrics server-side
  const { count: totalViews } = await supabase
    .from('tool_views')
    .select('*', { count: 'exact', head: true });

  const { count: totalClicks } = await supabase
    .from('tool_clicks')
    .select('*', { count: 'exact', head: true });

  const { count: totalReviews } = await supabase
    .from('tool_reviews')
    .select('*', { count: 'exact', head: true });

  const { count: totalUpvotes } = await supabase
    .from('tool_upvotes')
    .select('*', { count: 'exact', head: true });

  const { count: totalCollections } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true });

  const { data: viewsData } = await supabase.from('tool_views').select('tool_slug');
  const { data: clicksData } = await supabase.from('tool_clicks').select('tool_slug');
  const { data: upvotesData } = await supabase.from('tool_upvotes').select('tool_slug');

  const viewsBySlug = {};
  (viewsData || []).forEach(item => {
    viewsBySlug[item.tool_slug] = (viewsBySlug[item.tool_slug] || 0) + 1;
  });

  const clicksBySlug = {};
  (clicksData || []).forEach(item => {
    clicksBySlug[item.tool_slug] = (clicksBySlug[item.tool_slug] || 0) + 1;
  });

  const upvotesBySlug = {};
  (upvotesData || []).forEach(item => {
    upvotesBySlug[item.tool_slug] = (upvotesBySlug[item.tool_slug] || 0) + 1;
  });

  const allTools = await getAllTools();
  const toolsTraffic = allTools.map(tool => {
    const views = viewsBySlug[tool.slug] || 0;
    const clicks = clicksBySlug[tool.slug] || 0;
    const upvotes = upvotesBySlug[tool.slug] || 0;
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0%';

    return {
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      category: tool.category,
      views,
      clicks,
      ctr,
      upvotes
    };
  }).sort((a, b) => b.views - a.views);

  const overallViews = totalViews || 0;
  const overallClicks = totalClicks || 0;
  const overallCtr = overallViews > 0 ? ((overallClicks / overallViews) * 100).toFixed(1) + '%' : '0.0%';

  const analyticsData = {
    kpis: {
      totalViews: overallViews,
      totalClicks: overallClicks,
      ctr: overallCtr,
      totalReviews: totalReviews || 0,
      totalUpvotes: totalUpvotes || 0,
      totalCollections: totalCollections || 0
    },
    toolsTraffic
  };

  return (
    <div className={styles.container}>
      <AdminAnalyticsView analyticsData={analyticsData} />
    </div>
  );
}
