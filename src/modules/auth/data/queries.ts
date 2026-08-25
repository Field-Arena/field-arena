import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import type { Database } from '@/shared/types/database.types';

export type StaffProfile = Database['public']['Tables']['users']['Row'];
export type RiderProfile = Database['public']['Tables']['riders']['Row'];

export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRiderProfile(): Promise<RiderProfile | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('riders').select('*').eq('id', user.id).maybeSingle();

  if (error) throw error;
  return data;
}
