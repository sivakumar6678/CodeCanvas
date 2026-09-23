import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getAllTools } from '../../../../lib/data-fetchers';
import { getCurrentUserWithProfile } from '../../../../lib/auth/server';
import { computePopularCategories, computeMostSavedTools, formatRecentActivity } from '../../../../lib/analytics';
import defaultPrompts from '../../../../data/default-prompts.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { supabase, user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch raw metrics from Supabase
    const [
      usersCountRes,
      viewsCountRes,
      clicksCountRes,
      reviewsCountRes,
      upvotesCountRes,
      savedToolsCountRes,
      savedPromptsCountRes,
      toolSuggestionsCountRes,
      promptSubmissionsCountRes,
      viewsListRes,
      clicksListRes,
      upvotesListRes,
      savedToolsListRes,
      analyticsEventsRes,
    ] = await Promise.allSettled([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('analytics_tool_views').select('*', { count: 'exact', head: true }),
      supabase.from('analytics_tool_clicks').select('*', { count: 'exact', head: true }),
      supabase.from('tool_reviews').select('*', { count: 'exact', head: true }),
      supabase.from('tool_upvotes').select('*', { count: 'exact', head: true }),
      supabase.from('saved_tools').select('*', { count: 'exact', head: true }),
      supabase.from('saved_prompts').select('*', { count: 'exact', head: true }),
      supabase.from('tool_suggestions').select('*', { count: 'exact', head: true }),
      supabase.from('prompt_submissions').select('*', { count: 'exact', head: true }),
      supabase.from('analytics_tool_views').select('tool_slug').limit(10000),
      supabase.from('analytics_tool_clicks').select('tool_slug').limit(10000),
      supabase.from('tool_upvotes').select('tool_slug').limit(10000),
      supabase.from('saved_tools').select('tool_slug, saved_at').limit(10000),
      supabase.from('analytics_events').select('*').order('occurred_at', { ascending: false }).limit(30),
    ]);

    const totalUsers = usersCountRes.status === 'fulfilled' ? usersCountRes.value.count || 0 : 0;
    const totalViews = viewsCountRes.status === 'fulfilled' ? viewsCountRes.value.count || 0 : 0;
    const totalClicks = clicksCountRes.status === 'fulfilled' ? clicksCountRes.value.count || 0 : 0;
    const totalReviews = reviewsCountRes.status === 'fulfilled' ? reviewsCountRes.value.count || 0 : 0;
    const totalUpvotes = upvotesCountRes.status === 'fulfilled' ? upvotesCountRes.value.count || 0 : 0;
    const totalSavedTools = savedToolsCountRes.status === 'fulfilled' ? savedToolsCountRes.value.count || 0 : 0;
    const totalSavedPrompts = savedPromptsCountRes.status === 'fulfilled' ? savedPromptsCountRes.value.count || 0 : 0;
    const totalToolSuggestions = toolSuggestionsCountRes.status === 'fulfilled' ? toolSuggestionsCountRes.value.count || 0 : 0;
    const totalPromptSubmissions = promptSubmissionsCountRes.status === 'fulfilled' ? promptSubmissionsCountRes.value.count || 0 : 0;

    const viewsData = viewsListRes.status === 'fulfilled' ? viewsListRes.value.data || [] : [];
    const clicksData = clicksListRes.status === 'fulfilled' ? clicksListRes.value.data || [] : [];
    const upvotesData = upvotesListRes.status === 'fulfilled' ? upvotesListRes.value.data || [] : [];
    const savedToolsData = savedToolsListRes.status === 'fulfilled' ? savedToolsListRes.value.data || [] : [];
    const analyticsEvents = analyticsEventsRes.status === 'fulfilled' ? analyticsEventsRes.value.data || [] : [];

    // Aggregate counts by slug
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

    const savesBySlug = {};
    savedToolsData.forEach((item) => {
      if (item.tool_slug) {
        savesBySlug[item.tool_slug] = (savesBySlug[item.tool_slug] || 0) + 1;
      }
    });

    // Merge with all JSON tools data
    const allTools = await getAllTools();
    const toolsTraffic = allTools
      .map((tool) => {
        const views = viewsBySlug[tool.slug] || 0;
        const clicks = clicksBySlug[tool.slug] || 0;
        const upvotes = upvotesBySlug[tool.slug] || 0;
        const saves = savesBySlug[tool.slug] || 0;
        const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0%';

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
          saves,
        };
      })
      .sort((a, b) => b.views - a.views);

    const overallViews = totalViews || 0;
    const overallClicks = totalClicks || 0;
    const overallCtr = overallViews > 0 ? ((overallClicks / overallViews) * 100).toFixed(1) + '%' : '0.0%';
    const totalSaves = totalSavedTools + totalSavedPrompts;
    const totalContributions = totalToolSuggestions + totalPromptSubmissions;

    const mostViewedTools = toolsTraffic.slice(0, 5);
    const mostSavedTools = computeMostSavedTools(savedToolsData, allTools).slice(0, 5);

    const categoryViewsCount = {};
    analyticsEvents.forEach((ev) => {
      if (ev.event_type === 'category_view' && ev.entity_id) {
        categoryViewsCount[ev.entity_id] = (categoryViewsCount[ev.entity_id] || 0) + 1;
      }
    });
    const popularCategories = computePopularCategories(allTools, viewsBySlug, categoryViewsCount);
    const recentActivity = formatRecentActivity(analyticsEvents, allTools, defaultPrompts);

    return NextResponse.json({
      kpis: {
        totalUsers,
        totalViews: overallViews,
        totalClicks: overallClicks,
        ctr: overallCtr,
        totalReviews: totalReviews || 0,
        totalUpvotes: totalUpvotes || 0,
        totalSavedTools: totalSavedTools || 0,
        totalSavedPrompts: totalSavedPrompts || 0,
        totalSaves,
        totalContributions,
      },
      mostViewedTools,
      mostSavedTools,
      popularCategories,
      recentActivity,
      toolsTraffic,
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
