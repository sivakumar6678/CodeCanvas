import { NextResponse } from 'next/server';

// Simple contact form handler
// In production, you may want to integrate with email service like SendGrid, Resend, or similar

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    // Validate input
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 });
    }

    if (message.trim().length > 5000) {
      return NextResponse.json({ error: 'Message must not exceed 5000 characters' }, { status: 400 });
    }

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, log to console (in production, send email)
    console.log('[contact] Submission received:', {
      name: name.trim(),
      email: email.trim(),
      timestamp: new Date().toISOString(),
    });

    // Return success response
    return NextResponse.json(
      { success: true, message: 'Thank you for your message. We will get back to you soon.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[contact] Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}
