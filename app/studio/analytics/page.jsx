import { createClient } from '../../../lib/supabase/server';
import { requireAdminAccess } from '../../../lib/auth/server';
import { getAllTools } from '../../../lib/data-fetchers';
import { computePopularCategories, computeMostSavedTools, formatRecentActivity } from '../../../lib/analytics';
import AdminAnalyticsView from '../../../components/admin/AdminAnalyticsView';
import defaultPrompts from '../../../data/default-prompts.json';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics | Studio',
};

export default async function StudioAnalyticsPage() {
  await requireAdminAccess();

  let allTools = [];
  try {
    allTools = await getAllTools();
  } catch (err) {
    console.error('Error fetching tools for analytics:', err);
  }

  let totalUsers = 0;
  let totalViews = 0;
  let totalClicks = 0;
  let totalReviews = 0;
  let totalUpvotes = 0;
  let totalSavedTools = 0;
  let totalSavedPrompts = 0;
  let totalToolSuggestions = 0;
  let totalPromptSubmissions = 0;

  let viewsData = [];
  let clicksData = [];
  let upvotesData = [];
  let savedToolsData = [];
  let analyticsEvents = [];
  let reviewsList = [];
  let suggestionsList = [];
  let promptSubmissionsList = [];

  try {
    const supabase = await createClient();

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
      reviewsListRes,
      toolSuggestionsListRes,
      promptSubmissionsListRes,
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
      supabase.from('analytics_events').select('*').order('occurred_at', { ascending: false }).limit(40),
      supabase.from('tool_reviews').select('tool_slug, rating, review_text, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('tool_suggestions').select('tool_name, category, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('prompt_submissions').select('title, type, category, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    if (usersCountRes.status === 'fulfilled' && usersCountRes.value.count !== null) {
      totalUsers = usersCountRes.value.count || 0;
    }
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
    if (savedToolsCountRes.status === 'fulfilled' && savedToolsCountRes.value.count !== null) {
      totalSavedTools = savedToolsCountRes.value.count || 0;
    }
    if (savedPromptsCountRes.status === 'fulfilled' && savedPromptsCountRes.value.count !== null) {
      totalSavedPrompts = savedPromptsCountRes.value.count || 0;
    }
    if (toolSuggestionsCountRes.status === 'fulfilled' && toolSuggestionsCountRes.value.count !== null) {
      totalToolSuggestions = toolSuggestionsCountRes.value.count || 0;
    }
    if (promptSubmissionsCountRes.status === 'fulfilled' && promptSubmissionsCountRes.value.count !== null) {
      totalPromptSubmissions = promptSubmissionsCountRes.value.count || 0;
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
    if (savedToolsListRes.status === 'fulfilled' && Array.isArray(savedToolsListRes.value.data)) {
      savedToolsData = savedToolsListRes.value.data;
    }
    if (analyticsEventsRes.status === 'fulfilled' && Array.isArray(analyticsEventsRes.value.data)) {
      analyticsEvents = analyticsEventsRes.value.data;
    }
    if (reviewsListRes.status === 'fulfilled' && Array.isArray(reviewsListRes.value.data)) {
      reviewsList = reviewsListRes.value.data;
    }
    if (toolSuggestionsListRes.status === 'fulfilled' && Array.isArray(toolSuggestionsListRes.value.data)) {
      suggestionsList = toolSuggestionsListRes.value.data;
    }
    if (promptSubmissionsListRes.status === 'fulfilled' && Array.isArray(promptSubmissionsListRes.value.data)) {
      promptSubmissionsList = promptSubmissionsListRes.value.data;
    }
  } catch (err) {
    console.error('Supabase analytics fetch error:', err);
  }

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

  // Calculate tools traffic
  const toolsTraffic = allTools
    .map((tool) => {
      const views = viewsBySlug[tool.slug] || 0;
      const clicks = clicksBySlug[tool.slug] || 0;
      const upvotes = upvotesBySlug[tool.slug] || 0;
      const saves = savesBySlug[tool.slug] || 0;
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
        saves,
      };
    })
    .sort((a, b) => b.views - a.views);

  // Overall totals
  const overallViews = totalViews || 0;
  const overallClicks = totalClicks || 0;
  const overallCtr = overallViews > 0 ? `${((overallClicks / overallViews) * 100).toFixed(1)}%` : '0.0%';
  const totalSaves = totalSavedTools + totalSavedPrompts;
  const totalContributions = totalToolSuggestions + totalPromptSubmissions;

  // Most viewed tools (top 5)
  const mostViewedTools = toolsTraffic.slice(0, 5);

  // Most saved tools (top 5)
  const mostSavedTools = computeMostSavedTools(savedToolsData, allTools).slice(0, 5);

  // Category views from analytics_events
  const categoryViewsCount = {};
  analyticsEvents.forEach((ev) => {
    if (ev.event_type === 'category_view' && ev.entity_id) {
      categoryViewsCount[ev.entity_id] = (categoryViewsCount[ev.entity_id] || 0) + 1;
    }
  });

  // Popular categories
  const popularCategories = computePopularCategories(allTools, viewsBySlug, categoryViewsCount);

  // Synthesize events for recent activity if analytics_events is small
  const combinedRawEvents = [...analyticsEvents];
  if (combinedRawEvents.length < 10) {
    reviewsList.forEach((r, idx) => {
      combinedRawEvents.push({
        id: `synth-rev-${idx}`,
        event_type: 'tool_review',
        entity_type: 'tool',
        entity_id: r.tool_slug,
        metadata: { rating: r.rating },
        occurred_at: r.created_at,
      });
    });
    suggestionsList.forEach((s, idx) => {
      combinedRawEvents.push({
        id: `synth-sug-${idx}`,
        event_type: 'contribution',
        entity_type: 'tool',
        entity_id: s.tool_name,
        metadata: { category: s.category },
        occurred_at: s.created_at,
      });
    });
    promptSubmissionsList.forEach((p, idx) => {
      combinedRawEvents.push({
        id: `synth-ps-${idx}`,
        event_type: 'contribution',
        entity_type: 'knowledge',
        entity_id: p.title,
        metadata: { type: p.type },
        occurred_at: p.created_at,
      });
    });
    savedToolsData.slice(0, 10).forEach((st, idx) => {
      combinedRawEvents.push({
        id: `synth-save-${idx}`,
        event_type: 'tool_save',
        entity_type: 'tool',
        entity_id: st.tool_slug,
        occurred_at: st.saved_at,
      });
    });
  }

  // Sort and format recent activity
  combinedRawEvents.sort((a, b) => new Date(b.occurred_at || 0) - new Date(a.occurred_at || 0));
  const recentActivity = formatRecentActivity(combinedRawEvents.slice(0, 15), allTools, defaultPrompts);

  return (
    <div className={styles.container}>
      <AdminAnalyticsView
        analyticsData={{
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
        }}
      />
    </div>
  );
}
