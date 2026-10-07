import 'server-only';

export function persistenceConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export async function readPersistedCatalog(supabase, { includeDrafts = false } = {}) {
  if (!persistenceConfigured()) return null;
  let query = supabase.from('catalog_tools').select('data').order('created_at', { ascending: false });
  if (!includeDrafts) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) return null;
  return (data || []).map((row) => row.data).filter(Boolean);
}

export async function readPersistedKnowledge(supabase, { includeDrafts = false } = {}) {
  if (!persistenceConfigured()) return null;
  let query = supabase.from('knowledge_items').select('data').order('created_at', { ascending: false });
  if (!includeDrafts) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) return null;
  return (data || []).map((row) => row.data).filter(Boolean);
}

export async function upsertCatalogTools(supabase, tools) {
  const rows = tools.map((tool) => ({
    slug: tool.slug,
    tool_id: String(tool.id || tool.slug),
    category: tool.category,
    published: tool.status !== 'draft',
    data: tool,
  }));
  const { error } = await supabase.from('catalog_tools').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
}

export async function deleteCatalogTool(supabase, slug) {
  const { error } = await supabase.from('catalog_tools').delete().eq('slug', slug);
  if (error) throw error;
}

export async function upsertKnowledgeItems(supabase, items) {
  const rows = items.map((item) => ({
    id: String(item.id),
    published: item.status !== 'draft',
    data: item,
  }));
  const { error } = await supabase.from('knowledge_items').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteKnowledgeItem(supabase, id) {
  const { error } = await supabase.from('knowledge_items').delete().eq('id', String(id));
  if (error) throw error;
}
