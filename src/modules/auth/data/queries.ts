import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import type { Database } from '@/shared/types/database.types';

export type StaffProfile = Database['public']['Tables']['users']['Row'];
export type RiderProfile = Database['public']['Tables']['riders']['Row'];

/**
 * The signed-in staff profile, or null.
 *
 * Returning null covers three genuinely different situations that all mean "this
 * request cannot act as staff":
 *
 *  - nobody is signed in;
 *  - a rider is signed in (riders have no row in public.users);
 *  - an auth account exists with no profile row at all.
 *
 * That third case is not hypothetical. Accounts predating the schema rebuild are
 * in exactly that state, and they are the reason callers must check for a
 * profile rather than settling for `auth.getUser()` returning a user. An
 * authenticated session with no profile passes every "is someone logged in"
 * check and then reads zero rows from every table, because each RLS policy
 * resolves the caller's role through this table — so the app looks broken rather
 * than unauthorized.
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
