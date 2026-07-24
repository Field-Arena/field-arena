import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/shared/types/database.types';
import { env } from '@/shared/lib/env';

export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
