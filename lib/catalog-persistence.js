import 'server-only';
import {
  loadCatalogForMutation,
  softDeleteCatalogTool,
  upsertCatalogTools,
  visibleCatalogTools,
} from './catalog-persistence-core.js';
import { createAdminClient, hasAdminConfig } from './supabase/admin.js';
import { selectCatalogMutationClient } from './catalog-mutation-client-core.js';

export { loadCatalogForMutation, upsertCatalogTools };

export function getCatalogMutationClient(auth) {
  const adminClient = hasAdminConfig() ? createAdminClient() : null;
  return selectCatalogMutationClient({
    user: auth?.user,
    isAdmin: auth?.isAdmin,
    profile: auth?.profile,
    sessionClient: auth?.supabase,
    adminClient,
  });
}

export function persistenceConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
  );
}

export async function readPersistedCatalog(supabase, { includeDrafts = false } = {}) {
  if (!persistenceConfigured()) return null;
  let query = supabase.from('catalog_tools').select('data').order('created_at', { ascending: false });
  if (!includeDrafts) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) return null;
  return visibleCatalogTools(data || []);
}

export async function readPersistedKnowledge(supabase, { includeDrafts = false } = {}) {
  if (!persistenceConfigured()) return null;
  let query = supabase.from('knowledge_items').select('data').order('created_at', { ascending: false });
  if (!includeDrafts) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) return null;
  return (data || []).map((row) => row.data).filter(Boolean);
}

export async function deleteCatalogTool(supabase, slug) {
  return softDeleteCatalogTool(supabase, slug);
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
