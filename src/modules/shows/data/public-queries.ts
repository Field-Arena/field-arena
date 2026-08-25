import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';

export interface PublicShowClass {
  id: string;
  label: string;
  division: string | null;
  fee: number;
  event: string | null;
  sponsor: string | null;
}

export interface PublicShowPageData {
  id: string;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  orgName: string | null;
  venueName: string | null;
  logoUrl: string | null;
  website: string | null;
  phone: string | null;
  contactEmail: string | null;
  prizeListUrl: string | null;
  classes: PublicShowClass[];
}

export interface PublicShowListItem {
  id: string;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  venueName: string | null;
  orgName: string | null;
  logoUrl: string | null;
}

/**
 * The public shows directory — every published, publicly-visible show, newest
 * first. One link (`/shows`) an organizer can post once; anyone who opens it
 * sees every show they've published and can pick one to view and enter.
 *
 * Same security note as getPublicShowPage: `shows_select_published` is what
 * actually filters this to published shows at public orgs — a plain anon
 * SELECT here already returns the right rows.
 */
export async function listPublicShows(): Promise<PublicShowListItem[]> {
  const supabase = await createServerClient();

  const { data: shows, error } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date, end_date, org_id, venue_name, logo_path')
    .eq('published', true)
    .order('start_date', { ascending: false, nullsFirst: false });
  if (error) throw error;
  if (shows.length === 0) return [];

  const orgIds = [...new Set(shows.map((s) => s.org_id))];
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);
  if (orgError) throw orgError;
  const orgNameById = new Map(orgs.map((o) => [o.id, o.name]));

  return shows.map((s) => ({
    id: s.id,
    name: s.name,
    dateLabel: s.date_label,
    startDate: s.start_date,
    endDate: s.end_date,
    venueName: s.venue_name,
    orgName: orgNameById.get(s.org_id) ?? null,
    logoUrl: s.logo_path ? supabase.storage.from('logos').getPublicUrl(s.logo_path).data.publicUrl : null,
  }));
}

/**
 * The public, shareable show page — everything an anonymous visitor may see for
 * one show. Security is the anon SELECT policies, not this function:
 *   - shows_select_published  → the show row only comes back when it is
 *     published AND its org is public.
 *   - classes_select_published → classes only come back for a publicly visible
 *     show (show_is_publicly_visible).
 * So an unpublished / private show simply resolves to null (→ 404) and a
 * logged-out visitor reads exactly what the organizer chose to publish.
 */
export async function getPublicShowPage(showId: string): Promise<PublicShowPageData | null> {
  const supabase = await createServerClient();

  const { data: show, error } = await supabase
    .from('shows')
    .select(
      'id, name, date_label, start_date, end_date, org_id, venue_name, logo_path, show_details',
    )
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  if (!show) return null;

  const details = (show.show_details ?? {}) as {
    org?: string;
    website?: string;
    phone?: string;
    contactEmail?: string;
    prizeListUrl?: string;
  };

  const [orgResult, classesResult] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', show.org_id).maybeSingle(),
    supabase
      .from('classes')
      .select('id, label, division, fee, event, sponsor')
      .eq('show_id', showId)
      .order('label'),
  ]);
  if (classesResult.error) throw classesResult.error;

  const logoUrl = show.logo_path
    ? supabase.storage.from('logos').getPublicUrl(show.logo_path).data.publicUrl
    : null;

  return {
    id: show.id,
    name: show.name,
    dateLabel: show.date_label,
    startDate: show.start_date,
    endDate: show.end_date,
    orgName: orgResult.data?.name ?? details.org ?? null,
    venueName: show.venue_name,
    logoUrl,
    website: details.website ?? null,
    phone: details.phone ?? null,
    contactEmail: details.contactEmail ?? null,
    prizeListUrl: details.prizeListUrl ?? null,
    classes: classesResult.data.map((c) => ({
      id: c.id,
      label: c.label,
      division: c.division,
      fee: c.fee ?? 0,
      event: c.event,
      sponsor: c.sponsor,
    })),
  };
}
