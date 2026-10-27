const SCHEMA_ERROR_CODES = new Set(['42P01', '42703', 'PGRST204', 'PGRST205']);

export function getToolSuggestionInsertFailure(error) {
  if (SCHEMA_ERROR_CODES.has(error?.code)) {
    return {
      status: 503,
      error: 'The contribution database schema is outdated. Run data/contributions_schema.sql in the SQL Editor for the Supabase project configured by this app.',
    };
  }

  if (error?.code === '42501') {
    return {
      status: 403,
      error: 'The database denied this submission. Check the authenticated insert policy for tool_suggestions.',
    };
  }

  return {
    status: 500,
    error: 'Unable to submit this tool suggestion. Please try again.',
  };
}
