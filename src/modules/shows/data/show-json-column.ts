import 'server-only';
import { UserFacingError } from '@/shared/lib/action-result';
import type { Json } from '@/shared/types/database.types';
import type { createServerClient } from '@/shared/lib/supabase/server';
import type { ShowJsonColumn } from '@/modules/shows/types';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

type JsonObject = Record<string, Json | undefined>;

const MAX_ATTEMPTS = 5;

function asObject(value: Json | null | undefined): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

/**
 * Merge a change into one jsonb column on a show without clobbering a
 * concurrent edit. The write is a compare-and-swap: it only lands if the
 * column still holds exactly what we read (jsonb equality), otherwise we
 * re-read and re-apply `change` to the fresh value. Also throws when the
 * update matched no row at all (e.g. RLS hid it) instead of reporting success.
 */
export async function patchShowJsonColumn(
  supabase: SupabaseClient,
  showId: string,
  column: ShowJsonColumn,
  change: (current: JsonObject) => JsonObject,
  extra: Record<string, unknown> = {},
): Promise<void> {
  let lastSeen: string | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: row, error: readError } = await supabase
      .from('shows')
      .select(column)
      .eq('id', showId)
      .single();
    if (readError) throw new Error(readError.message);

    const raw = (row as Record<ShowJsonColumn, Json | null>)[column];
    const seen = JSON.stringify(raw);
    // The previous write matched nothing yet the value hasn't moved — that's
    // not a race, the row just isn't writable for this caller.
    if (seen === lastSeen)
      throw new UserFacingError("You don't have permission to update this show.");
    lastSeen = seen;

    const next = change(asObject(raw));

    let query = supabase
      .from('shows')
      .update({ ...extra, [column]: next } as never)
      .eq('id', showId);
    query = raw === null ? query.is(column, null) : query.filter(column, 'eq', seen);

    const { data, error } = await query.select('id');
    if (error) throw new Error(error.message);
    if (data.length > 0) return;
  }
  throw new UserFacingError('This show was being edited at the same time — please try again.');
}
