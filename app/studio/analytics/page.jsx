import { createClient } from '../../../lib/supabase/server';
import { getAllTools } from '../../../lib/data-fetchers';
import AdminAnalyticsView from '../../../components/admin/AdminAnalyticsView';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics | Studio',
};

export default async function StudioAnalyticsPage() {
  let allTools = [];
  try {
    allTools = await getAllTools();
  } catch (err) {
    console.error('Error fetching tools for analytics:', err);
  }

  let totalViews = 0;
  let totalClicks = 0;
  let totalReviews = 0;
  let totalUpvotes = 0;
  let totalSavedTools = 0;
  let viewsData = [];
  let clicksData = [];
  let upvotesData = [];

  try {
    const supabase = await createClient();

    const [
      viewsCountRes,
      clicksCountRes,
      reviewsCountRes,
      upvotesCountRes,
      savesCountRes,
      viewsListRes,
      clicksListRes,
      upvotesListRes
    ] = await Promise.allSettled([
      supabase.from('analytics_tool_views').select('*', { count: 'exact', head: true }),
      supabase.from('analytics_tool_clicks').select('*', { count: 'exact', head: true }),
      supabase.from('tool_reviews').select('*', { count: 'exact', head: true }),
      supabase.from('tool_upvotes').select('*', { count: 'exact', head: true }),
      supabase.from('saved_tools').select('*', { count: 'exact', head: true }),
      supabase.from('analytics_tool_views').select('tool_slug'),
      supabase.from('analytics_tool_clicks').select('tool_slug'),
      supabase.from('tool_upvotes').select('tool_slug'),
    ]);

    if (viewsCountRes.status === 'fulfilled' && viewsCountRes.value.count !== null) {
      totalViews = viewsCountRes.value.count || 0;
    }
    if (clicksCountRes.status === 'fulfilled' && clicksCountRes.value.count !== null) {
      totalClicks = clicksCountRes.value.count || 0;
    }
    if (reviewsCountRes.status === 'fulfilled' && reviewsCountRes.value.count !== null) {
      totalReviews = reviewsCountRes.value.count || 0;
    }
    if (upvotesCountRes.status === 'fulfilled' && upvotesCountRes.value.count !== null) {
      totalUpvotes = upvotesCountRes.value.count || 0;
    }
    if (savesCountRes.status === 'fulfilled' && savesCountRes.value.count !== null) {
      totalSavedTools = savesCountRes.value.count || 0;
    }

    if (viewsListRes.status === 'fulfilled' && Array.isArray(viewsListRes.value.data)) {
      viewsData = viewsListRes.value.data;
    }
    if (clicksListRes.status === 'fulfilled' && Array.isArray(clicksListRes.value.data)) {
      clicksData = clicksListRes.value.data;
    }
    if (upvotesListRes.status === 'fulfilled' && Array.isArray(upvotesListRes.value.data)) {
      upvotesData = upvotesListRes.value.data;
    }
  } catch (err) {
    console.error('Supabase analytics fetch error:', err);
  }

  const viewsBySlug = {};
  viewsData.forEach((item) => {
    if (item.tool_slug) {
      viewsBySlug[item.tool_slug] = (viewsBySlug[item.tool_slug] || 0) + 1;
    }
  });

  const clicksBySlug = {};
  clicksData.forEach((item) => {
    if (item.tool_slug) {
      clicksBySlug[item.tool_slug] = (clicksBySlug[item.tool_slug] || 0) + 1;
    }
  });

  const upvotesBySlug = {};
  upvotesData.forEach((item) => {
    if (item.tool_slug) {
      upvotesBySlug[item.tool_slug] = (upvotesBySlug[item.tool_slug] || 0) + 1;
    }
  });

  const toolsTraffic = allTools
    .map((tool) => {
      const views = viewsBySlug[tool.slug] || 0;
      const clicks = clicksBySlug[tool.slug] || 0;
      const upvotes = upvotesBySlug[tool.slug] || 0;
      const ctr = views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : '0%';

      return {
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        category: tool.category,
        views,
        clicks,
        ctr,
        ctrNum: views > 0 ? (clicks / views) * 100 : 0,
        upvotes,
      };
    })
    .sort((a, b) => b.views - a.views);

  const overallViews = totalViews || 0;
  const overallClicks = totalClicks || 0;
  const overallCtr = overallViews > 0 ? `${((overallClicks / overallViews) * 100).toFixed(1)}%` : '0.0%';

  return (
    <div className={styles.container}>
      <AdminAnalyticsView
        analyticsData={{
          kpis: {
            totalViews: overallViews,
            totalClicks: overallClicks,
            ctr: overallCtr,
            totalReviews: totalReviews || 0,
            totalUpvotes: totalUpvotes || 0,
            totalSavedTools: totalSavedTools || 0,
          },
          toolsTraffic,
        }}
      />
    </div>
  );
}
