import 'server-only';
import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { createServerClient } from '@/shared/lib/supabase/server';
import type { RiderProfile, StaffProfile } from '@/shared/types/auth';

// Request-scoped identity helpers shared by every module's data layer.
// Each is wrapped in React `cache()` so the layout, page and generateMetadata
// share one auth round-trip per request instead of each calling
// `auth.getUser()` (and the profile select) on their own.

export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getStaffProfile = cache(async (): Promise<StaffProfile | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

  if (error) throw error;
  return data;
});

export const getRiderProfile = cache(async (): Promise<RiderProfile | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase.from('riders').select('*').eq('id', user.id).maybeSingle();

  if (error) throw error;
  return data;
});
