import { createHash } from 'node:crypto';
import {
  mapToolSuggestionToDatabase,
  serializeToolSuggestion,
} from './contribution-validation.js';

export class ToolSuggestionIdempotencyConflict extends Error {
  constructor() {
    super('This submission key was already used for different tool details. Start a new submission.');
    this.name = 'ToolSuggestionIdempotencyConflict';
  }
}

export function createToolSuggestionRequestHash(payload) {
  const canonicalFields = mapToolSuggestionToDatabase(payload);
  return createHash('sha256').update(JSON.stringify(canonicalFields)).digest('hex');
}

async function findExisting(supabase, userId, key) {
  const { data, error } = await supabase
    .from('tool_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('idempotency_key', key)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function assertSameRequest(suggestion, requestHash) {
  if (suggestion.request_hash !== requestHash) {
    throw new ToolSuggestionIdempotencyConflict();
  }
}

export async function findToolSuggestionRequest(supabase, userId, key, requestHash) {
  const suggestion = await findExisting(supabase, userId, key);
  if (!suggestion) return null;
  assertSameRequest(suggestion, requestHash);
  return suggestion;
}

export async function insertToolSuggestionOnce(supabase, payload, userId, key, requestHash) {
  const existing = await findToolSuggestionRequest(supabase, userId, key, requestHash);
  if (existing) return { suggestion: existing, duplicate: true };

  const { data, error } = await supabase
    .from('tool_suggestions')
    .insert(serializeToolSuggestion(payload, userId, { key, requestHash }))
    .select()
    .single();

  if (!error) return { suggestion: data, duplicate: false };
  if (error.code !== '23505') throw error;

  const concurrent = await findToolSuggestionRequest(supabase, userId, key, requestHash);
  if (concurrent) return { suggestion: concurrent, duplicate: true };
  throw error;
}
