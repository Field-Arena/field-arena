import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import type { Database } from '@/shared/types/database.types';

export type StaffProfile = Database['public']['Tables']['users']['Row'];
export type RiderProfile = Database['public']['Tables']['riders']['Row'];

/**
 * The signed-in staff profile, or null — nobody signed in, a rider signed in
 * (riders have no `public.users` row), or an auth account with no profile row
 * at all (real, for accounts predating the schema rebuild). Callers must
 * check for a profile rather than trusting `auth.getUser()` alone: every RLS
 * policy resolves the caller's role through this table, so a session with no
 * profile reads zero rows everywhere and the app looks broken, not unauthorized.
 */
export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // maybeSingle, not single: single() treats "no row" as an error, and no row is
  // an expected outcome here.
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRiderProfile(): Promise<RiderProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('riders')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
