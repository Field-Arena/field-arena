import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { isPast } from '@/shared/lib/format/date';
import { resolveStaffPermissions } from '../utils';
import type {
  UserDirectoryRow,
  UserDirectoryStatus,
  CogginsStatus,
  RingCoverageData,
  RiderDetail,
  RiderDetailDocument,
  VendorDetail,
} from '../types';
import type { ShowListItem } from '@/modules/shows/data/queries';
import type { DocumentRequirement } from '@/modules/shows/data/setup-queries';

interface HorseUpload {
  requirementId?: string;
  label?: string;
  verified?: boolean;
  expirationDate?: string;
}

export async function listAllUsersAcrossShows(shows: ShowListItem[]): Promise<UserDirectoryRow[]> {
  const showIds = shows.map((s) => s.id);
  if (showIds.length === 0) return [];

  const showById = new Map(shows.map((s) => [s.id, s]));
  const supabase = await createServerClient();

  const [staffResult, classesResult, showDocsResult, vendorResult] = await Promise.all([
    supabase
      .from('staff_assignments')
      .select(
        'id, show_id, name, first_name, last_name, role, email, phone, status, user_id, is_steward, can_scratch_skip_dq, can_view_money, permissions',
      )
      .in('show_id', showIds)
      .neq('role', 'Vendor'),
    supabase.from('classes').select('id, show_id, label, fee').in('show_id', showIds),
    supabase.from('shows').select('id, document_requirements').in('id', showIds),
    supabase
      .from('vendor_bookings')
      .select('id, show_id, name, contact, phone, status, amount_total')
      .in('show_id', showIds),
  ]);
  if (staffResult.error) throw staffResult.error;
  if (classesResult.error) throw classesResult.error;
  if (showDocsResult.error) throw showDocsResult.error;
  if (vendorResult.error) throw vendorResult.error;

  const classToShow = new Map(classesResult.data.map((c) => [c.id, c.show_id]));
  const classIds = [...classToShow.keys()];
  const classInfoById = new Map(
    classesResult.data.map((c) => [c.id, { label: c.label, fee: c.fee ?? 0 }]),
  );

  const vendorBookingIds = vendorResult.data.map((v) => v.id);
  const vendorItemsByBooking = new Map<string, VendorDetail['items']>();
  if (vendorBookingIds.length > 0) {
    const { data: vendorItemRows, error: vendorItemsError } = await supabase
      .from('vendor_booking_items')
      .select('booking_id, qty, vendor_items(name, price)')
      .in('booking_id', vendorBookingIds);
    if (vendorItemsError) throw vendorItemsError;
    for (const row of vendorItemRows) {
      const list = vendorItemsByBooking.get(row.booking_id) ?? [];
      const unitPrice = row.vendor_items.price ?? 0;
      const qty = row.qty ?? 1;
      list.push({
        label: row.vendor_items.name,
        qty,
        unitPrice,
        amount: Math.round(unitPrice * qty * 100) / 100,
      });
      vendorItemsByBooking.set(row.booking_id, list);
    }
  }

  let entries: {
    rider: string | null;
    rider_id: string | null;
    horse: string | null;
    horse_id: string | null;
    class_id: string;
  }[] = [];
  if (classIds.length > 0) {
    const { data, error } = await supabase
      .from('class_entries')
      .select('rider, rider_id, horse, horse_id, class_id')
      .in('class_id', classIds);
    if (error) throw error;
    entries = data;
  }

  const requirementsByShow = new Map<string, DocumentRequirement[]>();
  const cogginsReqByShow = new Map<string, DocumentRequirement | null>();
  for (const row of showDocsResult.data) {
    const requirements = (row.document_requirements ?? []) as unknown as DocumentRequirement[];
    requirementsByShow.set(row.id, requirements);
    const match = requirements.find((r) => r.label.toLowerCase().includes('coggins')) ?? null;
    cogginsReqByShow.set(row.id, match);
  }

  interface RiderGroup {
    name: string;
    riderId: string | null;
    horseIds: Set<string>;
    classIds: Set<string>;
  }
  const ridersByShow = new Map<string, Map<string, RiderGroup>>();

  for (const entry of entries) {
    /* entry.rider is a denormalized display name, blank for some real-account
     * entries (e.g. checkout flows that never filled it in) — entry.rider_id
     * is the actual link to a real rider account, and either one alone is
     * enough to know someone entered. Skipping on a blank name alone used to
     * drop entries that had a real linked account, silently hiding that
     * rider from this directory. */
    if (!entry.rider && !entry.rider_id) continue;
    const showId = classToShow.get(entry.class_id);
    if (!showId) continue;

    const groups = ridersByShow.get(showId) ?? new Map<string, RiderGroup>();
    ridersByShow.set(showId, groups);

    const key = entry.rider_id ?? `text:${(entry.rider ?? '').trim().toLowerCase()}`;
    const group = groups.get(key) ?? {
      name: entry.rider ?? '',
      riderId: entry.rider_id,
      horseIds: new Set<string>(),
      classIds: new Set<string>(),
    };
    if (entry.horse_id) group.horseIds.add(entry.horse_id);
    group.classIds.add(entry.class_id);
    groups.set(key, group);
  }

  const allRiderIds = [
    ...new Set(
      [...ridersByShow.values()].flatMap((g) =>
        [...g.values()].map((v) => v.riderId).filter((id): id is string => id !== null),
      ),
    ),
  ];
  const allHorseIds = [
    ...new Set(
      [...ridersByShow.values()].flatMap((g) => [...g.values()].flatMap((v) => [...v.horseIds])),
    ),
  ];

  const [riderAccounts, horseRecords, riderOrders] = await Promise.all([
    allRiderIds.length > 0
      ? supabase
          .from('riders')
          .select('id, first_name, last_name, email, phone')
          .in('id', allRiderIds)
      : Promise.resolve({ data: [], error: null }),
    allHorseIds.length > 0
      ? supabase.from('horses').select('id, name, document_uploads').in('id', allHorseIds)
      : Promise.resolve({ data: [], error: null }),
    allRiderIds.length > 0
      ? supabase
          .from('orders')
          .select('rider_id, show_id, items')
          .in('rider_id', allRiderIds)
          .in('show_id', showIds)
          .eq('status', 'paid')
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (riderAccounts.error) throw riderAccounts.error;
  if (horseRecords.error) throw horseRecords.error;
  if (riderOrders.error) throw riderOrders.error;

  const riderAccountById = new Map(riderAccounts.data.map((r) => [r.id, r]));
  const horseById = new Map(horseRecords.data.map((h) => [h.id, h]));
  const horseUploadsById = new Map(
    horseRecords.data.map((h) => [h.id, (h.document_uploads ?? []) as HorseUpload[]]),
  );

  /* order items carry {kind, label, qty, unitPrice, amount, ...} (see
   * riders/types.ts OrderLineItem) -- only "addon" items belong here, since
   * class_entry items are already covered by the "classes entered" list
   * below (built from class_entries, the roster of record, not the order). */
  const addOnsByRiderShow = new Map<string, RiderDetail['addOns']>();
  for (const order of riderOrders.data) {
    const items = order.items as unknown as
      { kind?: string; label?: string; qty?: number; amount?: number }[] | null;
    const addOnItems = (items ?? []).filter((item) => item.kind === 'addon');
    if (addOnItems.length === 0) continue;

    const key = `${order.rider_id}:${order.show_id}`;
    const list = addOnsByRiderShow.get(key) ?? [];
    for (const item of addOnItems) {
      list.push({
        label: item.label ?? 'Add-on',
        qty: item.qty ?? 1,
        amount: item.amount ?? 0,
      });
    }
    addOnsByRiderShow.set(key, list);
  }

  const staffEmails = [
    ...new Set(
      staffResult.data.map((s) => s.email?.trim().toLowerCase()).filter((e): e is string => !!e),
    ),
  ];

  let statusByEmail = new Map<string, UserDirectoryStatus>();
  if (staffEmails.length > 0) {
    const admin = createAdminClient();
    const usersResult = await admin
      .from('users')
      .select('id, email, onboarded_at')
      .in('email', staffEmails);
    if (usersResult.error) throw usersResult.error;

    statusByEmail = new Map(
      usersResult.data.map((u) => [u.email.toLowerCase(), u.onboarded_at ? 'onboard' : 'pending']),
    );
  }

  const rows: UserDirectoryRow[] = [];

  for (const s of staffResult.data) {
    const show = showById.get(s.show_id);
    if (!show) continue;

    const email = s.email?.trim().toLowerCase() ?? null;
    const status: UserDirectoryStatus = email
      ? (statusByEmail.get(email) ?? 'not_invited')
      : 'not_invited';

    rows.push({
      key: `staff:${s.id}`,
      kind: 'staff',
      id: s.id,
      name: s.name,
      firstName: s.first_name,
      lastName: s.last_name,
      role: s.role,
      email: s.email,
      phone: s.phone,
      showId: s.show_id,
      showName: show.name,
      status,
      isSteward: s.is_steward ?? false,
      canScratchSkipDq: s.can_scratch_skip_dq ?? false,
      canViewMoney: s.can_view_money ?? false,
      permissions: resolveStaffPermissions({
        role: s.role,
        permissions: s.permissions,
        canScratchSkipDq: s.can_scratch_skip_dq,
        canViewMoney: s.can_view_money,
      }),
      coggins: null,
      editable: true,
      riderDetail: null,
      vendorDetail: null,
    });
  }

  for (const [showId, groups] of ridersByShow) {
    const show = showById.get(showId);
    if (!show) continue;
    const cogginsReq = cogginsReqByShow.get(showId) ?? null;
    const requirements = requirementsByShow.get(showId) ?? [];

    for (const [key, group] of groups) {
      const account = group.riderId ? riderAccountById.get(group.riderId) : undefined;
      const email = account?.email ?? null;
      const phone = account?.phone ?? null;
      const accountName = [account?.first_name, account?.last_name].filter(Boolean).join(' ');
      const name =
        [accountName, group.name.trim(), email].find((candidate) => !!candidate) ?? 'Unnamed rider';

      const horses = [...group.horseIds]
        .map((horseId) => horseById.get(horseId))
        .filter((h): h is NonNullable<typeof h> => !!h)
        .map((h) => ({
          id: h.id,
          name: h.name,
          documents: buildDocumentStatus(h.id, requirements, horseUploadsById),
        }));

      const classes = [...group.classIds]
        .map((classId) => classInfoById.get(classId))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .sort((a, b) => a.label.localeCompare(b.label));

      const addOns = group.riderId
        ? (addOnsByRiderShow.get(`${group.riderId}:${showId}`) ?? [])
        : [];

      rows.push({
        key: `rider:${showId}:${key}`,
        kind: 'rider',
        id: group.riderId ?? key,
        name,
        firstName: account?.first_name ?? null,
        lastName: account?.last_name ?? null,
        role: 'Rider',
        email,
        phone,
        showId,
        showName: show.name,

        status: 'onboard',
        isSteward: false,
        canScratchSkipDq: false,
        canViewMoney: false,
        permissions: null,
        coggins: resolveCogginsStatus(group.horseIds, cogginsReq, horseUploadsById),
        editable: false,
        riderDetail: { riderId: group.riderId, horses, classes, addOns },
        vendorDetail: null,
      });
    }
  }

  for (const v of vendorResult.data) {
    const show = showById.get(v.show_id);
    if (!show) continue;

    rows.push({
      key: `vendor:${v.id}`,
      kind: 'vendor',
      id: v.id,
      name: v.name,
      firstName: null,
      lastName: null,
      role: 'Vendor',
      email: v.contact,
      phone: v.phone,
      showId: v.show_id,
      showName: show.name,

      status:
        v.status === 'paid' || v.status === 'approved'
          ? 'onboard'
          : v.status === 'pending'
            ? 'pending'
            : 'not_invited',
      isSteward: false,
      canScratchSkipDq: false,
      canViewMoney: false,
      permissions: null,
      coggins: null,
      editable: false,
      riderDetail: null,
      vendorDetail: {
        items: vendorItemsByBooking.get(v.id) ?? [],
        total: v.amount_total ?? 0,
      },
    });
  }

  return rows;
}

/* Per-requirement upload/verify status for one horse — the same shape
 * resolveCogginsStatus reasons over, but every requirement instead of just
 * Coggins, for the rider detail view. */
function buildDocumentStatus(
  horseId: string,
  requirements: DocumentRequirement[],
  horseUploadsById: Map<string, HorseUpload[]>,
): RiderDetailDocument[] {
  const uploads = horseUploadsById.get(horseId) ?? [];
  const todayIso = new Date().toISOString().slice(0, 10);

  return requirements
    .filter((req) => req.label.trim())
    .map((req) => {
      const upload = uploads.find((u) => u.requirementId === req.id);
      const uploaded = !!upload;
      const expirationDate = upload?.expirationDate ?? null;
      const pastDue = !!(req.requiresExpiration && expirationDate && expirationDate < todayIso);
      return {
        requirementId: req.id,
        label: req.label,
        requiresApproval: !!req.requiresApproval,
        uploaded,
        verified: req.requiresApproval ? (upload?.verified ?? false) : null,
        expirationDate,
        pastDue,
      };
    });
}

function resolveCogginsStatus(
  horseIds: Set<string>,
  requirement: DocumentRequirement | null,
  horseUploadsById: Map<string, HorseUpload[]>,
): CogginsStatus {
  if (!requirement || horseIds.size === 0) {
    return {
      applicable: false,
      compliant: null,
      reason: 'not_applicable',
      expirationDate: null,
      verified: false,
    };
  }

  let anyMissing = false;
  let anyExpired = false;
  let anyUnverified = false;
  let latestExpiration: string | null = null;

  for (const horseId of horseIds) {
    const uploads = horseUploadsById.get(horseId) ?? [];
    const upload = uploads.find((u) => u.requirementId === requirement.id);

    if (!upload) {
      anyMissing = true;
      continue;
    }
    if (
      requirement.requiresExpiration &&
      (!upload.expirationDate || isPast(upload.expirationDate))
    ) {
      anyExpired = true;
    }
    if (requirement.requiresApproval && !upload.verified) {
      anyUnverified = true;
    }
    if (upload.expirationDate) latestExpiration = upload.expirationDate;
  }

  const verified = requirement.requiresApproval ? !anyUnverified : true;

  if (anyMissing)
    return {
      applicable: true,
      compliant: false,
      reason: 'missing',
      expirationDate: latestExpiration,
      verified,
    };
  if (anyExpired)
    return {
      applicable: true,
      compliant: false,
      reason: 'expired',
      expirationDate: latestExpiration,
      verified,
    };
  if (anyUnverified)
    return {
      applicable: true,
      compliant: false,
      reason: 'unverified',
      expirationDate: latestExpiration,
      verified,
    };
  return {
    applicable: true,
    compliant: true,
    reason: 'compliant',
    expirationDate: latestExpiration,
    verified,
  };
}

/* One row per (show, ring) an organizer has explicitly assigned an
 * announcer to. "Rings" are never a managed list of their own — they are
 * exactly the distinct classes.location/arena values for the show, the same
 * convention the live Announcer view already uses (src/modules/
 * announcements/data/queries.ts: `ring: cls.location ?? cls.arena`). */
export async function getRingCoverageByShow(
  shows: ShowListItem[],
): Promise<Record<string, RingCoverageData>> {
  const showIds = shows.map((s) => s.id);
  if (showIds.length === 0) return {};

  const supabase = await createServerClient();
  const [classesResult, assignResult] = await Promise.all([
    supabase.from('classes').select('show_id, location, arena').in('show_id', showIds),
    supabase
      .from('ring_assignments')
      .select('show_id, ring_name, staff_assignment_id')
      .in('show_id', showIds),
  ]);
  if (classesResult.error) throw classesResult.error;
  if (assignResult.error) throw assignResult.error;

  const ringsByShow = new Map<string, Set<string>>();
  for (const c of classesResult.data) {
    const ring = (c.location ?? c.arena)?.trim();
    if (!ring) continue;
    const set = ringsByShow.get(c.show_id) ?? new Set<string>();
    set.add(ring);
    ringsByShow.set(c.show_id, set);
  }

  const assignmentsByShow = new Map<string, Record<string, string | null>>();
  for (const a of assignResult.data) {
    const map = assignmentsByShow.get(a.show_id) ?? {};
    map[a.ring_name] = a.staff_assignment_id;
    assignmentsByShow.set(a.show_id, map);
  }

  const result: Record<string, RingCoverageData> = {};
  for (const show of shows) {
    result[show.id] = {
      rings: [...(ringsByShow.get(show.id) ?? new Set<string>())].sort((a, b) =>
        a.localeCompare(b),
      ),
      assignments: assignmentsByShow.get(show.id) ?? {},
    };
  }
  return result;
}
