'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/modules/superadmin/data/impersonation';
import { getShowStage } from './queries';
import {
  createShowSchema,
  createClassSchema,
  updateClassReviewSchema,
  removeClassSchema,
  createDivisionSchema,
  createAddOnSchema,
  updateShowDetailsSchema,
  updateShowLocationsSchema,
  updateSchedulePrefsSchema,
  updateContactSchema,
  updatePrizeListSchema,
  renameDivisionSchema,
  updateDocumentRequirementsSchema,
  updateMerchandiseSchema,
  saveWaiverTextSchema,
  updateTicketWindowSchema,
  addCatalogGroupSchema,
  addCustomClassSchema,
  createTocClassSchema,
  addQualTypePresetSchema,
  updateCatalogItemSchema,
  createVendorItemSchema,
  updateVendorItemSchema,
  createQualTypeSchema,
  uploadShowBrandingSchema,
  uploadVendorMapSchema,
  uploadShowDocumentSchema,
  removeShowDocumentSchema,
  updateDocumentEventsSchema,
  saveTestTemplateSchema,
} from '../schemas';
import { VENDOR_SPACE_TEMPLATE } from '../constants';
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

/**
 * "+ New Show" — creates the show immediately and hands back its id.
 *
 * No form first. Every field the old standalone create page asked for is
 * already editable on Show Manager's Setup tab, and asking for them twice meant
 * an organizer filled in dates before they had decided anything else. The row
 * starts as a placeholder — name "New Show", no dates — which is exactly how the
 * design's show picker renders it ("New Show · Dates TBD · Venue TBD") until
 * Setup is filled in.
 *
 * Only `name` is NOT NULL on shows, so nothing else needs inventing here.
 */
