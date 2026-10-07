import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import {
  validateToolSuggestion,
  validatePromptSubmission,
  serializeToolSuggestion,
  serializePromptSubmission,
} from '../../../../lib/contribution-validation';
import { recordAnalyticsEvent } from '../../../../lib/analytics';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to submit a contribution to the community catalog.' },
        { status: 401 }
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || !payload.kind) {
      return NextResponse.json({ error: 'Invalid submission data.' }, { status: 400 });
    }

    if (payload.kind === 'tool') {
      const toolPayload = {
        tool_name: (payload.tool_name || '').trim(),
        website_url: (payload.website_url || payload.website || '').trim(),
        category: (payload.category || '').trim(),
        subcategory: (payload.subcategory || payload.subCategory || '').trim(),
        description: (payload.description || '').trim(),
        pricing: payload.pricing || payload.pricingModel || 'Free',
        tags: Array.isArray(payload.tags) ? payload.tags : (payload.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        recommendation_reason: (payload.recommendation_reason || payload.description || 'Community recommended tool').trim(),
        display_name: (payload.display_name || user.email?.split('@')[0] || 'Community Contributor').trim(),
        is_anonymous: Boolean(payload.is_anonymous),
      };

      const validationError = validateToolSuggestion(toolPayload);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const serialized = serializeToolSuggestion(toolPayload, user.id);
      const { data, error } = await supabase.from('tool_suggestions').insert(serialized).select().single();
      if (error) {
        console.error('Tool submission error:', error);
        return NextResponse.json({ error: 'Unable to submit tool suggestion. Please try again.' }, { status: 500 });
      }

      recordAnalyticsEvent(supabase, {
        event_type: 'contribution',
        entity_type: 'tool',
        entity_id: data.tool_name,
        metadata: { category: data.category },
        user_id: user.id,
      }).catch(() => {});

      return NextResponse.json({ success: true, submission: data, message: 'Tool submitted for review!' });
    }

    if (payload.kind === 'prompt') {
      const promptPayload = {
        title: (payload.title || '').trim(),
        prompt_content: (payload.prompt_content || '').trim(),
        ai_model: (payload.ai_model || 'Claude 3.5 Sonnet').trim(),
        category: (payload.category || 'General').trim(),
        type: (payload.type || 'prompt').trim(),
        use_case: (payload.use_case || payload.description || payload.title || 'General Purpose').trim(),
        description: (payload.description || '').trim(),
        display_name: (payload.display_name || user.email?.split('@')[0] || 'Community Contributor').trim(),
        is_anonymous: Boolean(payload.is_anonymous),
        tags: Array.isArray(payload.tags) ? payload.tags : (payload.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      };

      const validationError = validatePromptSubmission(promptPayload);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const serialized = serializePromptSubmission(promptPayload, user.id);
      const { data, error } = await supabase.from('prompt_submissions').insert(serialized).select().single();
      if (error) {
        console.error('Prompt submission error:', error);
        return NextResponse.json({ error: 'Unable to submit prompt. Please try again.' }, { status: 500 });
      }

      recordAnalyticsEvent(supabase, {
        event_type: 'contribution',
        entity_type: 'knowledge',
        entity_id: data.title,
        metadata: { category: data.category, type: data.type },
        user_id: user.id,
      }).catch(() => {});

      return NextResponse.json({ success: true, submission: data, message: 'Prompt submitted for review!' });
    }

    return NextResponse.json({ error: 'Unsupported submission kind.' }, { status: 400 });
  } catch (err) {
    console.error('Submission route exception:', err);
    return NextResponse.json({ error: 'Server error processing submission.' }, { status: 500 });
  }
}

