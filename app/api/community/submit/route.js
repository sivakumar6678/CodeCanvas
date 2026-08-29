import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { validateToolSuggestion, validatePromptSubmission } from '../../../../lib/contribution-validation';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = await request.json().catch(() => null);
    if (!payload || !payload.kind) {
      return NextResponse.json({ error: 'Invalid submission data.' }, { status: 400 });
    }

    if (payload.kind === 'tool') {
      const toolData = {
        tool_name: (payload.tool_name || '').trim(),
        website: (payload.website || '').trim(),
        category: (payload.category || '').trim(),
        description: (payload.description || '').trim(),
        pricing: payload.pricing || payload.pricingModel || 'Free',
        tags: Array.isArray(payload.tags) ? payload.tags : (payload.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        status: 'pending',
        suggested_by_user_id: user?.id || null,
        suggested_by_email: user?.email || (payload.submitter_email || '').trim(),
        created_at: new Date().toISOString(),
      };

      const validationError = validateToolSuggestion(toolData);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const { data, error } = await supabase.from('tool_suggestions').insert(toolData).select().single();
      if (error) {
        console.error('Tool submission error:', error);
        return NextResponse.json({ error: 'Unable to submit tool suggestion. Please try again.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, submission: data, message: 'Tool submitted for review!' });
    }

    if (payload.kind === 'prompt') {
      const promptData = {
        title: (payload.title || '').trim(),
        prompt_content: (payload.prompt_content || '').trim(),
        ai_model: (payload.ai_model || 'Claude 3.5 Sonnet').trim(),
        category: (payload.category || 'General').trim(),
        type: (payload.type || 'prompt').trim(),
        description: (payload.description || '').trim(),
        display_name: (payload.display_name || user?.email?.split('@')[0] || 'Community Developer').trim(),
        is_anonymous: Boolean(payload.is_anonymous),
        status: 'pending',
        user_id: user?.id || null,
        created_at: new Date().toISOString(),
      };

      const validationError = validatePromptSubmission(promptData);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const { data, error } = await supabase.from('prompt_submissions').insert(promptData).select().single();
      if (error) {
        console.error('Prompt submission error:', error);
        return NextResponse.json({ error: 'Unable to submit prompt. Please try again.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, submission: data, message: 'Prompt submitted for review!' });
    }

    return NextResponse.json({ error: 'Unsupported submission kind.' }, { status: 400 });
  } catch (err) {
    console.error('Submission route exception:', err);
    return NextResponse.json({ error: 'Server error processing submission.' }, { status: 500 });
  }
}

