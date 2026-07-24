import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { env } from '@/shared/lib/env';

/**
 * Service-role Supabase client. Bypasses RLS — use only in trusted server code
 * (Edge Functions, scheduled jobs, admin Server Actions). Never expose to browsers.
 */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
