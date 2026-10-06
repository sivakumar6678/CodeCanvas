import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_PROMPT_LENGTH = 12000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestBuckets = new Map();

// Map Gemini API error codes to user-readable messages
const GEMINI_ERROR_MESSAGES = {
  400: 'Invalid request — please check your input.',
  401: 'API authentication failed.',
  403: 'Access denied — check your API key permissions.',
  429: 'Rate limit reached. Please wait a moment and try again.',
  500: 'AI service internal error. Please try again.',
  503: 'AI service is temporarily overloaded. Please try again in a moment.',
};

export async function POST(request) {
  try {
    const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const now = Date.now();
    const bucket = (requestBuckets.get(clientId) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (bucket.length >= RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many AI requests. Please wait a minute and try again.', retryable: true }, { status: 429 });
    }
    bucket.push(now);
    requestBuckets.set(clientId, bucket);

    const { prompt } = await request.json().catch(() => ({}));
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'A prompt is required.', retryable: false }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: 'Prompt is too long.', retryable: false }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.', retryable: false },
        { status: 500 }
      );
    }

    // Abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let geminiResponse;
    try {
      geminiResponse = await fetch(`${BASE_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.trim() }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      const status = geminiResponse.status;
      const message =
        GEMINI_ERROR_MESSAGES[status] ||
        errorData?.error?.message ||
        'AI service error. Please try again.';

      return NextResponse.json(
        {
          error: message,
          code: status,
          retryable: [429, 500, 503].includes(status),
        },
        { status }
      );
    }

    const data = await geminiResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.', retryable: true },
        { status: 408 }
      );
    }

    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.', retryable: true },
      { status: 500 }
    );
  }
}
