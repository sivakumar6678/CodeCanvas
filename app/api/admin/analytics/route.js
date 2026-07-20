import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getAllTools } from '../../../../lib/data-fetchers';

export async function GET(request) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch raw metrics from Supabase
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

    const { count: totalSavedTools } = await supabase
      .from('saved_tools')
      .select('*', { count: 'exact', head: true });

    // Fetch tool-specific views and clicks for traffic breakdown
    const { data: viewsData } = await supabase
      .from('tool_views')
      .select('tool_slug');

    const { data: clicksData } = await supabase
      .from('tool_clicks')
      .select('tool_slug');

    const { data: upvotesData } = await supabase
      .from('tool_upvotes')
      .select('tool_slug');

    // Aggregate counts by slug
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

    // Merge with all JSON tools data
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

    return NextResponse.json({
      kpis: {
        totalViews: overallViews,
        totalClicks: overallClicks,
        ctr: overallCtr,
        totalReviews: totalReviews || 0,
        totalUpvotes: totalUpvotes || 0,
        totalSavedTools: totalSavedTools || 0
      },
      toolsTraffic
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
