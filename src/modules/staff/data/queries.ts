import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { isPast } from '@/shared/lib/format/date';
import { resolveStaffPermissions } from '../utils';
import type { UserDirectoryRow, UserDirectoryStatus, CogginsStatus } from '../types';
import type { ShowListItem } from '@/modules/shows/data/queries';
import type { DocumentRequirement } from '@/modules/shows/data/setup-queries';

interface HorseUpload {
  requirementId?: string;
  label?: string;
  verified?: boolean;
  expirationDate?: string;
}

/**
 * The org-wide "All Users" directory: every show's staff, every rider actually
 * entered per show, and every vendor booking — one flat list. Ported from
 * showstaff.html's `allUsersAcrossShows()` (~line 9522), against this app's
 * real schema instead of the legacy's in-memory fixtures.
 *
 * Three sources, matching the legacy's three branches exactly in spirit:
 *
 *  1. **Staff** — every `staff_assignments` row across every show in `shows`,
 *     except role='Vendor' (vendors are sourced from vendor_bookings below,
 *     never from staff_assignments — legacy explicitly skips them here too).
 *
 *  2. **Riders** — one row per rider actually entered in each show, derived
 *     from `class_entries` the same way `getShowStats`/the Horses page do:
 *     `class_entries.rider` (free text) is the universal display source,
 *     `rider_id` only when a real rider account exists behind the entry. This
 *     port groups by **rider**, not by rider-and-horse the way legacy's
 *     `realRiderRowsForShow` does — the task is "one row per rider entered",
 *     and a rider with two horses in the same show is one person on this
 *     directory. Their Coggins status folds in every horse they entered (see
 *     below): non-compliant if any one of them is.
 *
 *  3. **Vendors** — every `vendor_bookings` row, one row each.
 *
 * Status (`not_invited`/`pending`/`onboard`) is not a stored column for any of
 * these — see each section below for how it is derived, since the three kinds
 * don't share one signal.
 */
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
    supabase.from('classes').select('id, show_id').in('show_id', showIds),
    supabase.from('shows').select('id, document_requirements').in('id', showIds),
    supabase
      .from('vendor_bookings')
      .select('id, show_id, name, contact, phone, status')
      .in('show_id', showIds),
  ]);
  if (staffResult.error) throw staffResult.error;
  if (classesResult.error) throw classesResult.error;
  if (showDocsResult.error) throw showDocsResult.error;
  if (vendorResult.error) throw vendorResult.error;

  const classToShow = new Map(classesResult.data.map((c) => [c.id, c.show_id]));
  const classIds = [...classToShow.keys()];

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

  // The show's Coggins requirement, matched loosely by label — organizers can
  // reword these ("Coggins test", "Current Coggins", etc.), so a strict equal
  // would silently stop matching the moment someone edits the wording.
  const cogginsReqByShow = new Map<string, DocumentRequirement | null>();
  for (const row of showDocsResult.data) {
    const requirements = (row.document_requirements ?? []) as unknown as DocumentRequirement[];
    const match = requirements.find((r) => r.label.toLowerCase().includes('coggins')) ?? null;
    cogginsReqByShow.set(row.id, match);
  }

  // One rider group per (show, rider identity), identity being the real
  // rider_id when an account exists behind the entry, else the trimmed,
  // lowercased display name — the same fallback getShowStats/HorsesPage use
  // for an organizer-imported roster with no accounts behind it at all.
  interface RiderGroup {
    name: string;
    riderId: string | null;
    horseIds: Set<string>;
  }
  const ridersByShow = new Map<string, Map<string, RiderGroup>>();

  for (const entry of entries) {
    if (!entry.rider) continue;
    const showId = classToShow.get(entry.class_id);
    if (!showId) continue;

    const groups = ridersByShow.get(showId) ?? new Map<string, RiderGroup>();
    ridersByShow.set(showId, groups);

    const key = entry.rider_id ?? `text:${entry.rider.trim().toLowerCase()}`;
    const group = groups.get(key) ?? {
      name: entry.rider,
      riderId: entry.rider_id,
      horseIds: new Set<string>(),
    };
    if (entry.horse_id) group.horseIds.add(entry.horse_id);
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

  const [riderAccounts, horseRecords] = await Promise.all([
    allRiderIds.length > 0
      ? supabase
          .from('riders')
          .select('id, first_name, last_name, email, phone')
          .in('id', allRiderIds)
      : Promise.resolve({ data: [], error: null }),
    allHorseIds.length > 0
      ? supabase.from('horses').select('id, document_uploads').in('id', allHorseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (riderAccounts.error) throw riderAccounts.error;
  if (horseRecords.error) throw horseRecords.error;

  const riderAccountById = new Map(riderAccounts.data.map((r) => [r.id, r]));
  const horseUploadsById = new Map(
    horseRecords.data.map((h) => [h.id, (h.document_uploads ?? []) as HorseUpload[]]),
  );

  // ── Staff status: `staff_assignments.status` is only ever 'pending' |
  // 'accepted' in this schema and doesn't distinguish "never provisioned"
  // from "invited but hasn't signed in" — and `user_id` is only ever set by
  // the seed script, never by any real invite-acceptance flow in this app
  // yet. The provisioning signal that actually exists is the one
  // addStaffUser (below, in mutations.ts) writes: a `public.users` row keyed
  // by this same email. So status here mirrors listOrganizations'
  // Pending/Onboarded derivation — matched by email, not staff_assignments'
  // own (currently-unreliable) user_id/status columns.
  const staffEmails = [
    ...new Set(
      staffResult.data.map((s) => s.email?.trim().toLowerCase()).filter((e): e is string => !!e),
    ),
  ];

  let statusByEmail = new Map<string, UserDirectoryStatus>();
  if (staffEmails.length > 0) {
    const admin = createAdminClient();
    const [usersResult, authList] = await Promise.all([
      admin.from('users').select('id, email').in('email', staffEmails),
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    if (usersResult.error) throw usersResult.error;

    const signedInById = new Map(
      authList.data.users.map((u) => [u.id, Boolean(u.last_sign_in_at)]),
    );
    statusByEmail = new Map(
      usersResult.data.map((u) => [
        u.email.toLowerCase(),
        signedInById.get(u.id) ? 'onboard' : 'pending',
      ]),
    );
  }

  const rows: UserDirectoryRow[] = [];

  // 1. Staff
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
    });
  }

  // 2. Riders
  for (const [showId, groups] of ridersByShow) {
    const show = showById.get(showId);
    if (!show) continue;
    const cogginsReq = cogginsReqByShow.get(showId) ?? null;

    for (const [key, group] of groups) {
      const account = group.riderId ? riderAccountById.get(group.riderId) : undefined;
      const email = account?.email ?? null;
      const phone = account?.phone ?? null;
      const name = account
        ? [account.first_name, account.last_name].filter(Boolean).join(' ') || group.name
        : group.name;

      rows.push({
        key: `rider:${showId}:${key}`,
        kind: 'rider',
        id: group.riderId ?? key,
        name,
        firstName: null,
        lastName: null,
        role: 'Rider',
        email,
        phone,
        showId,
        showName: show.name,
        // Riders don't go through the staff invite flow this pill otherwise
        // tracks — a rider row exists because they already have a live entry
        // on the show, so "On board" is the honest default for every rider
        // row, matching showstaff.html's own hardcoded 'onboard' for real
        // riders.
        status: 'onboard',
        isSteward: false,
        canScratchSkipDq: false,
        canViewMoney: false,
        permissions: null,
        coggins: resolveCogginsStatus(group.horseIds, cogginsReq, horseUploadsById),
        editable: false,
      });
    }
  }

  // 3. Vendors
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
      // vendor_bookings.status tracks the booking, not an account invite —
      // mapped onto the same three-state pill as the closest honest reading:
      // a paid/approved booking reads as "On board", a pending one as
      // "Pending", anything else (rejected, or no status at all) as
      // "Not invited".
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
    });
  }

  return rows;
}

