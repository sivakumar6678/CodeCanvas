import { NextResponse } from 'next/server';

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><path fill="#fff" d="M25 18 11 32l14 14 5-5-9-9 9-9-5-5Zm14 0-5 5 9 9-9 9 5 5 14-14L39 18Z"/></svg>`;

export function GET() {
  return new NextResponse(favicon, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
