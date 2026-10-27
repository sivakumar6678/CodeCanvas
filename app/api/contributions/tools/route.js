import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { serializeToolSuggestion, validateToolSuggestion } from '../../../../lib/contribution-validation';
import { getToolSuggestionInsertFailure } from '../../../../lib/contribution-errors';
import { recordAnalyticsEvent } from '../../../../lib/analytics';
import {
  createToolSuggestionRequestHash,
  findToolSuggestionRequest,
  insertToolSuggestionOnce,
  ToolSuggestionIdempotencyConflict,
} from '../../../../lib/tool-suggestion-idempotency';
import { parseToolSubmissionRequest, ToolSubmissionRequestError } from '../../../../lib/tool-submission-request';

const IDEMPOTENCY_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('tool_suggestions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Unable to load suggestions' }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to submit a tool' }, { status: 401 });

  let submission;
  try {
    submission = await parseToolSubmissionRequest(request);
  } catch (error) {
    if (error instanceof ToolSubmissionRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Tool submission request could not be read', error);
    return NextResponse.json({ error: 'Unable to read the submission. Please try again.' }, { status: 400 });
  }

  const { payload, idempotencyKey } = submission;
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return NextResponse.json({ error: 'A valid submission idempotency key is required.' }, { status: 400 });
  }

  const validationError = validateToolSuggestion(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const requestHash = createToolSuggestionRequestHash(payload);

  try {
    const existing = await findToolSuggestionRequest(supabase, user.id, idempotencyKey, requestHash);
    if (existing) return NextResponse.json({ suggestion: existing }, { status: 200 });

    const stored = await insertToolSuggestionOnce(
      supabase,
      payload,
      user.id,
      idempotencyKey,
      requestHash
    );

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
      { suggestion: stored.suggestion },
      { status: stored.duplicate ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof ToolSuggestionIdempotencyConflict) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const failure = getToolSuggestionInsertFailure(error);
    console.error('Tool suggestion insert failed', {
      code: error.code || 'UNKNOWN',
      message: typeof error.message === 'string' ? error.message.slice(0, 300) : undefined,
      status: error.status,
    });
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

export async function PUT(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...payload } = await request.json().catch(() => ({}));
  const validationError = validateToolSuggestion(payload);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data, error } = await supabase
    .from('tool_suggestions')
    .update(serializeToolSuggestion(payload, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Only your pending suggestion can be edited' }, { status: 403 });
  return NextResponse.json({ suggestion: data });
}

export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  const { error } = await supabase
    .from('tool_suggestions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) return NextResponse.json({ error: 'Unable to withdraw suggestion' }, { status: 500 });
  return NextResponse.json({ success: true });
}