import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { slug } = await request.json();
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('analytics_tool_clicks')
      .insert([
        { tool_slug: slug, user_agent: userAgent }
      ]);

    if (error) {
      console.error('Error tracking click:', error);
      return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
