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

  const cogginsReqByShow = new Map<string, DocumentRequirement | null>();
  for (const row of showDocsResult.data) {
    const requirements = (row.document_requirements ?? []) as unknown as DocumentRequirement[];
    const match = requirements.find((r) => r.label.toLowerCase().includes('coggins')) ?? null;
    cogginsReqByShow.set(row.id, match);
  }

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
      usersResult.data.map((u) => [
        u.email.toLowerCase(),
        u.onboarded_at ? 'onboard' : 'pending',
      ]),
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
    });
  }

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
    });
  }

  return rows;
}

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
