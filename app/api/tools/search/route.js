import { NextResponse } from 'next/server';
import { getAllTools } from '../../../../lib/data-fetchers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  try {
    const tools = await getAllTools();

    if (!query) {
      return NextResponse.json(tools.slice(0, 8)); // Return top 8 tools as default recommendations
    }

    const filtered = tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(query))
    );

    return NextResponse.json(filtered.slice(0, 10));
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json([]);
  }
}
