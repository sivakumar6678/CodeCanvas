import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import {
  validateToolSuggestion,
  validatePromptSubmission,
  serializePromptSubmission,
} from '../../../../lib/contribution-validation';
import { recordAnalyticsEvent } from '../../../../lib/analytics';
import {
  createToolSuggestionRequestHash,
  insertToolSuggestionOnce,
  ToolSuggestionIdempotencyConflict,
} from '../../../../lib/tool-suggestion-idempotency';

const IDEMPOTENCY_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        ...payload,
        display_name: typeof payload.display_name === 'string' && payload.display_name.trim()
          ? payload.display_name.trim()
          : user.email?.split('@')[0] || 'Community Contributor',
        is_anonymous: payload.is_anonymous === true,
      };

      const validationError = validateToolSuggestion(toolPayload);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const idempotencyKey = payload.idempotencyKey || payload.idempotency_key;
      if (typeof idempotencyKey !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
        return NextResponse.json({ error: 'A valid submission idempotency key is required.' }, { status: 400 });
      }

      const requestHash = createToolSuggestionRequestHash(toolPayload);
      let stored;
      try {
        stored = await insertToolSuggestionOnce(supabase, toolPayload, user.id, idempotencyKey, requestHash);
      } catch (error) {
        if (error instanceof ToolSuggestionIdempotencyConflict) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('Tool submission error:', {
          code: error.code || 'UNKNOWN',
          message: typeof error.message === 'string' ? error.message.slice(0, 300) : undefined,
        });
        return NextResponse.json({ error: 'Unable to submit tool suggestion. Please try again.' }, { status: 500 });
      }

      if (!stored.duplicate) {
        recordAnalyticsEvent(supabase, {
          event_type: 'contribution',
          entity_type: 'tool',
          entity_id: stored.suggestion.tool_name,
          metadata: { category: stored.suggestion.category },
          user_id: user.id,
        }).catch(() => {});
      }

      return NextResponse.json(
        { success: true, submission: stored.suggestion, message: 'Tool submitted for review!' },
        { status: stored.duplicate ? 200 : 201 }
      );
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
