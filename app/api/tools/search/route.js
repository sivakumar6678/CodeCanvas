import { NextResponse } from 'next/server';
import { getAllTools, getCategories } from '../../../../lib/data-fetchers';

const WORKSPACE_TOOLS = [
  { id: 'ws-palette', name: 'Color Palette Generator', type: 'workspace_tool', category: 'Built-in Tool', description: 'AI-assisted color palette generator with hex/rgb export', href: '/tools' },
  { id: 'ws-gradient', name: 'Gradient Generator', type: 'workspace_tool', category: 'Built-in Tool', description: 'CSS linear & radial gradient creator with live CSS copy', href: '/tools' },
  { id: 'ws-shadow', name: 'Box Shadow Generator', type: 'workspace_tool', category: 'Built-in Tool', description: 'Interactive CSS box-shadow visualizer with AI presets', href: '/tools' },
  { id: 'ws-prompts', name: 'AI Prompts & Tricks Library', type: 'workspace_tool', category: 'Community', description: 'Curated library of high-impact AI prompts and slash commands', href: '/ai-prompts-tricks' },
  { id: 'ws-compare', name: 'Side-by-Side Tool Comparison', type: 'workspace_tool', category: 'Catalog', description: 'Compare features, pricing, and pros/cons across up to 4 tools', href: '/ai-tools/compare' },
  { id: 'ws-toolkit', name: 'Rule-Based Toolkit Builder', type: 'workspace_tool', category: 'Discovery', description: 'Custom developer stack recommendations based on your goals', href: '/build-toolkit' },
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').toLowerCase().trim();

  try {
    const [tools, categories] = await Promise.all([
      getAllTools(),
      getCategories(),
    ]);

    if (!query) {
      // Default suggestions when palette is opened empty
      const defaultTools = tools.slice(0, 5).map((t) => ({ ...t, type: 'tool', href: `/ai-tools/tool/${t.slug}` }));
      const defaultWorkspace = WORKSPACE_TOOLS.slice(0, 3);
      return NextResponse.json([...defaultTools, ...defaultWorkspace]);
    }

    // 1. Matched tools
    const matchedTools = tools
      .filter((tool) =>
        (tool.name || '').toLowerCase().includes(query) ||
        (tool.description || '').toLowerCase().includes(query) ||
        (tool.category || '').toLowerCase().includes(query) ||
        tool.tags?.some((tag) => (tag || '').toLowerCase().includes(query))
      )
      .slice(0, 6)
      .map((t) => ({ ...t, type: 'tool', href: `/ai-tools/tool/${t.slug}` }));

    // 2. Matched categories
    const matchedCategories = categories
      .filter((cat) =>
        (cat.name || '').toLowerCase().includes(query) ||
        (cat.description || '').toLowerCase().includes(query)
      )
      .slice(0, 3)
      .map((c) => ({
        id: `cat-${c.slug}`,
        name: `${c.name} Tools`,
        type: 'category',
        category: 'Taxonomy',
        description: c.description || `Browse ${c.name} AI tools`,
        href: `/ai-tools/${c.slug}`,
      }));

    // 3. Matched workspace tools
    const matchedWorkspace = WORKSPACE_TOOLS.filter((ws) =>
      ws.name.toLowerCase().includes(query) ||
      ws.description.toLowerCase().includes(query) ||
      ws.category.toLowerCase().includes(query)
    ).slice(0, 3);

    const combined = [...matchedTools, ...matchedCategories, ...matchedWorkspace].slice(0, 10);
    return NextResponse.json(combined);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json([]);
  }
}
