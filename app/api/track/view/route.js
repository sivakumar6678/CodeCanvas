import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { isSafeAnalyticsSlug, recordAnalyticsEvent, getAnalyticsWriteClient } from '../../../../lib/analytics';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { slug } = await request.json();
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!isSafeAnalyticsSlug(slug)) {
      return NextResponse.json({ error: 'A valid tool slug is required' }, { status: 400 });
    }

    const analyticsWriteClient = getAnalyticsWriteClient(supabase);
    if (analyticsWriteClient) {
      // 1. Insert into legacy analytics_tool_views
      const { error } = await analyticsWriteClient
        .from('analytics_tool_views')
        .insert([
          { tool_slug: slug, user_agent: userAgent }
        ]);

      if (error) {
        console.warn('Error tracking view in analytics_tool_views:', error.message);
      }

      // 2. Insert into unified analytics_events
      let userId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch (_e) {
        userId = null;
      }

      await recordAnalyticsEvent(analyticsWriteClient, {
        event_type: 'tool_view',
        entity_type: 'tool',
        entity_id: slug,
        user_id: userId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
