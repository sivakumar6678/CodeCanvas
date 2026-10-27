export const CATALOG_MUTATION_AUTH_ERROR =
  "This admin is not authorized by the catalog database policy. Configure this user's production profile as admin or set the server-only SUPABASE_SERVICE_ROLE_KEY.";

export function catalogDatabaseFailure(error) {
  if (error?.code === '42501') {
    return {
      status: 403,
      message: 'The database denied this catalog change. Verify the production admin profile or server-side catalog configuration.',
    };
  }

  if (error?.code === '23505') {
    return {
      status: 409,
      message: 'A catalog tool with the same unique identifier already exists.',
    };
  }

  return {
    status: 500,
    message: 'The catalog database operation failed. Check the server logs for details.',
  };
}

export function logCatalogDatabaseFailure(operation, error) {
  console.error('[catalog] Database operation failed', {
    operation,
    code: typeof error?.code === 'string' ? error.code.slice(0, 32) : 'UNKNOWN',
    message: typeof error?.message === 'string' ? error.message.slice(0, 300) : 'Unknown database error',
  });
}
