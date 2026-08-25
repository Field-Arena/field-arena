import 'server-only';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/database.types';
import { env } from '@/shared/lib/env';
import { withoutPersistence, hardenAuthCookie } from './session-persistence';

export async function createServerClient({
  persistSession = true,
}: { persistSession?: boolean } = {}) {
  const cookieStore = await cookies();

  return createSSRClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(
              name,
              value,
              hardenAuthCookie(persistSession ? options : withoutPersistence(options)),
            );
          }
        } catch {
          // setAll may be called from a Server Component during render — Next.js
          // does not allow setting cookies there. Middleware handles refresh.
        }
      },
    },
  });
}
