import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { validateAnalyticsPayload, recordAnalyticsEvent, getAnalyticsWriteClient } from '../../../lib/analytics';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = await createClient();

    // Map legacy payload { toolId, action } to unified schema if present
    let eventType = body.event_type;
    let entityType = body.entity_type;
    let entityId = body.entity_id;
    let metadata = body.metadata || {};

    if (!eventType && body.action) {
      if (body.action === 'view') {
        eventType = 'tool_view';
        entityType = 'tool';
        entityId = body.toolId || body.slug;
      } else if (body.action === 'click') {
        eventType = 'tool_click';
        entityType = 'tool';
        entityId = body.toolId || body.slug;
      } else {
        eventType = body.action;
        entityType = 'tool';
        entityId = body.toolId || body.slug;
      }
    }

    const validation = validateAnalyticsPayload({
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Extract current user if logged in
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Anonymous user
    }

    const analyticWriteClient = getAnalyticsWriteClient(supabase);
    if (analyticWriteClient) {
      await recordAnalyticsEvent(analyticWriteClient, {
        ...validation.sanitized,
        user_id: userId,
      });

      // Dual-write to legacy tables for backwards compatibility with existing views/clicks counters
      if (eventType === 'tool_view' && entityId) {
        const userAgent = request.headers.get('user-agent') || 'unknown';
        analyticWriteClient.from('analytics_tool_views').insert({ tool_slug: entityId, user_agent: userAgent }).catch(() => {});
      } else if (eventType === 'tool_click' && entityId) {
        const userAgent = request.headers.get('user-agent') || 'unknown';
        analyticWriteClient.from('analytics_tool_clicks').insert({ tool_slug: entityId, user_agent: userAgent }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, event: validation.sanitized.event_type });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: 'Failed to record analytics event' }, { status: 500 });
  }
}
