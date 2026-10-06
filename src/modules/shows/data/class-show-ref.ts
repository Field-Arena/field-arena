import 'server-only';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/shared/lib/supabase/server';
import { isUuid } from '@/shared/lib/utils';

type SearchParams = Record<string, string | string[] | undefined>;

/** The show a class belongs to, as the topbar picker refers to it (slug, else id). */
export async function getClassShowRef(
  classId: string,
): Promise<{ id: string; ref: string } | null> {
  if (!isUuid(classId)) return null;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('classes')
    .select('show_id, shows(slug)')
    .eq('id', classId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.show_id, ref: data.shows.slug ?? data.show_id };
}

/* Class-scoped pages (/dashboard/scoring/[classId], judging history) aren't
 * under /dashboard/shows/[showId], so the topbar picker reads ?show= and,
 * without it, falls back to the org's first show — the wrong one. Pin
 * ?show= to the class's own show so the picker always names it. */
export async function ensureClassShowParam(
  pathname: string,
  classId: string,
  searchParams: SearchParams,
): Promise<void> {
  const show = await getClassShowRef(classId);
  if (!show) return;
  const current = searchParams.show;
  if (current === show.ref || current === show.id) return;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'show' || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  params.set('show', show.ref);
  redirect(`${pathname}?${params.toString()}`);
}
