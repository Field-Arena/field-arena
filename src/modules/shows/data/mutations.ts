'use server';

import { revalidatePath } from 'next/cache';
import type { Json } from '@/shared/types/database.types';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getImpersonatedOrgId } from '@/shared/lib/impersonation';
import { getShowStage } from '@/modules/shows/data/queries';
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
  removeShowDocumentSchema,
  updateDocumentEventsSchema,
  saveTestTemplateSchema,
  assignTestTemplateToClassSchema,
  saveShowExpensesSchema,
  updateScheduleRulesSchema,
  setClassDurationSchema,
  moveClassToRingDaySchema,
  scratchEntrySchema,
  reorderRideSchema,
  createDocumentUploadUrlSchema,
  registerShowDocumentSchema,
} from '@/modules/shows/schemas';
import {
  VENDOR_SPACE_TEMPLATE,
  DASHBOARD_PATH,
  SHOWS_PATH,
  SCHEDULE_PATH,
  SHOW_DOCS_BUCKET,
} from '@/modules/shows/constants';
import { formatDateShort } from '@/shared/lib/format/date';

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

export async function createShow(input: unknown): Promise<{ id: string }> {
  const parsed = createShowSchema.parse(input);
  const orgId = await resolveOrgId();
  const supabase = await createServerClient();
  const id = crypto.randomUUID();

  const dateLabel =
    parsed.dateLabel ??
    (parsed.startDate === parsed.endDate
      ? formatDateShort(parsed.startDate)
      : `${formatDateShort(parsed.startDate)} – ${formatDateShort(parsed.endDate)}`);

  const { error } = await supabase.from('shows').insert({
    id,
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

    published: false,
    status: 'yellow',
  });

  if (error) throw new Error(error.message);

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
  return { id };
}

export async function createDraftShow(): Promise<{ id: string }> {
  const orgId = await resolveOrgId();
  const supabase = await createServerClient();
  const id = crypto.randomUUID();

  const { error } = await supabase.from('shows').insert({
    id,
    org_id: orgId,
    name: 'New Show',
    published: false,
    status: 'yellow',
  });

  if (error) throw new Error(error.message);

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
  return { id };
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
    if (error.code === '23505') {
      throw new Error(`This show already has a class called "${parsed.label}".`);
    }
    throw new Error(error.message);
  }

  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
}

export async function createDivision(input: unknown): Promise<{ id: string }> {
  const parsed = createDivisionSchema.parse(input);
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
          : 'The waiver of liability must be approved before this show can go live.',
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

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
}

export async function advanceRunnerState(
  showId: string,
  patch: { ticketClosed?: boolean; approved?: boolean },
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
  revalidatePath(`/dashboard/shows/${showId}/schedule`);
  revalidatePath(SCHEDULE_PATH);
  revalidatePath(DASHBOARD_PATH);
}

