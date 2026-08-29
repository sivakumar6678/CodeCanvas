import { createServerClient } from "@supabase/ssr";
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function getNextHeadersModule() {
  for (const specifier of ['next/headers', 'next/headers.js']) {
    try {
      return require(specifier);
    } catch {
      // ignore and continue; the module may not be available in a non-Next runtime.
    }
  }

  return null;
}

export function createSupabaseCookieAdapter(cookieStore) {
  const safeStore = cookieStore || {};

  return {
    getAll() {
      if (typeof safeStore.getAll === 'function') {
        return safeStore.getAll();
      }

      return [];
    },
    setAll(cookiesToSet = []) {
      if (typeof safeStore.setAll === 'function') {
        safeStore.setAll(cookiesToSet);
        return;
      }

      if (typeof safeStore.set !== 'function') {
        return;
      }

      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          safeStore.set(name, value, options);
        });
      } catch {
        // The `setAll` method was called from a Server Component.
        // This can be ignored if middleware refreshes user sessions.
      }
    },
  };
}

export const createClient = async () => {
  const nextHeaders = getNextHeadersModule();
  const cookieStore = nextHeaders && typeof nextHeaders.cookies === 'function' ? await nextHeaders.cookies() : null;
  const supabaseCookieAdapter = createSupabaseCookieAdapter(cookieStore);

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: supabaseCookieAdapter,
    },
  );
};
