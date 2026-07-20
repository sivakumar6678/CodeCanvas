import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getAllTools, getCategories } from '../../../../lib/data-fetchers';

const DATA_DIR = path.join(process.cwd(), 'data');
const AI_TOOLS_DIR = path.join(DATA_DIR, 'ai-tools');

export async function GET() {
  try {
    const allTools = await getAllTools();
    return NextResponse.json(allTools);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newTool = await request.json();
    
    // Auto-generate some fields if missing
    newTool.id = newTool.id || `tool-${Date.now()}`;
    newTool.createdDate = newTool.createdDate || new Date().toISOString();
    
    const categorySlug = newTool.category;
    if (!categorySlug) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const categoryFilePath = path.join(AI_TOOLS_DIR, `${categorySlug}.json`);
    
    let categoryTools = [];
    try {
      const fileContents = await fs.readFile(categoryFilePath, 'utf8');
      categoryTools = JSON.parse(fileContents);
    } catch (e) {
      // File doesn't exist yet, we'll create it
    }

    categoryTools.push(newTool);
    await fs.writeFile(categoryFilePath, JSON.stringify(categoryTools, null, 2), 'utf8');

    return NextResponse.json({ success: true, tool: newTool });
  } catch (error) {
    console.error('Failed to create tool:', error);
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updatedTool = await request.json();
    const oldSlug = request.nextUrl.searchParams.get('oldSlug');
    const oldCategory = request.nextUrl.searchParams.get('oldCategory');

    if (!oldSlug || !oldCategory || !updatedTool.category) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // If category changed, we need to remove from old file and add to new file
    if (oldCategory !== updatedTool.category) {
      // Remove from old
      const oldFilePath = path.join(AI_TOOLS_DIR, `${oldCategory}.json`);
      let oldTools = JSON.parse(await fs.readFile(oldFilePath, 'utf8'));
      oldTools = oldTools.filter(t => t.slug !== oldSlug);
      await fs.writeFile(oldFilePath, JSON.stringify(oldTools, null, 2), 'utf8');

      // Add to new
      const newFilePath = path.join(AI_TOOLS_DIR, `${updatedTool.category}.json`);
      let newTools = [];
      try {
        newTools = JSON.parse(await fs.readFile(newFilePath, 'utf8'));
      } catch(e) {}
      newTools.push(updatedTool);
      await fs.writeFile(newFilePath, JSON.stringify(newTools, null, 2), 'utf8');
    } else {
      // Just update in existing file
      const filePath = path.join(AI_TOOLS_DIR, `${updatedTool.category}.json`);
      let tools = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const index = tools.findIndex(t => t.slug === oldSlug);
      if (index !== -1) {
        tools[index] = updatedTool;
      }
      await fs.writeFile(filePath, JSON.stringify(tools, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true, tool: updatedTool });
  } catch (error) {
    console.error('Failed to update tool:', error);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    const category = request.nextUrl.searchParams.get('category');

    if (!slug || !category) {
      return NextResponse.json({ error: 'Missing slug or category' }, { status: 400 });
    }

    const filePath = path.join(AI_TOOLS_DIR, `${category}.json`);
    let tools = JSON.parse(await fs.readFile(filePath, 'utf8'));
    tools = tools.filter(t => t.slug !== slug);
    await fs.writeFile(filePath, JSON.stringify(tools, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tool:', error);
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}