export async function updateShowDetails(input: unknown): Promise<void> {
  const parsed = updateShowDetailsSchema.parse(input);
  const supabase = await createServerClient();

  const { data: current, error: readError } = await supabase
    .from('shows')
    .select('show_details')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);
  const showDetails = {
    ...(current.show_details as Record<string, unknown>),
    org: parsed.org ?? '',
  };

  const { error } = await supabase
    .from('shows')
    .update({
      name: parsed.name,
      show_details: showDetails,
      show_type: parsed.showType,

      start_date: parsed.startDate || null,
      end_date: parsed.endDate || null,
      timezone: parsed.timezone ?? null,
      starting_rider_number: parsed.startingRiderNumber,
      governing_bodies: parsed.governingBodies,
    })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(DASHBOARD_PATH);
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

  const { data: current, error: readError } = await supabase
    .from('shows')
    .select('schedule_prefs')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);

  const { error } = await supabase
    .from('shows')
    .update({
      schedule_prefs: {
        ...((current.schedule_prefs ?? {}) as Record<string, unknown>),
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

  revalidatePath(DASHBOARD_PATH);
  revalidatePath(SHOWS_PATH);
}

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

export async function approveWaiver(showId: string, waiverText: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({ waiver_approved_text: waiverText, waiver_approved_at: new Date().toISOString() })
    .eq('id', showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${showId}`);
}

export async function updateTicketWindow(input: unknown): Promise<void> {
  const parsed = updateTicketWindowSchema.parse(input);
  const supabase = await createServerClient();

  const close = parsed.ticketCloseDate
    ? `${parsed.ticketCloseDate}${parsed.ticketCloseTime ? ` ${parsed.ticketCloseTime}` : ''}`
    : '';

  const { error } = await supabase
    .from('shows')
    .update({ ticket_open: parsed.ticketOpen, ticket_close: close })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(DASHBOARD_PATH);
}

export async function addCatalogGroup(input: unknown): Promise<{ added: number }> {
  const parsed = addCatalogGroupSchema.parse(input);
  const supabase = await createServerClient();

  const division = parsed.division ?? parsed.group;
  const label = (test: string) =>
    parsed.division
      ? `${parsed.group} — ${test} — ${parsed.division}`
      : `${parsed.group} — ${test}`;

  const rows = parsed.tests.map((test) => ({
    show_id: parsed.showId,
    label: label(test),
    event: parsed.category,
    group_name: parsed.group,
    division,
    location: parsed.location || null,
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
  const parsed = addCatalogGroupSchema.pick({ showId: true, group: true }).parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('show_id', parsed.showId)
    .eq('division', parsed.group);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
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
  revalidatePath(SHOWS_PATH);
}

export async function createTocClass(input: unknown): Promise<void> {
  const parsed = createTocClassSchema.parse(input);
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

export async function loadStandardVendorSpaces(showId: string): Promise<StandardVendorSpaceRow[]> {
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

  const { error } = await supabase
    .from('shows')
    .update(column === 'logo_path' ? { logo_path: path } : { show_image_path: path })
    .eq('id', parsed.showId);
  if (error) {
    await supabase.storage.from(bucket).remove([path]);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/shows/${parsed.showId}/rider-entries`);
}

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
  revalidatePath(`/dashboard/shows/${parsed.showId}/select-events`);
  revalidatePath(SHOWS_PATH);
  revalidatePath(SCHEDULE_PATH);
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

  await supabase.storage.from(SHOW_DOCS_BUCKET).remove([doc.path]);

  revalidatePath(`/dashboard/shows/${parsed.showId}/documents`);
  revalidatePath('/dashboard/documents');
}

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

export async function saveTestTemplate(input: unknown): Promise<{ id: string }> {
  const parsed = saveTestTemplateSchema.parse(input);
  const supabase = await createServerClient();

  // Keep the legacy movements/collectives columns in sync from the structured
  // sections when the new editor supplied them, so the current judge scoring
  // path (class_tests, filled by assignTestTemplateToClass) keeps working
  // unchanged. When no sections are sent (old editor), what it sent wins.
  let movements = parsed.movements;
  let collectives = parsed.collectives;
  if (parsed.sections.length > 0) {
    const m: { num: number; text: string; coef: number }[] = [];
    const c: { key: string; label: string; coef: number }[] = [];
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
          c.push({ key: slug, label: item.label || 'Mark', coef: item.coef });
        } else {
          const instr = item.instructions
            .map((i) => [i.marker, i.instruction].filter(Boolean).join(' — '))
            .filter(Boolean)
            .join('; ');
          m.push({ num: n, text: instr || item.label || `Movement ${String(n)}`, coef: item.coef });
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
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from('test_templates')
    .insert({ org_id: parsed.orgId, source_label: parsed.sourceLabel ?? null, ...fields })
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

export async function assignTestTemplateToClass(input: unknown): Promise<void> {
  const parsed = assignTestTemplateToClassSchema.parse(input);
  const supabase = await createServerClient();

  const { data: template, error: templateError } = await supabase
    .from('test_templates')
    .select('name, movements, collectives')
    .eq('id', parsed.templateId)
    .single();
  if (templateError) throw new Error(templateError.message);

  const { error } = await supabase.from('class_tests').upsert(
    {
      class_id: parsed.classId,
      name: template.name,
      movements: template.movements,
      collectives: template.collectives,
    },
    { onConflict: 'class_id' },
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function saveShowExpenses(input: unknown): Promise<void> {
  const parsed = saveShowExpensesSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('shows')
    .update({ expenses: parsed.expenses })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/billing');
}

export async function createDocumentUploadUrl(
  input: unknown,
): Promise<{ path: string; token: string }> {
  const parsed = createDocumentUploadUrlSchema.parse(input);
  const supabase = await createServerClient();

  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage.from(SHOW_DOCS_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path: data.path, token: data.token };
}

export async function registerShowDocument(input: unknown): Promise<{ id: string }> {
  const parsed = registerShowDocumentSchema.parse(input);
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
  revalidatePath('/dashboard/documents');
  return { id: data.id };
}

function revalidateSchedule(showId: string): void {
  revalidatePath(SCHEDULE_PATH);
  revalidatePath(`/dashboard/shows/${showId}/schedule`);
}

export async function updateScheduleRules(input: unknown): Promise<void> {
  const parsed = updateScheduleRulesSchema.parse(input);
  const supabase = await createServerClient();

  const { data: current, error: readError } = await supabase
    .from('shows')
    .select('schedule_prefs')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);

  const next: Record<string, Json> = {
    ...((current.schedule_prefs ?? {}) as Record<string, Json>),
  };
  if (parsed.hardRuleEnabled !== undefined) next.hardRuleEnabled = parsed.hardRuleEnabled;
  if (parsed.hardRuleSameHorseMin !== undefined) {
    next.hardRuleSameHorseMin = parsed.hardRuleSameHorseMin;
  }
  if (parsed.hardRuleDiffHorseMin !== undefined) {
    next.hardRuleDiffHorseMin = parsed.hardRuleDiffHorseMin;
  }
  if (parsed.awardsByDivision !== undefined) next.awardsByDivision = parsed.awardsByDivision;

  const { error } = await supabase
    .from('shows')
    .update({ schedule_prefs: next })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidateSchedule(parsed.showId);
}

export async function setClassDuration(input: unknown): Promise<void> {
  const parsed = setClassDurationSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ min_per_ride: parsed.minutes })
    .eq('id', parsed.classId);
  if (error) throw new Error(error.message);

  revalidateSchedule(parsed.showId);
}

export async function moveClassToRingDay(input: unknown): Promise<void> {
  const parsed = moveClassToRingDaySchema.parse(input);
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

  const { error } = await supabase
    .from('classes')
    .update({ location: parsed.ring, date })
    .eq('id', parsed.classId);
  if (error) throw new Error(error.message);

  revalidateSchedule(parsed.showId);
}

export async function scratchEntry(input: unknown): Promise<void> {
  const parsed = scratchEntrySchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('class_entries')
    .update({ status: 'scratched' })
    .eq('id', parsed.entryId);
  if (error) throw new Error(error.message);

  revalidateSchedule(parsed.showId);
}

export async function reorderRide(input: unknown): Promise<void> {
  const parsed = reorderRideSchema.parse(input);
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

  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from('class_entries')
      .update({ ride_order: 10_000 + index })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from('class_entries')
      .update({ ride_order: index + 1 })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  revalidateSchedule(parsed.showId);
}
