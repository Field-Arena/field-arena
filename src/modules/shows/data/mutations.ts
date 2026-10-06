'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { getImpersonatedOrgId } from '@/shared/lib/auth/view-as';
import { getShowStage } from '@/modules/shows/data/queries';
import { parseInput, UserFacingError } from '@/shared/lib/action-result';
import {
  createShowSchema,
  createClassSchema,
  updateClassReviewSchema,
  reorderClassesSchema,
  removeClassSchema,
  createDivisionSchema,
  createAddOnSchema,
  updateShowDetailsSchema,
  updateShowLocationsSchema,
  updateSchedulePrefsSchema,
  updateContactSchema,
  updatePrizeListSchema,
  renameDivisionSchema,
  updateDivisionDefaultFeeSchema,
  updateDocumentRequirementsSchema,
  updateMerchandiseSchema,
  saveWaiverTextSchema,
  updateTicketWindowSchema,
  addCatalogGroupSchema,
  setTestDivisionSchema,
  updateTestFeeSchema,
  setTestQualifyingSchema,
  removeTestClassesSchema,
  updateGroupLocationSchema,
  updateGroupDivisionSchema,
  addCustomClassSchema,
  createTocClassSchema,
  addQualTypePresetSchema,
  updateCatalogItemSchema,
  updateAddOnSchema,
  createVendorItemSchema,
  updateVendorItemSchema,
  createQualTypeSchema,
  uploadShowBrandingSchema,
  uploadVendorMapSchema,
  removeShowDocumentSchema,
  updateDocumentEventsSchema,
  saveTestTemplateSchema,
  assignTestTemplateToClassSchema,
  unassignTestFromClassSchema,
  saveShowExpensesSchema,
  updateScheduleRulesSchema,
  setClassDurationSchema,
  moveClassToRingDaySchema,
  scratchEntrySchema,
  reorderRideSchema,
  createDocumentUploadUrlSchema,
  registerShowDocumentSchema,
  createWaiverDocumentUploadUrlSchema,
  registerWaiverDocumentSchema,
  removeWaiverDocumentSchema,
  showIdArgSchema,
  idArgSchema,
  setShowPublishedSchema,
  advanceRunnerStateSchema,
  applySavedVenueSchema,
  approveWaiverSchema,
} from '@/modules/shows/schemas';
import { patchShowJsonColumn } from '@/modules/shows/data/show-json-column';
import { assertUpdated } from '@/modules/shows/data/assert-updated';
import {
  VENDOR_SPACE_TEMPLATE,
  DASHBOARD_PATH,
  SHOWS_PATH,
  SCHEDULE_PATH,
  arenaLabelForRing,
} from '@/modules/shows/constants';
import { SHOW_DOCS_BUCKET } from '@/shared/constants/storage';
import { formatDateShort } from '@/shared/lib/format/date';
import { slugify } from '@/modules/shows/utils/slugify';
import type { StandardVendorSpaceRow } from '@/modules/shows/types';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