/**
 * A rider's Coggins compliance for one show, folding in every horse they
 * entered. Non-compliant if *any* horse is; compliant only if every horse
 * with a resolvable record is. Not applicable at all when the show has no
 * Coggins-like requirement configured, or when none of the rider's entries
 * resolve to a real horse record (an organizer-imported roster row has a
 * horse name but no horses table row to attach documents to — see
 * HorsesPage's identical "Roster entry — no rider account" case).
 */
function resolveCogginsStatus(
  horseIds: Set<string>,
  requirement: DocumentRequirement | null,
  horseUploadsById: Map<string, HorseUpload[]>,
): CogginsStatus {
  if (!requirement || horseIds.size === 0) {
    return { applicable: false, compliant: null, reason: 'not_applicable', expirationDate: null };
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

  if (anyMissing)
    return {
      applicable: true,
      compliant: false,
      reason: 'missing',
      expirationDate: latestExpiration,
    };
  if (anyExpired)
    return {
      applicable: true,
      compliant: false,
      reason: 'expired',
      expirationDate: latestExpiration,
    };
  if (anyUnverified)
    return {
      applicable: true,
      compliant: false,
      reason: 'unverified',
      expirationDate: latestExpiration,
    };
  return {
    applicable: true,
    compliant: true,
    reason: 'compliant',
    expirationDate: latestExpiration,
  };
}
