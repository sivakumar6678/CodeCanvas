import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserWithProfile } from '../../../../lib/auth/server';
import { normalizeKnowledgeItem, validateKnowledgeItem } from '../../../../lib/knowledge-schema';
import { createClient } from '../../../../lib/supabase/server';
import { deleteKnowledgeItem, persistenceConfigured, readPersistedKnowledge, upsertKnowledgeItems } from '../../../../lib/catalog-persistence';

const PROMPTS_FILE = path.join(process.cwd(), 'data', 'default-prompts.json');

async function readPromptsFile() {
  try {
    const raw = await fs.readFile(PROMPTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to read prompts file:', error);
    }
    return [];
  }
}

async function writePromptsFile(prompts) {
  const temporaryPath = `${PROMPTS_FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, JSON.stringify(prompts, null, 2), 'utf8');
  await fs.rename(temporaryPath, PROMPTS_FILE);
}

export async function GET(request) {
  try {
    const { user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const items = persistenceConfigured() ? await readPersistedKnowledge(await createClient(), { includeDrafts: true }) : await readPromptsFile();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Admin GET knowledge error:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge items' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const normalized = normalizeKnowledgeItem(body);
    const validationError = validateKnowledgeItem(normalized);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const items = persistenceConfigured() ? await readPersistedKnowledge(await createClient(), { includeDrafts: true }) : await readPromptsFile();
    const existingIndex = items.findIndex((i) => i.id === normalized.id);
    if (existingIndex !== -1) {
      // Append random suffix if ID collision
      normalized.id = `${normalized.id}-${Math.floor(Math.random() * 1000)}`;
    }

    if (persistenceConfigured()) {
      await upsertKnowledgeItems(await createClient(), [normalized]);
      return NextResponse.json({ success: true, item: normalized }, { status: 201 });
    }
    items.unshift(normalized);
    await writePromptsFile(items);

    return NextResponse.json({ success: true, item: normalized }, { status: 201 });
  } catch (error) {
    console.error('Admin POST knowledge error:', error);
    return NextResponse.json({ error: 'Failed to create knowledge item' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const normalized = normalizeKnowledgeItem(body);
    const validationError = validateKnowledgeItem(normalized);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const items = persistenceConfigured() ? await readPersistedKnowledge(await createClient(), { includeDrafts: true }) : await readPromptsFile();
    const targetId = body.originalId || normalized.id;
    const index = items.findIndex((i) => i.id === targetId);

    if (index === -1) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (persistenceConfigured()) {
      if (targetId !== normalized.id) await deleteKnowledgeItem(await createClient(), targetId);
      await upsertKnowledgeItems(await createClient(), [normalized]);
      return NextResponse.json({ success: true, item: normalized });
    }
    items[index] = normalized;
    await writePromptsFile(items);

    return NextResponse.json({ success: true, item: normalized });
  } catch (error) {
    console.error('Admin PUT knowledge error:', error);
    return NextResponse.json({ error: 'Failed to update knowledge item' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    let items = persistenceConfigured() ? await readPersistedKnowledge(await createClient(), { includeDrafts: true }) : await readPromptsFile();
    const initialLen = items.length;
    items = items.filter((i) => String(i.id) !== String(id));

    if (items.length === initialLen) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (persistenceConfigured()) {
      await deleteKnowledgeItem(await createClient(), id);
      return NextResponse.json({ success: true, deletedId: id });
    }
    await writePromptsFile(items);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Admin DELETE knowledge error:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge item' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { user, isAdmin } = await getCurrentUserWithProfile();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { id, action, status } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const items = persistenceConfigured() ? await readPersistedKnowledge(await createClient(), { includeDrafts: true }) : await readPromptsFile();
    const index = items.findIndex((i) => String(i.id) === String(id));
    if (index === -1) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (action === 'toggle-status') {
      const current = items[index].status || 'published';
      items[index].status = current === 'published' ? 'draft' : 'published';
    } else if (status) {
      items[index].status = status === 'draft' ? 'draft' : 'published';
    } else {
      return NextResponse.json({ error: 'Valid action or status is required' }, { status: 400 });
    }

    if (persistenceConfigured()) {
      await upsertKnowledgeItems(await createClient(), [items[index]]);
      return NextResponse.json({ success: true, item: items[index] });
    }
    await writePromptsFile(items);
    return NextResponse.json({ success: true, item: items[index] });
  } catch (error) {
    console.error('Admin PATCH knowledge error:', error);
    return NextResponse.json({ error: 'Failed to update item status' }, { status: 500 });
  }
}
