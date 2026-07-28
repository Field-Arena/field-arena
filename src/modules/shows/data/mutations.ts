'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';
import {
  createShowSchema,
  createClassSchema,
  createDivisionSchema,
  createAddOnSchema,
} from '../schemas';
import { formatDateShort } from '@/shared/lib/format/date';

/**
 * Organizer write actions.
 *
 * All of these go through the caller's own client, so RLS decides what is
 * allowed. That matters more here than anywhere else in the app: `use server`
 * exports are publicly callable, and the only thing stopping an arbitrary
 * signed-in user from adding a class to someone else's show is the
 * has_show_permission(..., 'canEditShow') policy. Reaching for the service-role
 * client would remove that check silently.
 */

/** The organization the caller may create shows for. */
async function resolveOrgId(): Promise<string> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  // A SuperAdmin acting as an organizer creates shows for that organization.
  const impersonated = await getImpersonatedOrgId();
  if (impersonated) return impersonated;

  if (profile.org_id) return profile.org_id;

  /**
   * A ShowAdmin has org_id null by design — their authority comes from a
   * staff_assignments row for one show. They can edit shows they are staffed on
   * but cannot conjure new ones for an organization they are not the owner of, so
   * this refuses rather than guessing an org from their assignments.
   */
  throw new Error(
    'Only an organization owner can create a show. Your access is scoped to specific shows.'
  );
}

export async function createShow(input: unknown): Promise<{ id: string }> {
  const parsed = createShowSchema.parse(input);
  const orgId = await resolveOrgId();
  const supabase = await createServerClient();

  // Derived rather than required: the legacy views render date_label directly, so
  // a blank one shows as a gap in the show picker.
  const dateLabel =
    parsed.dateLabel ??
    (parsed.startDate === parsed.endDate
      ? formatDateShort(parsed.startDate)
      : `${formatDateShort(parsed.startDate)} – ${formatDateShort(parsed.endDate)}`);

  const { data, error } = await supabase
    .from('shows')
    .insert({
      org_id: orgId,
      name: parsed.name,
      venue_name: parsed.venueName ?? null,
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      date_label: dateLabel,
      disciplines: parsed.disciplines,
      governing_bodies: parsed.governingBodies,
      show_type: parsed.showType,
      timezone: parsed.timezone ?? null,
      starting_rider_number: parsed.startingRiderNumber,
      // A new show is never published. Going live is a deliberate act that also
      // requires the waiver to be approved.
      published: false,
      status: 'yellow',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/shows');
  return { id: data.id };
}

export async function createClass(input: unknown): Promise<void> {
  const parsed = createClassSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('classes').insert({
    show_id: parsed.showId,
    label: parsed.label,
    division: parsed.division ?? null,
    fee: parsed.fee,
    judges_count: parsed.judgesCount,
    ribbon_places: parsed.ribbonPlaces,
    award_scope: parsed.awardScope,
  });

  if (error) {
    // The unique index on (show_id, label) is what makes the seed idempotent; it
    // also means a duplicate class name is rejected rather than silently doubling
    // the start list.
    if (error.code === '23505') {
      throw new Error(`This show already has a class called "${parsed.label}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/shows');
  revalidatePath('/dashboard/schedule');
}

export async function createDivision(input: unknown): Promise<void> {
  const parsed = createDivisionSchema.parse(input);
  const supabase = await createServerClient();

  // Explicit position: a batch insert shares one now() per statement, so
  // created_at alone ties and Postgres returns an unstable order every fetch.
  const { count } = await supabase
    .from('divisions')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', parsed.showId);

  const { error } = await supabase.from('divisions').insert({
    show_id: parsed.showId,
    name: parsed.name,
    position: count ?? 0,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error(`This show already has a division called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/shows');
}

export async function createAddOn(input: unknown): Promise<void> {
  const parsed = createAddOnSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('add_ons').insert({
    show_id: parsed.showId,
    name: parsed.name,
    price: parsed.price,
    qty: parsed.qty,
    stalls: parsed.stalls,
    nights: parsed.nights,
    shavings: parsed.shavings,
    tack: parsed.tack,
    enabled: true,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error(`This show already has an add-on called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/event-sales');
}

/**
 * Publishes or unpublishes a show.
 *
 * Publishing is gated on the waiver being approved, matching the legacy Go Live
 * rule: the organizer must explicitly approve the waiver text, and if they edit
 * it afterwards without re-approving, the snapshot no longer matches and
 * publishing blocks again. Text equality is the real check — the timestamp is
 * informational.
 */
export async function setShowPublished(showId: string, published: boolean): Promise<void> {
  const supabase = await createServerClient();

  if (published) {
    const { data: show, error } = await supabase
      .from('shows')
      .select('waiver_text, waiver_approved_text')
      .eq('id', showId)
      .single();
    if (error) throw new Error(error.message);

    if (!show.waiver_approved_text || show.waiver_approved_text !== show.waiver_text) {
      throw new Error(
        show.waiver_approved_text
          ? 'The waiver has been edited since it was approved. Re-approve it before publishing.'
          : 'The waiver of liability must be approved before this show can go live.'
      );
    }
  }

  const { error } = await supabase
    .from('shows')
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', showId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/shows');
}
