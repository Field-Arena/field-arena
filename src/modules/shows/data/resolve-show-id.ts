import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { isUuid } from '@/shared/lib/utils';

// The one shared "is this a real id, or a slug I need to look up" resolver
// — every route that takes a show id/slug from a URL param uses this
// instead of its own isUuid() check, so old raw-UUID links keep working
// side by side with the new slug URLs.
export async function resolveShowIdParam(param: string): Promise<string | null> {
  if (isUuid(param)) return param;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('id')
    .eq('slug', param)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
