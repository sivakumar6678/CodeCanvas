import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getAllTools } from '../../../../lib/data-fetchers';
import { builtinTools } from '../../../../lib/toolData';

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: records, error } = await supabase
      .from('recently_viewed_tools')
      .select('tool_slug, tool_type, viewed_at')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(20);

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        console.warn('recently_viewed_tools table not found in Supabase schema cache. Returning empty array.');
        return NextResponse.json([]);
      }
      throw error;
    }

    if (!records || records.length === 0) {
      return NextResponse.json([]);
    }

    // Resolve tool metadata
    const allAiTools = await getAllTools().catch(() => []);
    const aiToolMap = new Map();
    allAiTools.forEach((t) => aiToolMap.set(t.slug, t));

    const builtinMap = new Map();
    (builtinTools || []).forEach((t) => builtinMap.set(t.id, t));

    const enriched = records.map((item) => {
      if (item.tool_type === 'builtin_tool') {
        const builtin = builtinMap.get(item.tool_slug);
        return {
          tool_slug: item.tool_slug,
          tool_type: 'builtin_tool',
          viewed_at: item.viewed_at,
          tool: builtin
            ? {
                id: builtin.id,
                slug: builtin.id,
                name: builtin.name,
                category: builtin.category || 'Built-in Tool',
                description: builtin.description,
                href: `/tool/${builtin.id}`,
                icon: builtin.icon,
                type: 'Built-in Tool',
              }
            : {
                id: item.tool_slug,
                slug: item.tool_slug,
                name: item.tool_slug,
                category: 'Developer Tool',
                description: 'Built-in developer tool',
                href: `/tool/${item.tool_slug}`,
                type: 'Built-in Tool',
              },
        };
      }

      // Default: AI Tool
      const aiTool = aiToolMap.get(item.tool_slug);
      return {
        tool_slug: item.tool_slug,
        tool_type: 'ai_tool',
        viewed_at: item.viewed_at,
        tool: aiTool
          ? {
              id: aiTool.id,
              slug: aiTool.slug,
              name: aiTool.name,
              category: aiTool.category,
              subCategory: aiTool.subCategory,
              description: aiTool.description,
              pricing: aiTool.pricing || aiTool.pricingModel,
              hasFree: aiTool.hasFree,
              logo: aiTool.logo || aiTool.logoImageUrl,
              href: `/ai-tools/tool/${aiTool.slug}`,
              type: 'AI Tool',
            }
          : {
              id: item.tool_slug,
              slug: item.tool_slug,
              name: item.tool_slug,
              category: 'AI Tool',
              description: 'AI catalog tool',
              href: `/ai-tools/tool/${item.tool_slug}`,
              type: 'AI Tool',
            },
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching recently viewed tools:', error);
    return NextResponse.json({ error: 'Failed to fetch recently viewed tools' }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Per specification: Do not track anonymous users unless already supported
      return NextResponse.json({ success: true, tracked: false, reason: 'anonymous' });
    }

    const { tool_slug, tool_type = 'ai_tool' } = await request.json().catch(() => ({}));

    if (!tool_slug || !SAFE_SLUG.test(tool_slug)) {
      return NextResponse.json({ error: 'Valid tool_slug is required' }, { status: 400 });
    }

    const validToolType = tool_type === 'builtin_tool' ? 'builtin_tool' : 'ai_tool';
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('recently_viewed_tools')
      .upsert(
        {
          user_id: user.id,
          tool_slug,
          tool_type: validToolType,
          viewed_at: now,
        },
        {
          onConflict: 'user_id, tool_slug',
        }
      );

    if (error) {
      console.warn('Unable to record recently viewed tool in Supabase:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tool_slug, viewed_at: now });
  } catch (error) {
    console.error('Error recording recently viewed tool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    let query = supabase.from('recently_viewed_tools').delete().eq('user_id', user.id);

    if (slug && SAFE_SLUG.test(slug)) {
      query = query.eq('tool_slug', slug);
    }

    const { error } = await query;

    if (error) {
      console.warn('Error clearing recently viewed history:', error.message);
      return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cleared: !slug, removedSlug: slug || null });
  } catch (error) {
    console.error('Error deleting recently viewed history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