// Auto-generated at creation, never regenerated on rename (a show keeps
// its URL once created — don't break a link an organizer already shared).
// Collisions are rare (duplicate show names aren't common) but shows.name
// has no uniqueness constraint at all, so this guards against it rather
// than assuming it away.
async function generateUniqueShowSlug(supabase: SupabaseClient, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  for (let suffix = 2; suffix < 50; suffix++) {
    const { data, error } = await supabase
      .from('shows')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    candidate = `${base}-${String(suffix)}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

// generateUniqueShowSlug only checks-then-the-caller-inserts, so two
// near-simultaneous creates (a double-click on "+ New Show", or two people
// on the same org) can both see the same candidate slug free and both try to
// insert it, tripping shows_slug_unique_idx on the loser. Retrying with a
// fresh random suffix on exactly that conflict closes the race without
// needing a lock.
async function insertShowRetryingSlug(
  supabase: SupabaseClient,
  name: string,
  insertWithSlug: (slug: string) => PromiseLike<{ error: { message: string } | null }>,
): Promise<string> {
  let slug = await generateUniqueShowSlug(supabase, name);
  const base = slugify(name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await insertWithSlug(slug);
    if (!error) return slug;
    if (attempt === 4 || !error.message.includes('shows_slug_unique_idx')) {
      throw new Error(error.message);
    }
    slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  }
  throw new Error('Could not generate a unique show URL — please try again.');
}

// A class's arena is never typed in directly — it always mirrors the size
// configured for whichever ring/location it's assigned to (Venue screen),
// so every screen that reads class.arena (rider schedule, tickets,
// operations' ring display) shows real, meaningful info instead of
// whatever an organizer happened to type once.
async function resolveArenaForLocation(
  supabase: SupabaseClient,
  showId: string,
  location: string | null,
): Promise<string | null> {
  if (!location) return null;
  const { data, error } = await supabase
    .from('shows')
    .select('locations')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const rings = (data?.locations ?? []) as unknown as { name: string; size: string }[];
  return arenaLabelForRing(location, rings);
}

// Deleting a class cascades to its class_entries (and their scores / payment
// trail), so the "no entries" check and the delete run together in one
// transaction (delete_show_classes_if_unentered) — an entry added between a
// separate check and delete would otherwise be wiped. All-or-nothing: if any
// class has an entry, scratched ones included, nothing is deleted.
async function deleteClassesIfUnentered(
  supabase: SupabaseClient,
  showId: string,
  classIds: string[],
): Promise<{ deleted: number; blocked: number }> {
  if (classIds.length === 0) return { deleted: 0, blocked: 0 };
  const { data, error } = await supabase.rpc('delete_show_classes_if_unentered', {
    p_show_id: showId,
    p_class_ids: classIds,
  });
  if (error) throw new Error(error.message);
  const result = (data ?? {}) as { deleted?: number; blocked?: number };
  return { deleted: result.deleted ?? 0, blocked: result.blocked ?? 0 };
}

interface RingShape {
  name: string;
  size?: string;
}

function readRings(value: unknown): RingShape[] {
  return Array.isArray(value) ? (value as RingShape[]) : [];
}

// Rings edited in place on the Venue card keep their position, so a name that
// changed at the same index (and isn't just two rings swapping names) is a
// rename. Anything else that disappeared is a deleted ring.
function detectRingRenames(before: RingShape[], after: RingShape[]): Map<string, string> {
  const renames = new Map<string, string>();
  const beforeNames = new Set(before.map((r) => r.name));
  const afterNames = new Set(after.map((r) => r.name));
  before.forEach((ring, i) => {
    const next = after[i];
    if (!next || next.name === ring.name) return;
    if (afterNames.has(ring.name) || beforeNames.has(next.name)) return;
    renames.set(ring.name, next.name);
  });
  return renames;
}

// Classes point at their ring by name and mirror its size in `arena`. After
// the ring list changes, follow renames, clear rings that no longer exist,
// and refresh arena — so no class is left assigned to a ring that's gone.
async function syncClassesToRings(
  supabase: SupabaseClient,
  showId: string,
  rings: RingShape[],
  renames: Map<string, string>,
): Promise<void> {
  const ringSizes = rings.map((r) => ({ name: r.name, size: r.size ?? 'standard' }));
  const names = new Set(ringSizes.map((r) => r.name));

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, location, arena')
    .eq('show_id', showId)
    .not('location', 'is', null);
  if (error) throw new Error(error.message);

  const buckets = new Map<
    string,
    { location: string | null; arena: string | null; ids: string[] }
  >();
  for (const cls of classes) {
    const renamed = cls.location ? (renames.get(cls.location) ?? cls.location) : null;
    const location = renamed && names.has(renamed) ? renamed : null;
    const arena = arenaLabelForRing(location, ringSizes);
    if (location === cls.location && arena === cls.arena) continue;
    const key = JSON.stringify([location, arena]);
    const bucket = buckets.get(key) ?? { location, arena, ids: [] };
    bucket.ids.push(cls.id);
    buckets.set(key, bucket);
  }

  for (const { location, arena, ids } of buckets.values()) {
    const { data: updatedRows, error: updateError } = await supabase
      .from('classes')
      .update({ location, arena })
      .eq('show_id', showId)
      .in('id', ids)
      .select('id');
    if (updateError) throw new Error(updateError.message);
    assertUpdated(updatedRows, "You don't have permission to change these classes.");
  }
}

async function resolveOrgId(): Promise<string> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  const impersonated = await getImpersonatedOrgId();
  if (impersonated) return impersonated;

  if (profile.org_id) return profile.org_id;

  throw new Error(
    'Only an organization owner can create a show. Your access is scoped to specific shows.',
  );
}

export async function createShow(input: unknown): Promise<{ id: string; slug: string }> {
  const parsed = parseInput(createShowSchema, input);
  const orgId = await resolveOrgId();
  const supabase = await createServerClient();
  const id = crypto.randomUUID();

  const dateLabel =
    parsed.dateLabel ??
    (parsed.startDate === parsed.endDate
      ? formatDateShort(parsed.startDate)
      : `${formatDateShort(parsed.startDate)} – ${formatDateShort(parsed.endDate)}`);

  const slug = await insertShowRetryingSlug(supabase, parsed.name, (slug) =>
    supabase.from('shows').insert({
      id,
      org_id: orgId,
      name: parsed.name,
      slug,
      venue_name: parsed.venueName ?? null,
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      date_label: dateLabel,
      disciplines: parsed.disciplines,
      governing_bodies: parsed.governingBodies,
      show_type: parsed.showType,
      timezone: parsed.timezone ?? null,
      starting_rider_number: parsed.startingRiderNumber,

      published: false,
      status: 'yellow',
    }),
  );

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
  return { id, slug };
}

export async function createDraftShow(): Promise<{ id: string; slug: string }> {
  const orgId = await resolveOrgId();
  const supabase = await createServerClient();
  const id = crypto.randomUUID();

  const slug = await insertShowRetryingSlug(supabase, 'New Show', (slug) =>
    supabase.from('shows').insert({
      id,
      org_id: orgId,
      name: 'New Show',
      slug,
      published: false,
      status: 'yellow',
    }),
  );

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
  return { id, slug };
}

export async function createClass(input: unknown): Promise<void> {
  const parsed = parseInput(createClassSchema, input);
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
    if (error.code === '23505') {
      throw new Error(`This show already has a class called "${parsed.label}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
}

export async function createDivision(input: unknown): Promise<{ id: string }> {
  const parsed = parseInput(createDivisionSchema, input);
  const supabase = await createServerClient();

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

  revalidatePath(SHOWS_PATH);
  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  return { id: data.id };
}

export async function renameDivision(input: unknown): Promise<void> {
  const parsed = parseInput(renameDivisionSchema, input);
  const supabase = await createServerClient();

  const { data: division, error: readError } = await supabase
    .from('divisions')
    .select('show_id, name')
    .eq('id', parsed.divisionId)
    .single();
  if (readError) throw new Error(readError.message);
  if (division.name === parsed.name) return;

  // rename_division renames the row and re-points every class naming it in
  // one transaction (classes reference divisions by name, not id).
  const { error } = await supabase.rpc('rename_division', {
    division_id: parsed.divisionId,
    new_name: parsed.name,
  });
  if (error) {
    if (error.code === '23505' || error.message.includes('already has a division')) {
      throw new Error(`This show already has a division called "${parsed.name}".`);
    }
    throw new Error(error.message);
  }
  // SECURITY INVOKER: an RLS-blocked caller gets no error, just no change.
  const { data: after } = await supabase
    .from('divisions')
    .select('name')
    .eq('id', parsed.divisionId)
    .maybeSingle();
  if (after?.name !== parsed.name) {
    throw new UserFacingError("You don't have permission to rename this division.");
  }

  // A class also carries its division as the label's last " — " segment.
  // Best effort: a label that would collide with an existing one keeps its
  // old text rather than failing a rename that has already landed.
  const { data: classes, error: classReadError } = await supabase
    .from('classes')
    .select('id, label')
    .eq('show_id', division.show_id)
    .eq('division', parsed.name);
  if (classReadError) throw new Error(classReadError.message);

  const oldSuffix = ` — ${division.name}`;
  for (const cls of classes) {
    if (!cls.label.endsWith(oldSuffix)) continue;
    const label = `${cls.label.slice(0, -oldSuffix.length)} — ${parsed.name}`;
    const { error: labelError } = await supabase
      .from('classes')
      .update({ label })
      .eq('id', cls.id)
      .eq('show_id', division.show_id);
    if (labelError && labelError.code !== '23505') throw new Error(labelError.message);
  }

  revalidatePath(`/dashboard/shows/${division.show_id}`);
  revalidatePath(`/dashboard/shows/${division.show_id}/select-events`);
  revalidatePath(`/dashboard/shows/${division.show_id}/schedule`);
}

export async function updateDivisionDefaultFee(input: unknown): Promise<void> {
  const parsed = parseInput(updateDivisionDefaultFeeSchema, input);
  const supabase = await createServerClient();

  const { data: division, error: readError } = await supabase
    .from('divisions')
    .select('show_id')
    .eq('id', parsed.divisionId)
    .single();
  if (readError) throw new Error(readError.message);

  const { data: updatedRows, error } = await supabase
    .from('divisions')
    .update({ default_fee: parsed.defaultFee })
    .eq('id', parsed.divisionId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to change this division.");

  revalidatePath(`/dashboard/shows/${division.show_id}`);
  revalidatePath(`/dashboard/shows/${division.show_id}/select-events`);
  revalidatePath(`/dashboard/shows/${division.show_id}/test-builder`);
}

export async function deleteDivision(rawDivisionId: string): Promise<void> {
  const { id: divisionId } = parseInput(idArgSchema, { id: rawDivisionId });
  const supabase = await createServerClient();

  const { data: division, error: readError } = await supabase
    .from('divisions')
    .select('show_id')
    .eq('id', divisionId)
    .single();
  if (readError) throw new Error(readError.message);

  // delete_division clears the name off every class that used it and removes
  // the row in one transaction, so no class is left naming a missing division.
  const { error } = await supabase.rpc('delete_division', { division_id: divisionId });
  if (error) throw new Error(error.message);
  const { data: stillThere } = await supabase
    .from('divisions')
    .select('id')
    .eq('id', divisionId)
    .maybeSingle();
  if (stillThere) throw new UserFacingError("You don't have permission to remove this division.");

  revalidatePath(`/dashboard/shows/${division.show_id}`);
  revalidatePath(`/dashboard/shows/${division.show_id}/select-events`);
}

export async function createAddOn(input: unknown): Promise<{ id: string }> {
  const parsed = parseInput(createAddOnSchema, input);
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

export async function setShowPublished(rawShowId: string, rawPublished: boolean): Promise<void> {
  const { showId, published } = parseInput(setShowPublishedSchema, {
    showId: rawShowId,
    published: rawPublished,
  });
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
          : 'The waiver of liability must be approved before this show can go live.',
      );
    }
  }

  const { data: updated, error } = await supabase
    .from('shows')
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to publish this show.");

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
}

