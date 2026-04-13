import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  try {
    const { prompt, config } = await request.json();

    if (!API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        ...config
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'AI service error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
