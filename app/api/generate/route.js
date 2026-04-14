import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const REQUEST_TIMEOUT_MS = 15000;

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
    const { prompt, config } = await request.json();

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
          contents: [{ parts: [{ text: prompt }] }],
          ...config,
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