export async function advanceRunnerState(
  rawShowId: string,
  rawPatch: { ticketClosed?: boolean; approved?: boolean },
): Promise<void> {
  // .strict(): only the two known flags may ever land in runner_state.
  const { showId, patch } = parseInput(advanceRunnerStateSchema, {
    showId: rawShowId,
    patch: rawPatch,
  });
  const supabase = await createServerClient();

  await patchShowJsonColumn(supabase, showId, 'runner_state', (current) => ({
    ...current,
    ...patch,
  }));

  revalidatePath(`/dashboard/shows/${showId}/run-show`);
  revalidatePath(`/dashboard/shows/${showId}/schedule`);
  revalidatePath(SCHEDULE_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function updateShowDetails(input: unknown): Promise<void> {
  const parsed = parseInput(updateShowDetailsSchema, input);
  const supabase = await createServerClient();

  await patchShowJsonColumn(
    supabase,
    parsed.showId,
    'show_details',
    (current) => ({ ...current, org: parsed.org ?? '' }),
    {
      name: parsed.name,
      show_type: parsed.showType,

      start_date: parsed.startDate || null,
      end_date: parsed.endDate || null,
      timezone: parsed.timezone ?? null,
      starting_rider_number: parsed.startingRiderNumber,
      governing_bodies: parsed.governingBodies,
    },
  );

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function updateShowLocations(input: unknown): Promise<void> {
  const parsed = parseInput(updateShowLocationsSchema, input);
  const supabase = await createServerClient();

  const { data: current, error: readError } = await supabase
    .from('shows')
    .select('locations')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);

  const { data: updated, error } = await supabase
    .from('shows')
    .update({ locations: parsed.locations })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to change this show's rings.");

  await syncClassesToRings(
    supabase,
    parsed.showId,
    parsed.locations,
    detectRingRenames(readRings(current.locations), parsed.locations),
  );

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidateSchedule(parsed.showId);
}

export async function applySavedVenue(rawShowId: string, rawVenueId: string): Promise<void> {
  const { showId, venueId } = parseInput(applySavedVenueSchema, {
    showId: rawShowId,
    venueId: rawVenueId,
  });
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

  const locations = rings.map((r) => ({ name: r.name, size: r.size ?? 'standard' }));
  const { data: updated, error } = await supabase
    .from('shows')
    .update({
      venue_id: venue.id,
      venue_name: venue.name,
      locations,
    })
    .eq('id', showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to change this show's venue.");

  // A venue swap replaces the ring list wholesale — no renames to follow.
  await syncClassesToRings(supabase, showId, locations, new Map());

  revalidatePath(`/dashboard/shows/${showId}`);
}

export async function updateSchedulePrefs(input: unknown): Promise<void> {
  const parsed = parseInput(updateSchedulePrefsSchema, input);
  const supabase = await createServerClient();

  await patchShowJsonColumn(
    supabase,
    parsed.showId,
    'schedule_prefs',
    (current) => ({
      ...current,
      perMin: parsed.perMin,
      buffer: parsed.buffer,
      upper: parsed.upper,
      end: parsed.end,
      order: parsed.order,
      warmup: parsed.warmup,
      lunch: parsed.lunch,
      extraBreaks: parsed.extraBreaks,
      extraBreakMin: parsed.extraBreakMin,
    }),
    {
      day_start_times: parsed.dayStartTimes,
      day_end_times: parsed.dayEndTimes,
    },
  );

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

/* Deleting a show is split by role, which is the rule the legacy handler
 * documented but could not implement (api/shows/[id].js: "§3d.1 asks for a
 * real permission split here ... that can't be built honestly yet" — there was
 * only ever one real login, so its SuperAdmin check made the organizer branch
 * unreachable). Real per-org accounts exist now, so the split is real:
 *
 *   Organizer / ShowAdmin — only while the show is still in setup and has no
 *     orders on it. Once tickets or entries exist, that money and those
 *     records are not theirs to erase.
 *   SuperAdmin — always, at any stage. This is the platform's escalation path:
 *     the error an organizer sees below tells them to ask for exactly this.
 *
 * Either way the delete cascades to the show's divisions, classes, staff,
 * vendors and documents; nothing is soft-deleted.
 */
export async function deleteShow(rawShowId: string): Promise<void> {
  const { showId } = parseInput(showIdArgSchema, { showId: rawShowId });
  const supabase = await createServerClient();

  const profile = await getStaffProfile();
  const isSuperAdmin = profile?.platform_role === 'SuperAdmin';

  if (!isSuperAdmin) {
    const stage = await getShowStage(showId);
    if (stage !== 'setup') {
      throw new Error('This show has already opened for entries — ask a Super Admin to delete it.');
    }

    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('show_id', showId);
    if (orderError) throw new Error(orderError.message);
    if ((orderCount ?? 0) > 0) {
      throw new Error('This show has orders on it — ask a Super Admin to delete it.');
    }
  }

  const { data: deleted, error } = await supabase
    .from('shows')
    .delete()
    .eq('id', showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(deleted, "You don't have permission to delete this show.");

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
}

export async function updateContact(input: unknown): Promise<void> {
  const parsed = parseInput(updateContactSchema, input);
  const supabase = await createServerClient();

  await patchShowJsonColumn(supabase, parsed.showId, 'show_details', (current) => ({
    ...current,
    website: parsed.website ?? '',
    phone: parsed.phone ?? '',
    contactEmail: parsed.contactEmail ?? '',
  }));

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function updatePrizeList(input: unknown): Promise<void> {
  const parsed = parseInput(updatePrizeListSchema, input);
  const supabase = await createServerClient();

  await patchShowJsonColumn(supabase, parsed.showId, 'show_details', (current) => ({
    ...current,
    prizeListUrl: parsed.prizeListUrl ?? '',
  }));

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function updateDocumentRequirements(input: unknown): Promise<void> {
  const parsed = parseInput(updateDocumentRequirementsSchema, input);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update({ document_requirements: parsed.requirements })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to edit this show.");

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function updateMerchandise(input: unknown): Promise<void> {
  const parsed = parseInput(updateMerchandiseSchema, input);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update({ merchandise_enabled: parsed.enabled, merch_items: parsed.items })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to edit this show.");

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function saveWaiverText(input: unknown): Promise<void> {
  const parsed = parseInput(saveWaiverTextSchema, input);
  const supabase = await createServerClient();

  const { data: updated, error } = await supabase
    .from('shows')
    .update({ waiver_text: parsed.waiverText })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to edit this waiver.");

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function approveWaiver(rawShowId: string, rawWaiverText: string): Promise<void> {
  const { showId, waiverText } = parseInput(approveWaiverSchema, {
    showId: rawShowId,
    waiverText: rawWaiverText,
  });
  const supabase = await createServerClient();

  const { data: updated, error } = await supabase
    .from('shows')
    .update({ waiver_approved_text: waiverText, waiver_approved_at: new Date().toISOString() })
    .eq('id', showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to approve this waiver.");

  revalidatePath(`/dashboard/shows/${showId}`);
}

export async function createWaiverDocumentUploadUrl(
  input: unknown,
): Promise<{ path: string; token: string }> {
  const parsed = parseInput(createWaiverDocumentUploadUrlSchema, input);
  const supabase = await createServerClient();

  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/waiver-${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage.from(SHOW_DOCS_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path: data.path, token: data.token };
}

/* pdf-parse/mammoth are dynamically imported here rather than at module
 * top-level. This file is a 'use server' actions module imported by hooks
 * across most of the organizer dashboard (stables, schedule, catalog,
 * setup, ...), so a static import bundled pdfjs-dist's module-eval-time
 * canvas/DOMMatrix polyfilling into a shared server chunk loaded on nearly
 * every request — including ones with nothing to do with waivers — and it
 * crashed outright in the Vercel serverless runtime, which doesn't have
 * @napi-rs/canvas's native binary available. Loading it lazily, only when a
 * waiver document is actually being uploaded, keeps that fragile code out
 * of every other route's module graph entirely. */
async function extractPdfText(bytes: ArrayBuffer): Promise<string | null> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(bytes: ArrayBuffer): Promise<string | null> {
  const { extractRawText } = await import('mammoth');
  const result = await extractRawText({ buffer: Buffer.from(bytes) });
  return result.value.trim();
}

/* PDF, Word (.docx), and plain text only — an image would need OCR, out of
 * scope. A parse failure (encrypted/corrupt PDF, a scanned document with no
 * text layer, an unsupported extension) degrades to no extracted text
 * rather than failing the upload — the file still attaches and the
 * organizer can type the waiver text themselves. */
async function extractDocumentText(bytes: ArrayBuffer, name: string): Promise<string | null> {
  const lower = name.toLowerCase();
  try {
    let text: string | null = null;
    if (lower.endsWith('.pdf')) text = await extractPdfText(bytes);
    else if (lower.endsWith('.docx')) text = await extractDocxText(bytes);
    else if (lower.endsWith('.txt')) text = new TextDecoder().decode(bytes).trim();

    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

export async function registerWaiverDocument(
  input: unknown,
): Promise<{ extractedText: string | null }> {
  const parsed = parseInput(registerWaiverDocumentSchema, input);
  const supabase = await createServerClient();

  const { data: existing } = await supabase
    .from('shows')
    .select('waiver_document_path')
    .eq('id', parsed.showId)
    .single();

  const { data: downloaded, error: downloadError } = await supabase.storage
    .from(SHOW_DOCS_BUCKET)
    .download(parsed.path);
  const extractedText = downloadError
    ? null
    : await extractDocumentText(await downloaded.arrayBuffer(), parsed.name);

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update({
      waiver_document_path: parsed.path,
      waiver_document_name: parsed.name,
      ...(extractedText !== null ? { waiver_text: extractedText } : {}),
    })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to edit this waiver.");

  if (existing?.waiver_document_path) {
    await supabase.storage.from(SHOW_DOCS_BUCKET).remove([existing.waiver_document_path]);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  return { extractedText };
}

export async function removeWaiverDocument(input: unknown): Promise<void> {
  const parsed = parseInput(removeWaiverDocumentSchema, input);
  const supabase = await createServerClient();

  const { data: existing, error: readError } = await supabase
    .from('shows')
    .select('waiver_document_path')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update({ waiver_document_path: null, waiver_document_name: null })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to edit this waiver.");

  if (existing.waiver_document_path) {
    await supabase.storage.from(SHOW_DOCS_BUCKET).remove([existing.waiver_document_path]);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
}

export async function updateTicketWindow(input: unknown): Promise<void> {
  const parsed = parseInput(updateTicketWindowSchema, input);
  const supabase = await createServerClient();

  const close = parsed.ticketCloseDate
    ? `${parsed.ticketCloseDate}${parsed.ticketCloseTime ? ` ${parsed.ticketCloseTime}` : ''}`
    : '';

  const { data: updated, error } = await supabase
    .from('shows')
    .update({ ticket_open: parsed.ticketOpen, ticket_close: close })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to change this show's ticket window.");

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(DASHBOARD_PATH);
}

export async function addCatalogGroup(input: unknown): Promise<{ added: number }> {
  const parsed = parseInput(addCatalogGroupSchema, input);
  const supabase = await createServerClient();

  const division = parsed.division ?? parsed.group;
  const label = (test: string) =>
    parsed.division
      ? `${parsed.group} — ${test} — ${parsed.division}`
      : `${parsed.group} — ${test}`;

  const location = parsed.location || null;
  const arena = await resolveArenaForLocation(supabase, parsed.showId, location);

  const rows = parsed.tests.map((test) => ({
    show_id: parsed.showId,
    label: label(test),
    event: parsed.category,
    group_name: parsed.group,
    division,
    location,
    arena,
    fee: parsed.fee,

    award_scope: 'group' as const,
  }));

  const { data, error } = await supabase
    .from('classes')
    .upsert(rows, { onConflict: 'show_id,label', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
  return { added: data.length };
}

export async function removeCatalogGroup(input: unknown): Promise<void> {
  const parsed = parseInput(addCatalogGroupSchema.pick({ showId: true, group: true }), input);
  const supabase = await createServerClient();

  // Deleting a class cascades to its class_entries and their scores, so a
  // level riders have already entered (and paid for) must never be wiped by
  // unticking it — refuse and tell the organizer what to do instead.
  const { data: groupClasses, error: readError } = await supabase
    .from('classes')
    .select('id')
    .eq('show_id', parsed.showId)
    .eq('group_name', parsed.group);
  if (readError) throw new Error(readError.message);
  const classIds = groupClasses.map((c) => c.id);
  if (classIds.length === 0) return;

  const { blocked: enteredClassCount } = await deleteClassesIfUnentered(
    supabase,
    parsed.showId,
    classIds,
  );
  if (enteredClassCount > 0) {
    throw new UserFacingError(
      `${String(enteredClassCount)} ${enteredClassCount === 1 ? 'class' : 'classes'} in ${parsed.group} ${enteredClassCount === 1 ? 'has' : 'have'} entries (scratched entries count too) — move them to another class first.`,
    );
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
}

export async function updateGroupLocation(input: unknown): Promise<void> {
  const parsed = parseInput(updateGroupLocationSchema, input);
  const supabase = await createServerClient();

  const location = parsed.location || null;
  const arena = await resolveArenaForLocation(supabase, parsed.showId, location);

  const { data: updatedRows, error } = await supabase
    .from('classes')
    .update({ location, arena })
    .eq('show_id', parsed.showId)
    .eq('group_name', parsed.group)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to change these classes.");

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(SCHEDULE_PATH);
}

export async function updateGroupDivision(input: unknown): Promise<void> {
  const parsed = parseInput(updateGroupDivisionSchema, input);
  const supabase = await createServerClient();

  const division = parsed.division || null;

  const { data: updatedRows, error } = await supabase
    .from('classes')
    .update({ division })
    .eq('show_id', parsed.showId)
    .eq('group_name', parsed.group)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to change these classes.");

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(`/dashboard/shows/${parsed.showId}/test-builder`);
}

export async function addCustomClass(input: unknown): Promise<void> {
  const parsed = parseInput(addCustomClassSchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('classes').insert({
    show_id: parsed.showId,
    label: parsed.name,
    division: parsed.division ?? null,
    fee: parsed.fee,
    sponsor: parsed.sponsor?.trim() ?? null,
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
  revalidatePath(SHOWS_PATH);
}

export async function createTocClass(input: unknown): Promise<void> {
  const parsed = parseInput(createTocClassSchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('classes').insert({
    show_id: parsed.showId,

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
  revalidatePath(SHOWS_PATH);
}

export async function addQualTypePreset(input: unknown): Promise<void> {
  const parsed = parseInput(addQualTypePresetSchema, input);
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

export async function updateAddOn(input: unknown): Promise<void> {
  const parsed = parseInput(updateAddOnSchema, input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('add_ons')
    .update({
      name: parsed.name,
      price: parsed.price,
      stalls: parsed.stalls,
      tack: parsed.tack,
    })
    .eq('id', parsed.id)
    .select('show_id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${data.show_id}/rider-entries`);
}

export async function deleteAddOn(rawId: string): Promise<void> {
  const { id } = parseInput(idArgSchema, { id: rawId });
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
  const parsed = parseInput(createVendorItemSchema, input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('vendor_items')
    .insert({
      show_id: parsed.showId,
      name: parsed.name,
      price: parsed.price,
      qty: parsed.qty,
      enabled: true,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);
  return { id: data.id };
}

export async function updateVendorItem(input: unknown): Promise<void> {
  const parsed = parseInput(updateVendorItemSchema, input);
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

export async function deleteVendorItem(rawId: string): Promise<void> {
  const { id } = parseInput(idArgSchema, { id: rawId });
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

export async function loadStandardVendorSpaces(
  rawShowId: string,
): Promise<StandardVendorSpaceRow[]> {
  const { showId } = parseInput(showIdArgSchema, { showId: rawShowId });
  const supabase = await createServerClient();

  const { data: existing, error: readError } = await supabase
    .from('vendor_items')
    .select('name')
    .eq('show_id', showId);
  if (readError) throw new Error(readError.message);

  const existingNames = new Set(existing.map((v) => v.name.trim().toLowerCase()));
  const rows = VENDOR_SPACE_TEMPLATE.filter(
    (tpl) => !existingNames.has(tpl.name.toLowerCase()),
  ).map((tpl) => ({ show_id: showId, name: tpl.name, price: tpl.price, enabled: true, qty: null }));
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('vendor_items')
    .insert(rows)
    .select('id, name, price, qty');
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${showId}/rider-entries`);
  return data.map((v) => ({ id: v.id, name: v.name, price: v.price ?? 0, qty: v.qty }));
}

export async function createQualType(input: unknown): Promise<{ id: string }> {
  const parsed = parseInput(createQualTypeSchema, input);
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
  const parsed = parseInput(updateCatalogItemSchema, input);
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

export async function deleteQualType(rawId: string): Promise<void> {
  const { id } = parseInput(idArgSchema, { id: rawId });
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

export async function uploadShowBranding(input: unknown): Promise<void> {
  const parsed = parseInput(uploadShowBrandingSchema, input);
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

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update(column === 'logo_path' ? { logo_path: path } : { show_image_path: path })
    .eq('id', parsed.showId)
    .select('id');
  if (error || updatedRows.length === 0) {
    // Don't leave an orphaned file behind a write that didn't land.
    await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
    throw new UserFacingError("You don't have permission to edit this show.");
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);
}

export async function uploadVendorMap(input: unknown): Promise<{ url: string | null }> {
  const parsed = parseInput(uploadVendorMapSchema, input);
  const supabase = await createServerClient();

  const bytes = Buffer.from(parsed.dataBase64, 'base64');
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('vendor-maps').upload(path, bytes, {
    contentType: parsed.contentType ?? 'application/pdf',
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update({ vendor_map_path: path, vendor_map_url: null })
    .eq('id', parsed.showId)
    .select('id');
  if (error || updatedRows.length === 0) {
    // Don't leave an orphaned file behind a write that didn't land.
    await supabase.storage.from('vendor-maps').remove([path]);
    if (error) throw new Error(error.message);
    throw new UserFacingError("You don't have permission to edit this show.");
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);

  const { data } = await supabase.storage.from('vendor-maps').createSignedUrl(path, 3600);
  return { url: data?.signedUrl ?? null };
}

export async function removeVendorMap(rawShowId: string): Promise<void> {
  const { showId } = parseInput(showIdArgSchema, { showId: rawShowId });
  const supabase = await createServerClient();

  const { data: show, error: readError } = await supabase
    .from('shows')
    .select('vendor_map_path')
    .eq('id', showId)
    .single();
  if (readError) throw new Error(readError.message);

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update({ vendor_map_path: null, vendor_map_url: null })
    .eq('id', showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to edit this show.");

  if (show.vendor_map_path) {
    await supabase.storage.from('vendor-maps').remove([show.vendor_map_path]);
  }

  revalidatePath(`/dashboard/shows/${showId}/rider-entries`);
}

export async function updateClassReview(input: unknown): Promise<void> {
  const parsed = parseInput(updateClassReviewSchema, input);
  const supabase = await createServerClient();

  const patch = {
    ...(parsed.location !== undefined
      ? {
          location: parsed.location,
          arena: await resolveArenaForLocation(supabase, parsed.showId, parsed.location),
        }
      : {}),
    ...(parsed.judgesCount !== undefined ? { judges_count: parsed.judgesCount } : {}),
    ...(parsed.fee !== undefined ? { fee: parsed.fee } : {}),
    ...(parsed.sponsor !== undefined ? { sponsor: parsed.sponsor } : {}),
  };

  const { data: updated, error } = await supabase
    .from('classes')
    .update(patch)
    .eq('id', parsed.classId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to change this class.");

  revalidatePath(`/dashboard/shows/${parsed.showId}/schedule`);
}

export async function reorderClasses(input: unknown): Promise<void> {
  const parsed = parseInput(reorderClassesSchema, input);
  const supabase = await createServerClient();

  // Persist the manual running order as sequential run_order values (0-based).
  const results = await Promise.all(
    parsed.orderedClassIds.map((id, index) =>
      supabase
        .from('classes')
        .update({ run_order: index })
        .eq('id', id)
        .eq('show_id', parsed.showId)
        .select('id'),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  if (results.some((r) => !r.data || r.data.length === 0)) {
    throw new UserFacingError("You don't have permission to reorder these classes.");
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  revalidatePath(`/dashboard/shows/${parsed.showId}/schedule`);
}

export async function removeClass(input: unknown): Promise<void> {
  const parsed = parseInput(removeClassSchema, input);
  const supabase = await createServerClient();

  // Scoped to the show in the URL, so a class id from another show can't be
  // removed through this one.
  const { blocked } = await deleteClassesIfUnentered(supabase, parsed.showId, [parsed.classId]);
  if (blocked > 0) {
    throw new UserFacingError(
      'This class has entries on it (scratched entries count too) and can no longer be removed.',
    );
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/schedule`);
  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
}

export async function removeShowDocument(input: unknown): Promise<void> {
  const parsed = parseInput(removeShowDocumentSchema, input);
  const supabase = await createServerClient();

  const { data: doc, error: readError } = await supabase
    .from('documents')
    .select('path')
    .eq('id', parsed.id)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from('documents').delete().eq('id', parsed.id);
  if (error) throw new Error(error.message);

  await supabase.storage.from(SHOW_DOCS_BUCKET).remove([doc.path]);

  revalidatePath(`/dashboard/shows/${parsed.showId}/documents`);
  revalidatePath('/dashboard/documents/resources');
}

export async function updateDocumentEvents(input: unknown): Promise<void> {
  const parsed = parseInput(updateDocumentEventsSchema, input);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('documents')
    .update({ event_ids: parsed.eventIds })
    .eq('id', parsed.id)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to change this document.");

  revalidatePath(`/dashboard/shows/${parsed.showId}/documents`);
}

export async function saveTestTemplate(input: unknown): Promise<{ id: string }> {
  const parsed = parseInput(saveTestTemplateSchema, input);
  const supabase = await createServerClient();

  // Keep the legacy movements/collectives columns in sync from the structured
  // sections when the new editor supplied them, so the current judge scoring
  // path (class_tests, filled by assignTestTemplateToClass) keeps working
  // unchanged. When no sections are sent (old editor), what it sent wins.
  let movements = parsed.movements;
  let collectives = parsed.collectives;
  if (parsed.sections.length > 0) {
    const m: { num: number; text: string; coef: number; section: string }[] = [];
    const c: { key: string; label: string; coef: number; section: string }[] = [];
    let n = 1;
    for (const section of parsed.sections) {
      const isCollective = section.type === 'collective' || /collective/i.test(section.name);
      for (const item of section.items) {
        if (isCollective) {
          const slug =
            (item.label || `mark-${String(c.length + 1)}`)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || `mark-${String(c.length + 1)}`;
          c.push({
            key: slug,
            label: item.label || 'Mark',
            coef: item.coef,
            section: section.name,
          });
        } else {
          const instr = item.instructions
            .map((i) => [i.marker, i.instruction].filter(Boolean).join(' — '))
            .filter(Boolean)
            .join('; ');
          m.push({
            num: n,
            text: instr || item.label || `Movement ${String(n)}`,
            coef: item.coef,
            section: section.name,
          });
          n += 1;
        }
      }
    }
    movements = m;
    collectives = c;
  }

  const fields = {
    name: parsed.name,
    level: parsed.level ?? null,
    movements,
    collectives,
    discipline: parsed.discipline ?? null,
    sheet_type: parsed.sheetType ?? null,
    governing_body: parsed.governingBody ?? null,
    version_year: parsed.versionYear ?? null,
    arena_size: parsed.arenaSize ?? null,
    ride_time: parsed.rideTime ?? null,
    scoring_method: parsed.scoringMethod ?? null,
    max_points: parsed.maxPoints ?? null,
    sections: parsed.sections,
    penalties: parsed.penalties,
    scoring_config: parsed.scoringConfig ?? null,
  };

  if (parsed.id) {
    const { data, error } = await supabase
      .from('test_templates')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', parsed.id)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    // A template is reusable across every show in the org, so the page that
    // needs a fresh list isn't knowable from here by a single showId --
    // revalidate the whole dynamic route instead of one instance of it.
    // Without this, the save/delete succeeds in the database but the list
    // and "tests offered" count silently keep showing stale, pre-change
    // data after a refresh (this was reported as tests "disappearing" --
    // they never actually left the database, the page just never re-fetched).
    revalidatePath('/dashboard/shows/[showId]/test-builder', 'page');
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from('test_templates')
    .insert({ org_id: parsed.orgId, source_label: parsed.sourceLabel ?? null, ...fields })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/shows/[showId]/test-builder', 'page');
  return { id: data.id };
}

export async function deleteTestTemplate(rawId: string): Promise<void> {
  const { id } = parseInput(idArgSchema, { id: rawId });
  const supabase = await createServerClient();
  const { error } = await supabase.from('test_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/shows/[showId]/test-builder', 'page');
}

export async function assignTestTemplateToClass(input: unknown): Promise<void> {
  const parsed = parseInput(assignTestTemplateToClassSchema, input);
  const supabase = await createServerClient();

  const { data: template, error: templateError } = await supabase
    .from('test_templates')
    .select('name, movements, collectives, sections, version_year')
    .eq('id', parsed.templateId)
    .single();
  if (templateError) throw new Error(templateError.message);

  const { error } = await supabase.from('class_tests').upsert(
    {
      class_id: parsed.classId,
      test_template_id: parsed.templateId,
      name: template.name,
      edition: template.version_year,
      movements: template.movements,
      collectives: template.collectives,
      sections: template.sections,
    },
    { onConflict: 'class_id' },
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);

  const { data: cls } = await supabase
    .from('classes')
    .select('show_id')
    .eq('id', parsed.classId)
    .maybeSingle();
  if (cls?.show_id) revalidatePath(`/dashboard/shows/${cls.show_id}/test-builder`);
}

// The only way to change which test a class uses was to assign a
// different one over it -- fine if you know which test you meant, but
// there was no way to just detach a wrong one and leave the class
// unassigned again.
export async function unassignTestFromClass(input: unknown): Promise<void> {
  const parsed = parseInput(unassignTestFromClassSchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('class_tests').delete().eq('class_id', parsed.classId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);

  const { data: cls } = await supabase
    .from('classes')
    .select('show_id')
    .eq('id', parsed.classId)
    .maybeSingle();
  if (cls?.show_id) revalidatePath(`/dashboard/shows/${cls.show_id}/test-builder`);
}

export async function saveShowExpenses(input: unknown): Promise<void> {
  const parsed = parseInput(saveShowExpensesSchema, input);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('shows')
    .update({ expenses: parsed.expenses })
    .eq('id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to edit this show.");

  revalidatePath('/dashboard/billing');
}

export async function createDocumentUploadUrl(
  input: unknown,
): Promise<{ path: string; token: string }> {
  const parsed = parseInput(createDocumentUploadUrlSchema, input);
  const supabase = await createServerClient();

  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage.from(SHOW_DOCS_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path: data.path, token: data.token };
}

export async function registerShowDocument(input: unknown): Promise<{ id: string }> {
  const parsed = parseInput(registerShowDocumentSchema, input);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('documents')
    .insert({ show_id: parsed.showId, name: parsed.name, path: parsed.path })
    .select('id')
    .single();
  if (error) {
    await supabase.storage.from(SHOW_DOCS_BUCKET).remove([parsed.path]);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/documents`);
  revalidatePath('/dashboard/documents/resources');
  return { id: data.id };
}

function revalidateSchedule(showId: string): void {
  revalidatePath(SCHEDULE_PATH);
  revalidatePath(`/dashboard/shows/${showId}/schedule`);
}

export async function updateScheduleRules(input: unknown): Promise<void> {
  const parsed = parseInput(updateScheduleRulesSchema, input);
  const supabase = await createServerClient();

  await patchShowJsonColumn(supabase, parsed.showId, 'schedule_prefs', (current) => {
    const next = { ...current };
    if (parsed.hardRuleEnabled !== undefined) next.hardRuleEnabled = parsed.hardRuleEnabled;
    if (parsed.hardRuleSameHorseMin !== undefined) {
      next.hardRuleSameHorseMin = parsed.hardRuleSameHorseMin;
    }
    if (parsed.hardRuleDiffHorseMin !== undefined) {
      next.hardRuleDiffHorseMin = parsed.hardRuleDiffHorseMin;
    }
    if (parsed.awardsByDivision !== undefined) next.awardsByDivision = parsed.awardsByDivision;
    return next;
  });

  revalidateSchedule(parsed.showId);
}

export async function setClassDuration(input: unknown): Promise<void> {
  const parsed = parseInput(setClassDurationSchema, input);
  const supabase = await createServerClient();

  const { data: updated, error } = await supabase
    .from('classes')
    .update({ min_per_ride: parsed.minutes, schedule_updated_at: new Date().toISOString() })
    .eq('id', parsed.classId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updated, "You don't have permission to change this class.");

  revalidateSchedule(parsed.showId);
}

export async function moveClassToRingDay(input: unknown): Promise<void> {
  const parsed = parseInput(moveClassToRingDaySchema, input);
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('start_date')
    .eq('id', parsed.showId)
    .single();
  if (showError) throw new Error(showError.message);

  let date: string | null = null;
  if (show.start_date) {
    const start = new Date(`${show.start_date}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() + parsed.day);
    date = start.toISOString().slice(0, 10);
  }

  // Keep class.arena mirroring the ring it now sits in, same as every other
  // path that changes a class's location.
  const arena = await resolveArenaForLocation(supabase, parsed.showId, parsed.ring);

  const { data: moved, error } = await supabase
    .from('classes')
    .update({
      location: parsed.ring,
      arena,
      date,
      schedule_updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.classId)
    .eq('show_id', parsed.showId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(moved, 'That class could not be moved.');

  revalidateSchedule(parsed.showId);
}

export async function scratchEntry(input: unknown): Promise<void> {
  const parsed = parseInput(scratchEntrySchema, input);
  const supabase = await createServerClient();

  const { data: scratched, error } = await supabase
    .from('class_entries')
    .update({ status: 'scratched', updated_at: new Date().toISOString() })
    .eq('id', parsed.entryId)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(scratched, "You don't have permission to scratch this entry.");

  revalidateSchedule(parsed.showId);
}

export async function reorderRide(input: unknown): Promise<void> {
  const parsed = parseInput(reorderRideSchema, input);
  const supabase = await createServerClient();

  const { data: entries, error: readError } = await supabase
    .from('class_entries')
    .select('id, ride_order')
    .eq('class_id', parsed.classId)
    .order('ride_order');
  if (readError) throw new Error(readError.message);

  const ids = entries.map((e) => e.id).filter((id) => id !== parsed.entryId);
  const target = Math.max(0, Math.min(parsed.toIndex, ids.length));
  ids.splice(target, 0, parsed.entryId);

  // ride_order has no unique index, so there's no need for the old
  // park-at-10000-then-renumber double pass: write only the rows whose
  // position actually changed, in parallel.
  const currentOrder = new Map(entries.map((e) => [e.id, e.ride_order]));
  const now = new Date().toISOString();
  const changed = ids
    .map((id, index) => ({ id, rideOrder: index + 1 }))
    .filter(({ id, rideOrder }) => currentOrder.get(id) !== rideOrder);
  const results = await Promise.all(
    changed.map(({ id, rideOrder }) =>
      supabase
        .from('class_entries')
        .update({ ride_order: rideOrder, updated_at: now })
        .eq('id', id)
        .eq('class_id', parsed.classId)
        .select('id'),
    ),
  );
  for (const { data, error } of results) {
    if (error) throw new Error(error.message);
    assertUpdated(data, "You don't have permission to change this running order.");
  }

  revalidateSchedule(parsed.showId);
}

// ── Select Events: per-test controls ─────────────────────────────────────
// The Offered classes table shows one row per test; each of the test's
// classes is that test in one division. These act on a test's class ids,
// always re-scoped to the show so a forged id can't reach another show's
// classes, and never delete a class riders have already entered.

function revalidateSelectEvents(showId: string) {
  revalidatePath(`/dashboard/shows/${showId}/select-events`);
  revalidatePath(`/dashboard/shows/${showId}/schedule`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
}

async function entryCountFor(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  classIds: string[],
): Promise<number> {
  const { count, error } = await supabase
    .from('class_entries')
    .select('id', { count: 'exact', head: true })
    .in('class_id', classIds);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function labelFor(group: string | null, test: string, division: string | null): string {
  const base = group ? `${group} — ${test}` : test;
  return division ? `${base} — ${division}` : base;
}

export async function setTestDivision(input: unknown): Promise<void> {
  const parsed = parseInput(setTestDivisionSchema, input);
  const supabase = await createServerClient();

  const [{ data: rows, error }, { data: divisions, error: divError }] = await Promise.all([
    supabase
      .from('classes')
      .select(
        'id, label, division, group_name, event, location, arena, fee, award_scope, qualifying, qual_types, score_format, catalog_id, governing_body',
      )
      .eq('show_id', parsed.showId)
      .in('id', parsed.classIds),
    supabase.from('divisions').select('name').eq('show_id', parsed.showId),
  ]);
  if (error) throw new Error(error.message);
  if (divError) throw new Error(divError.message);
  const first = rows[0];
  if (!first) throw new Error('That test is no longer offered.');

  const showDivisions = new Set(divisions.map((d) => d.name));
  const parts = first.label.split(' — ');
  const test =
    first.group_name && parts[0] === first.group_name && parts[1] ? parts[1] : (parts[0] ?? '');
  const inDivision = rows.find((r) => r.division === parsed.division);
  const unassigned = rows.find((r) => !r.division || !showDivisions.has(r.division));

  if (parsed.on) {
    if (inDivision) return;
    // A test added without a division holds one "unassigned" class — the
    // first division picked claims it rather than leaving it orphaned.
    if (unassigned && (await entryCountFor(supabase, [unassigned.id])) === 0) {
      const { data: updatedRows, error: updError } = await supabase
        .from('classes')
        .update({
          division: parsed.division,
          label: labelFor(first.group_name, test, parsed.division),
        })
        .eq('id', unassigned.id)
        .eq('show_id', parsed.showId)
        .select('id');
      if (updError) throw new Error(updError.message);
      assertUpdated(updatedRows, "You don't have permission to change these classes.");
    } else {
      const { error: insError } = await supabase.from('classes').upsert(
        {
          show_id: parsed.showId,
          label: labelFor(first.group_name, test, parsed.division),
          division: parsed.division,
          group_name: first.group_name,
          event: first.event,
          location: first.location,
          arena: first.arena,
          fee: first.fee,
          award_scope: first.award_scope,
          qualifying: first.qualifying,
          qual_types: first.qual_types,
          score_format: first.score_format,
          catalog_id: first.catalog_id,
          governing_body: first.governing_body,
        },
        { onConflict: 'show_id,label', ignoreDuplicates: true },
      );
      if (insError) throw new Error(insError.message);
    }
  } else {
    if (!inDivision) return;
    const enteredMessage = `Riders have entered ${test} (${parsed.division}) — scratched entries count too, so it can't be dropped.`;
    if ((await entryCountFor(supabase, [inDivision.id])) > 0) {
      throw new UserFacingError(enteredMessage);
    }
    if (rows.length === 1) {
      // Last division off: keep the test offered, just without a division.
      const { data: updatedRows, error: updError } = await supabase
        .from('classes')
        .update({ division: null, label: labelFor(first.group_name, test, null) })
        .eq('id', inDivision.id)
        .eq('show_id', parsed.showId)
        .select('id');
      if (updError) throw new Error(updError.message);
      assertUpdated(updatedRows, "You don't have permission to change these classes.");
    } else {
      const { blocked } = await deleteClassesIfUnentered(supabase, parsed.showId, [inDivision.id]);
      if (blocked > 0) throw new UserFacingError(enteredMessage);
    }
  }

  revalidateSelectEvents(parsed.showId);
}

export async function updateTestFee(input: unknown): Promise<void> {
  const parsed = parseInput(updateTestFeeSchema, input);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('classes')
    .update({ fee: parsed.fee, price_edited: true })
    .eq('show_id', parsed.showId)
    .in('id', parsed.classIds)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to change these classes.");

  revalidateSelectEvents(parsed.showId);
}

export async function setTestQualifying(input: unknown): Promise<void> {
  const parsed = parseInput(setTestQualifyingSchema, input);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('classes')
    .update({ qualifying: parsed.qualifying })
    .eq('show_id', parsed.showId)
    .in('id', parsed.classIds)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to change these classes.");

  revalidateSelectEvents(parsed.showId);
}

export async function removeTestClasses(input: unknown): Promise<void> {
  const parsed = parseInput(removeTestClassesSchema, input);
  const supabase = await createServerClient();

  const { blocked } = await deleteClassesIfUnentered(supabase, parsed.showId, parsed.classIds);
  if (blocked > 0) {
    throw new UserFacingError(
      'Riders have entered this test (scratched entries count too) — it can no longer be removed.',
    );
  }

  revalidateSelectEvents(parsed.showId);
}
