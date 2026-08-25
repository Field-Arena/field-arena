import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { env } from '@/shared/lib/env';

export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