export async function createDraftShow(): Promise<{ id: string }> {
  const orgId = await resolveOrgId();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .insert({
      org_id: orgId,
      name: 'New Show',
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

export async function createDivision(input: unknown): Promise<{ id: string }> {
  const parsed = createDivisionSchema.parse(input);
  const supabase = await createServerClient();

  // Explicit position: a batch insert shares one now() per statement, so
  // created_at alone ties and Postgres returns an unstable order every fetch.
  const { count } = await supabase
    .from('divisions')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', parsed.showId);

  const { data, error } = await supabase
    .from('divisions')
    .insert({
      show_id: parsed.showId,
      name: parsed.name,
      position: count ?? 0,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`This show already has a division called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/shows');
  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  return { id: data.id };
}

export async function renameDivision(input: unknown): Promise<void> {
  const parsed = renameDivisionSchema.parse(input);
  const supabase = await createServerClient();

  const { data: division, error: readError } = await supabase
    .from('divisions')
    .select('show_id')
    .eq('id', parsed.divisionId)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase
    .from('divisions')
    .update({ name: parsed.name })
    .eq('id', parsed.divisionId);
  if (error) {
    if (error.code === '23505') {
      throw new Error(`This show already has a division called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${division.show_id}`);
}

export async function deleteDivision(divisionId: string): Promise<void> {
  const supabase = await createServerClient();

  const { data: division, error: readError } = await supabase
    .from('divisions')
    .select('show_id')
    .eq('id', divisionId)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from('divisions').delete().eq('id', divisionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${division.show_id}`);
}

export async function createAddOn(input: unknown): Promise<{ id: string }> {
  const parsed = createAddOnSchema.parse(input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('add_ons')
    .insert({
      show_id: parsed.showId,
      name: parsed.name,
      price: parsed.price,
      qty: parsed.qty,
      stalls: parsed.stalls,
      nights: parsed.nights,
      shavings: parsed.shavings,
      tack: parsed.tack,
      enabled: true,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`This show already has an add-on called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/event-sales');
  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);
  return { id: data.id };
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

/**
 * Advances the Run Show stage tracker: closing ticket sales or approving the
 * schedule to go live. Both are booleans on `runner_state`, merged rather than
 * replaced so setting one never clobbers the other. Only ever sets these true
 * from the Run Show tab — there is no "un-close" or "un-approve" action,
 * matching the legacy runner's one-way stage progression.
 */
export async function advanceRunnerState(
  showId: string,
  patch: { ticketClosed?: boolean; approved?: boolean }
): Promise<void> {
  const supabase = await createServerClient();

  const { data: show, error: readError } = await supabase
    .from('shows')
    .select('runner_state')
    .eq('id', showId)
    .single();
  if (readError) throw new Error(readError.message);

  const current = (show.runner_state ?? {}) as { approved?: boolean; ticketClosed?: boolean };

  const { error } = await supabase
    .from('shows')
    .update({ runner_state: { ...current, ...patch } })
    .eq('id', showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${showId}/run-show`);
}

/* ── Show Manager — Setup tab writes ─────────────────────────────────────
   One mutation per card, matching the design and showstaff.html's own
   per-card save functions (saveSmShowDetails, applySavedLocation /
   setSmLocationCount / renameSmLocation / resizeSmLocation, and
   saveSmSchedulePrefs) — none of those cards has its own Save button in
   either source; every field autosaves on change, so the client calls
   these with the whole card's current values each time any one field
   changes. */

export async function updateShowDetails(input: unknown): Promise<void> {
  const parsed = updateShowDetailsSchema.parse(input);
  const supabase = await createServerClient();

  // org lives in show_details jsonb alongside website/phone/contactEmail
  // (owned by updateContact below) and prizeListUrl (updatePrizeList) — so
  // this reads the row first rather than overwriting the whole jsonb blob
  // with only the one field this card knows about.
  const { data: current, error: readError } = await supabase
    .from('shows')
    .select('show_details')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);
  const showDetails = { ...(current.show_details as Record<string, unknown>), org: parsed.org ?? '' };

  const { error } = await supabase
    .from('shows')
    .update({
      name: parsed.name,
      show_details: showDetails,
      show_type: parsed.showType,
      // Null, not '', for a date the organizer has not set yet — every read
      // treats null as "no date" ("Dates TBD" in the picker), and an empty
      // string would sort and compare as a real value.
      start_date: parsed.startDate || null,
      end_date: parsed.endDate || null,
      timezone: parsed.timezone ?? null,
      starting_rider_number: parsed.startingRiderNumber,
      governing_bodies: parsed.governingBodies,
    })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  revalidatePath('/dashboard/shows');
  revalidatePath('/dashboard');
}

export async function updateShowLocations(input: unknown): Promise<void> {
  const parsed = updateShowLocationsSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({ locations: parsed.locations })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

/**
 * Applies a saved venue's ring layout to this show. A one-time copy, not a
 * live link — matches showstaff.html's applySavedLocation, which explains
 * the same choice: a show keeps working identically afterward whether its
 * rings came from a saved venue or were typed in by hand. Falls back to a
 * single default ring when the venue has none saved yet.
 */
export async function applySavedVenue(showId: string, venueId: string): Promise<void> {
  const supabase = await createServerClient();

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id, name, rings')
    .eq('id', venueId)
    .single();
  if (venueError) throw new Error(venueError.message);

  const rings = ((venue.rings as { name: string; size?: string }[] | null) ?? []).length
    ? (venue.rings as { name: string; size?: string }[])
    : [{ name: 'Ring 1', size: 'standard' }];

  const { error } = await supabase
    .from('shows')
    .update({
      venue_id: venue.id,
      venue_name: venue.name,
      locations: rings.map((r) => ({ name: r.name, size: r.size ?? 'standard' })),
    })
    .eq('id', showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${showId}`);
}

export async function updateSchedulePrefs(input: unknown): Promise<void> {
  const parsed = updateSchedulePrefsSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({
      schedule_prefs: {
        perMin: parsed.perMin,
        buffer: parsed.buffer,
        upper: parsed.upper,
        end: parsed.end,
        order: parsed.order,
        warmup: parsed.warmup,
        lunch: parsed.lunch,
        extraBreaks: parsed.extraBreaks,
        extraBreakMin: parsed.extraBreakMin,
      },
      day_start_times: parsed.dayStartTimes,
      day_end_times: parsed.dayEndTimes,
    })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

/**
 * Deletes a show from the "Incomplete Shows" list.
 *
 * Two guards match the legacy DELETE endpoint's rule (api/shows/[id].js: an
 * Organizer may delete only a show that "hasn't opened for entries"):
 *
 *  1. Stage must be 'setup' — unpublished, not live, no results. RLS's own
 *     shows_delete policy is looser (org access is enough), because RLS is
 *     the security boundary, not the product rule; this is the product
 *     rule, enforced here rather than trusted to every future call site.
 *  2. No orders reference this show. orders.show_id is `on delete
 *     restrict` (real money, never silently cascaded away), so a show that
 *     took even one payment fails this delete with a clear message instead
 *     of a raw FK-violation from Postgres.
 *
 * Every other show-scoped table cascades on show_id, so the row delete
 * below is the entire operation once these two checks pass.
 */
export async function deleteShow(showId: string): Promise<void> {
  const supabase = await createServerClient();

  const stage = await getShowStage(showId);
  if (stage !== 'setup') {
    throw new Error('This show has already opened for entries and can no longer be deleted here.');
  }

  const { count: orderCount, error: orderError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', showId);
  if (orderError) throw new Error(orderError.message);
  if ((orderCount ?? 0) > 0) {
    throw new Error('This show has orders on it and can no longer be deleted.');
  }

  const { error } = await supabase.from('shows').delete().eq('id', showId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/shows');
}

/* ── Show Manager — Setup tab writes, continued ──────────────────────────
   Contact, Prize list, Class divisions (rename/delete above), Required
   Documents, Merchandise Sales, and Waiver of Liability. Contact and Prize
   list share show_details jsonb with updateShowDetails above — each does
   its own read-modify-write, matching showstaff.html's own per-field
   smSaveContactField calls; a user editing two of these fields within the
   same instant could in principle lose one, same as the legacy behaviour
   this ports rather than a new gap. */

export async function updateContact(input: unknown): Promise<void> {
  const parsed = updateContactSchema.parse(input);
  const supabase = await createServerClient();

  const { data: current, error: readError } = await supabase
    .from('shows')
    .select('show_details')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);

  const showDetails = {
    ...(current.show_details as Record<string, unknown>),
    website: parsed.website ?? '',
    phone: parsed.phone ?? '',
    contactEmail: parsed.contactEmail ?? '',
  };

  const { error } = await supabase
    .from('shows')
    .update({ show_details: showDetails })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function updatePrizeList(input: unknown): Promise<void> {
  const parsed = updatePrizeListSchema.parse(input);
  const supabase = await createServerClient();

  const { data: current, error: readError } = await supabase
    .from('shows')
    .select('show_details')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);

  const showDetails = {
    ...(current.show_details as Record<string, unknown>),
    prizeListUrl: parsed.prizeListUrl ?? '',
  };

  const { error } = await supabase
    .from('shows')
    .update({ show_details: showDetails })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function updateDocumentRequirements(input: unknown): Promise<void> {
  const parsed = updateDocumentRequirementsSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({ document_requirements: parsed.requirements })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function updateMerchandise(input: unknown): Promise<void> {
  const parsed = updateMerchandiseSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({ merchandise_enabled: parsed.enabled, merch_items: parsed.items })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function saveWaiverText(input: unknown): Promise<void> {
  const parsed = saveWaiverTextSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({ waiver_text: parsed.waiverText })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

/**
 * Approves exactly the text passed in, not whatever the row currently
 * holds — mirrors setShowPublished's own read of the same two columns:
 * approving has to snapshot precisely what's on screen at that moment, so
 * an edit made between "Save" and "Approve" can't be approved by accident.
 */
export async function approveWaiver(showId: string, waiverText: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({ waiver_approved_text: waiverText, waiver_approved_at: new Date().toISOString() })
    .eq('id', showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${showId}`);
}

/* ── Show Manager — Select Events tab ────────────────────────────────────── */

export async function updateTicketWindow(input: unknown): Promise<void> {
  const parsed = updateTicketWindowSchema.parse(input);
  const supabase = await createServerClient();

  // One column, two inputs. Blank date means "no close set", so the time is
  // dropped with it rather than stored on its own where nothing could read it.
  const close = parsed.ticketCloseDate
    ? `${parsed.ticketCloseDate}${parsed.ticketCloseTime ? ` ${parsed.ticketCloseTime}` : ''}`
    : '';

  const { error } = await supabase
    .from('shows')
    .update({ ticket_open: parsed.ticketOpen, ticket_close: close })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath('/dashboard');
}

/**
 * Turns one checked catalog group into classes — one per test in it.
 *
 * Inserted in a single statement so a group either lands whole or not at all;
 * a partial level would show the organizer three tests where the catalog says
 * six and give no clue which failed.
 *
 * Duplicate labels are ignored rather than rejected. The unique index on
 * (show_id, label) means re-checking a group an organizer already added would
 * otherwise fail outright, when the intent — "these tests should be on the
 * show" — is already satisfied.
 */
export async function addCatalogGroup(input: unknown): Promise<{ added: number }> {
  const parsed = addCatalogGroupSchema.parse(input);
  const supabase = await createServerClient();

  const rows = parsed.tests.map((test) => ({
    show_id: parsed.showId,
    label: `${parsed.group} — ${test}`,
    event: parsed.category,
    group_name: parsed.group,
    division: parsed.group,
    location: parsed.location || null,
    fee: parsed.fee,
    // Pooled by division so a level's tests rank as one set of placings, which
    // is what a "division" means to an organizer checking the box.
    award_scope: 'division' as const,
  }));

  const { data, error } = await supabase
    .from('classes')
    .upsert(rows, { onConflict: 'show_id,label', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath('/dashboard/shows');
  revalidatePath('/dashboard/schedule');
  return { added: data.length };
}

/** Removes every class a catalog group created, by its division name. */
export async function removeCatalogGroup(input: unknown): Promise<void> {
  const parsed = addCatalogGroupSchema.pick({ showId: true, group: true }).parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('show_id', parsed.showId)
    .eq('division', parsed.group);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath('/dashboard/shows');
  revalidatePath('/dashboard/schedule');
}

export async function addCustomClass(input: unknown): Promise<void> {
  const parsed = addCustomClassSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('classes').insert({
    show_id: parsed.showId,
    label: parsed.name,
    division: parsed.division ?? null,
    fee: parsed.fee,
    event: 'Custom',
    price_edited: true,
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error(`This show already has a class called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath('/dashboard/shows');
}

export async function createTocClass(input: unknown): Promise<void> {
  const parsed = createTocClassSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('classes').insert({
    show_id: parsed.showId,
    // Generic label, organizer's wording in display_name — see the schema.
    label: `Test of Choice — ${parsed.name}`,
    display_name: parsed.name,
    division: parsed.division ?? null,
    fee: parsed.fee,
    event: 'TOC',
    qual_types: parsed.testOptions,
    price_edited: true,
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error(`This show already has a Test of Choice called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath('/dashboard/shows');
}

/**
 * Adds a governing body as a qualifying type riders can opt into.
 *
 * Disabled on creation, matching the qual_types default: appearing in the
 * catalog and being on sale are two separate decisions.
 */
export async function addQualTypePreset(input: unknown): Promise<void> {
  const parsed = addQualTypePresetSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('qual_types').insert({
    show_id: parsed.showId,
    name: parsed.body,
    price: parsed.price,
    enabled: false,
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error(`${parsed.body} is already a qualifying type on this show.`);
    }
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath('/dashboard/event-sales');
}

/* ── Show Manager — Rider Entries tab ────────────────────────────────────
   Branding, Add-Ons, Vendor Space Map, Vendor Spaces, Qualifications. No
   table here has a unique index on name (see schemas.ts's own note), so
   unlike createClass/createDivision above none of these need 23505
   handling. */

export async function updateAddOn(input: unknown): Promise<void> {
  const parsed = updateCatalogItemSchema.parse(input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('add_ons')
    .update({ name: parsed.name, price: parsed.price })
    .eq('id', parsed.id)
    .select('show_id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${data.show_id}/rider-entries`);
}

export async function deleteAddOn(id: string): Promise<void> {
  const supabase = await createServerClient();

  const { data, error: readError } = await supabase
    .from('add_ons')
    .select('show_id')
    .eq('id', id)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from('add_ons').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${data.show_id}/rider-entries`);
}

export async function createVendorItem(input: unknown): Promise<{ id: string }> {
  const parsed = createVendorItemSchema.parse(input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('vendor_items')
    .insert({ show_id: parsed.showId, name: parsed.name, price: parsed.price, qty: parsed.qty, enabled: true })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);
  return { id: data.id };
}

export async function updateVendorItem(input: unknown): Promise<void> {
  const parsed = updateVendorItemSchema.parse(input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('vendor_items')
    .update({ name: parsed.name, price: parsed.price, qty: parsed.qty })
    .eq('id', parsed.id)
    .select('show_id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${data.show_id}/rider-entries`);
}

export async function deleteVendorItem(id: string): Promise<void> {
  const supabase = await createServerClient();

  const { data, error: readError } = await supabase
    .from('vendor_items')
    .select('show_id')
    .eq('id', id)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from('vendor_items').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${data.show_id}/rider-entries`);
}

export interface StandardVendorSpaceRow {
  id: string;
  name: string;
  price: number;
  qty: number | null;
}

/**
 * "Load standard space list" — inserts every VENDOR_SPACE_TEMPLATE entry not
 * already present on this show, matched case-insensitively by name, ported
 * verbatim from showstaff.html's loadSmVendorItemTemplate so repeat clicks
 * stay idempotent instead of piling up duplicates. Returns the inserted
 * rows, not just a count — the client card holds its own list in local
 * state for optimistic add/rename/remove, and has no other way to learn the
 * real ids Postgres just assigned without a full reload.
 */
export async function loadStandardVendorSpaces(showId: string): Promise<StandardVendorSpaceRow[]> {
  const supabase = await createServerClient();

  const { data: existing, error: readError } = await supabase
    .from('vendor_items')
    .select('name')
    .eq('show_id', showId);
  if (readError) throw new Error(readError.message);

  const existingNames = new Set(existing.map((v) => v.name.trim().toLowerCase()));
  const rows = VENDOR_SPACE_TEMPLATE.filter((tpl) => !existingNames.has(tpl.name.toLowerCase())).map(
    (tpl) => ({ show_id: showId, name: tpl.name, price: tpl.price, enabled: true, qty: null })
  );
  if (rows.length === 0) return [];

  const { data, error } = await supabase.from('vendor_items').insert(rows).select('id, name, price, qty');
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${showId}/rider-entries`);
  return data.map((v) => ({ id: v.id, name: v.name, price: v.price ?? 0, qty: v.qty }));
}

export async function createQualType(input: unknown): Promise<{ id: string }> {
  const parsed = createQualTypeSchema.parse(input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('qual_types')
    .insert({ show_id: parsed.showId, name: parsed.name, price: parsed.price, enabled: true })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);
  return { id: data.id };
}

export async function updateQualType(input: unknown): Promise<void> {
  const parsed = updateCatalogItemSchema.parse(input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('qual_types')
    .update({ name: parsed.name, price: parsed.price })
    .eq('id', parsed.id)
    .select('show_id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${data.show_id}/rider-entries`);
}

export async function deleteQualType(id: string): Promise<void> {
  const supabase = await createServerClient();

  const { data, error: readError } = await supabase
    .from('qual_types')
    .select('show_id')
    .eq('id', id)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from('qual_types').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${data.show_id}/rider-entries`);
}

/**
 * Branding logo/banner upload. Same real-Storage-upload-then-column-update
 * pattern as uploadCatalogDocument in the superadmin module: the file
 * arrives base64-encoded (Server Action bodies can't carry a raw File), gets
 * written to the show-scoped path the fa_show_branding_write policy expects
 * (`{show_id}/{filename}` inside the `logos`/`show-images` bucket — see
 * storage.sql's path-convention header), and the resulting path is saved on
 * the row. Both buckets are public, so the UI resolves a display URL itself
 * with getPublicUrl rather than this mutation returning one.
 */
export async function uploadShowBranding(input: unknown): Promise<void> {
  const parsed = uploadShowBrandingSchema.parse(input);
  const supabase = await createServerClient();

  const bucket = parsed.kind === 'logo' ? 'logos' : 'show-images';
  const column = parsed.kind === 'logo' ? 'logo_path' : 'show_image_path';
  const bytes = Buffer.from(parsed.dataBase64, 'base64');
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: parsed.contentType ?? 'image/jpeg',
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  // Branched rather than `{ [column]: path }`: a computed key widens to
  // Record<string, string>, which the generated Update type rejects outright
  // because it cannot tell that `column` is one of its own two columns.
  const { error } = await supabase
    .from('shows')
    .update(column === 'logo_path' ? { logo_path: path } : { show_image_path: path })
    .eq('id', parsed.showId);
  if (error) {
    // Don't leave an orphaned object if the row update fails.
    await supabase.storage.from(bucket).remove([path]);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);
}

/**
 * Vendor space map upload. vendor-maps is a private bucket (booth layouts
 * are only for vendors actually applying to this show), so unlike branding
 * this returns a freshly signed URL rather than void — there is no plain
 * public URL the client could construct itself for the "View current map"
 * link that appears the moment this resolves.
 */
export async function uploadVendorMap(input: unknown): Promise<{ url: string | null }> {
  const parsed = uploadVendorMapSchema.parse(input);
  const supabase = await createServerClient();

  const bytes = Buffer.from(parsed.dataBase64, 'base64');
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('vendor-maps').upload(path, bytes, {
    contentType: parsed.contentType ?? 'application/pdf',
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase
    .from('shows')
    .update({ vendor_map_path: path, vendor_map_url: null })
    .eq('id', parsed.showId);
  if (error) {
    await supabase.storage.from('vendor-maps').remove([path]);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);

  const { data } = await supabase.storage.from('vendor-maps').createSignedUrl(path, 3600);
  return { url: data?.signedUrl ?? null };
}

export async function removeVendorMap(showId: string): Promise<void> {
  const supabase = await createServerClient();

  const { data: show, error: readError } = await supabase
    .from('shows')
    .select('vendor_map_path')
    .eq('id', showId)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase
    .from('shows')
    .update({ vendor_map_path: null, vendor_map_url: null })
    .eq('id', showId);
  if (error) throw new Error(error.message);

  if (show.vendor_map_path) {
    // Best-effort: the row is already updated, so a stray object is not worth failing on.
    await supabase.storage.from('vendor-maps').remove([show.vendor_map_path]);
  }

  revalidatePath(`/dashboard/shows/${showId}/rider-entries`);
}

export async function updateClassReview(input: unknown): Promise<void> {
  const parsed = updateClassReviewSchema.parse(input);
  const supabase = await createServerClient();

  const patch = {
    ...(parsed.arena !== undefined ? { arena: parsed.arena } : {}),
    ...(parsed.judgesCount !== undefined ? { judges_count: parsed.judgesCount } : {}),
    ...(parsed.fee !== undefined ? { fee: parsed.fee } : {}),
  };

  const { error } = await supabase.from('classes').update(patch).eq('id', parsed.classId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/schedule`);
}

/**
 * class_entries.class_id cascades on delete, so a class with entries already
 * on it is refused here rather than silently taking those entries with it.
 */
export async function removeClass(input: unknown): Promise<void> {
  const parsed = removeClassSchema.parse(input);
  const supabase = await createServerClient();

  const { count: entryCount, error: entryError } = await supabase
    .from('class_entries')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', parsed.classId);
  if (entryError) throw new Error(entryError.message);
  if ((entryCount ?? 0) > 0) {
    throw new Error('This class has entries on it and can no longer be removed.');
  }

  const { error } = await supabase.from('classes').delete().eq('id', parsed.classId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/schedule`);
}

/* ── Show Manager — Documents tab writes ─────────────────────────────────
   The file library organizers publish to competitors. `documents` is a
   private bucket; path convention is documents/{show_id}/{filename}, matching
   what storage.sql's fa_documents_write policy expects. */

const SHOW_DOCS_BUCKET = 'documents';

export async function uploadShowDocument(input: unknown): Promise<{ id: string }> {
  const parsed = uploadShowDocumentSchema.parse(input);
  const supabase = await createServerClient();

  const bytes = Buffer.from(parsed.dataBase64, 'base64');
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(SHOW_DOCS_BUCKET).upload(path, bytes, {
    contentType: parsed.contentType ?? 'application/pdf',
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from('documents')
    .insert({ show_id: parsed.showId, name: parsed.name, path })
    .select('id')
    .single();
  if (error) {
    // Don't leave an orphaned object if the row insert fails.
    await supabase.storage.from(SHOW_DOCS_BUCKET).remove([path]);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/documents`);
  revalidatePath('/dashboard/documents');
  return { id: data.id };
}

export async function removeShowDocument(input: unknown): Promise<void> {
  const parsed = removeShowDocumentSchema.parse(input);
  const supabase = await createServerClient();

  const { data: doc, error: readError } = await supabase
    .from('documents')
    .select('path')
    .eq('id', parsed.id)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from('documents').delete().eq('id', parsed.id);
  if (error) throw new Error(error.message);

  // Best-effort: the row is already gone, so a stray object is not worth failing on.
  await supabase.storage.from(SHOW_DOCS_BUCKET).remove([doc.path]);

  revalidatePath(`/dashboard/shows/${parsed.showId}/documents`);
  revalidatePath('/dashboard/documents');
}

/** Which classes/events a document is attached to — the Documents tab's own per-row checklist. */
export async function updateDocumentEvents(input: unknown): Promise<void> {
  const parsed = updateDocumentEventsSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('documents')
    .update({ event_ids: parsed.eventIds })
    .eq('id', parsed.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/documents`);
}

/* ── Show Manager — Test Builder tab writes ──────────────────────────────
   Org-owned dressage test templates. One save action covers both create and
   edit — the editor is a single form the organizer fills out and submits
   once, not a row of independently-blurring fields, so there is no field-
   level race to guard against here the way Review's per-class edits needed. */

export async function saveTestTemplate(input: unknown): Promise<{ id: string }> {
  const parsed = saveTestTemplateSchema.parse(input);
  const supabase = await createServerClient();

  if (parsed.id) {
    const { data, error } = await supabase
      .from('test_templates')
      .update({
        name: parsed.name,
        level: parsed.level ?? null,
        movements: parsed.movements,
        collectives: parsed.collectives,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.id)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from('test_templates')
    .insert({
      org_id: parsed.orgId,
      name: parsed.name,
      level: parsed.level ?? null,
      source_label: parsed.sourceLabel ?? null,
      movements: parsed.movements,
      collectives: parsed.collectives,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function deleteTestTemplate(id: string): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase.from('test_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
