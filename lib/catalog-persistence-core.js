export function isDeletedCatalogTool(tool) {
  return tool?.status === 'deleted';
}

export function visibleCatalogTools(rows = []) {
  return rows
    .map((row) => row.data)
    .filter((tool) => tool && !isDeletedCatalogTool(tool));
}

export async function upsertCatalogTools(supabase, tools, { ignoreDuplicates = false } = {}) {
  if (!tools.length) return;
  const rows = tools.map((tool) => ({
    slug: tool.slug,
    tool_id: String(tool.id || tool.slug),
    category: tool.category,
    published: tool.status !== 'draft',
    data: tool,
  }));
  const { error } = await supabase
    .from('catalog_tools')
    .upsert(rows, { onConflict: 'slug', ignoreDuplicates });
  if (error) throw error;
}

export async function loadCatalogForMutation(supabase, fallbackTools = []) {
  const { data, error } = await supabase
    .from('catalog_tools')
    .select('slug,published,data')
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (data?.some((row) => row.published)) {
    return visibleCatalogTools(data.filter((row) => row.published));
  }

  await upsertCatalogTools(supabase, fallbackTools, { ignoreDuplicates: true });
  return fallbackTools.filter((tool) => !isDeletedCatalogTool(tool));
}

export async function softDeleteCatalogTool(supabase, slug) {
  const { data, error: readError } = await supabase
    .from('catalog_tools')
    .select('data')
    .eq('slug', slug)
    .maybeSingle();
  if (readError) throw readError;
  if (!data?.data) return false;

  const { error } = await supabase
    .from('catalog_tools')
    .update({
      published: true,
      data: { ...data.data, status: 'deleted' },
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug);
  if (error) throw error;
  return true;
}
