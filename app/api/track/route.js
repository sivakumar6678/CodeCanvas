import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { toolId, action } = await request.json();
    
    // In a real app, you would save this to a database like Supabase
    console.log(`Tracking tool ${toolId} action: ${action}`);
    
    return NextResponse.json({ success: true, toolId, action });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}
