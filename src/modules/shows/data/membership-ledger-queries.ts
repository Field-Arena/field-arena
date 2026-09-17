import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger, reconcileShowEntries } from '@/modules/shows/data/entry-numbering';
import type { MEMBERSHIP_FLAGS } from '@/modules/shows/constants';

export type MembershipFlag = (typeof MEMBERSHIP_FLAGS)[number];
export type MembershipStatusValue = 'active' | 'inactive' | 'unknown';
export type VerificationStatusValue = 'unverified' | 'verified' | 'flagged';

export interface MembershipLedgerRow {
  showEntryId: string;
  entryNumber: string;
  bridleNumber: string;
  riderName: string;
  horseName: string;
  association: string | null;
  riderMembershipNumber: string | null;
  horseRegistrationNumber: string | null;
  ownerMembershipNumber: string | null;
  membershipStatus: MembershipStatusValue;
  horseRegistrationStatus: MembershipStatusValue;
  verificationStatus: VerificationStatusValue;
  flags: MembershipFlag[];
  notes: string | null;
  linkedMemberId: string | null;
  linkedMemberName: string | null;
  suggestedUsef: string | null;
  suggestedFei: string | null;
}

export interface MembershipLedgerPageData {
  showId: string;
  showName: string;
  rows: MembershipLedgerRow[];
  orgMembers: { id: string; name: string }[];
}

export async function getMembershipLedgerPageData(
  showId: string,
): Promise<MembershipLedgerPageData | null> {
  await assertCanManageEntryLedger(showId);
  await reconcileShowEntries(showId);

  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, org_id')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: entries, error: entriesError } = await supabase
    .from('show_entries')
    .select('id, entry_number, rider_id, rider_name, show_horse_id')
    .eq('show_id', showId);
  if (entriesError) throw entriesError;

  if (entries.length === 0) {
    return { showId: show.id, showName: show.name, rows: [], orgMembers: [] };
  }

  const showHorseIds = [...new Set(entries.map((e) => e.show_horse_id))];
  const [
    { data: showHorses, error: horsesError },
    { data: checks, error: checksError },
    { data: orgMembers, error: membersError },
  ] = await Promise.all([
    supabase.from('show_horses').select('id, horse_name, bridle_number').in('id', showHorseIds),
    supabase.from('entry_membership_checks').select('*').eq('show_id', showId),
    supabase.from('member_database').select('id, name').eq('org_id', show.org_id).order('name'),
  ]);
  if (horsesError) throw horsesError;
  if (checksError) throw checksError;
  if (membersError) throw membersError;

  const showHorseById = new Map(showHorses.map((h) => [h.id, h]));
  const checkByShowEntryId = new Map(checks.map((c) => [c.show_entry_id, c]));
  const memberById = new Map(orgMembers.map((m) => [m.id, m]));

  const riderIds = [...new Set(entries.map((e) => e.rider_id).filter((id): id is string => !!id))];
  const { data: riders, error: ridersError } = riderIds.length
    ? await supabase.from('riders').select('id, usef, fei').in('id', riderIds)
    : { data: [], error: null };
  if (ridersError) throw ridersError;
  const riderById = new Map(riders.map((r) => [r.id, r]));

  const rows: MembershipLedgerRow[] = entries.map((entry) => {
    const showHorse = showHorseById.get(entry.show_horse_id);
    const check = checkByShowEntryId.get(entry.id);
    const rider = entry.rider_id ? riderById.get(entry.rider_id) : undefined;
    const linkedMember = check?.member_database_id ? memberById.get(check.member_database_id) : undefined;

    return {
      showEntryId: entry.id,
      entryNumber: entry.entry_number,
      bridleNumber: showHorse?.bridle_number ?? '—',
      riderName: entry.rider_name,
      horseName: showHorse?.horse_name ?? '—',
      association: check?.association ?? null,
      riderMembershipNumber: check?.rider_membership_number ?? null,
      horseRegistrationNumber: check?.horse_registration_number ?? null,
      ownerMembershipNumber: check?.owner_membership_number ?? null,
      membershipStatus: (check?.membership_status ?? 'unknown') as MembershipStatusValue,
      horseRegistrationStatus: (check?.horse_registration_status ?? 'unknown') as MembershipStatusValue,
      verificationStatus: (check?.verification_status ?? 'unverified') as VerificationStatusValue,
      flags: (check?.flags ?? []) as unknown as MembershipFlag[],
      notes: check?.notes ?? null,
      linkedMemberId: check?.member_database_id ?? null,
      linkedMemberName: linkedMember?.name ?? null,
      suggestedUsef: rider?.usef ?? null,
      suggestedFei: rider?.fei ?? null,
    };
  });

  rows.sort((a, b) => a.entryNumber.localeCompare(b.entryNumber, undefined, { numeric: true }));

  return {
    showId: show.id,
    showName: show.name,
    rows,
    orgMembers: orgMembers.map((m) => ({ id: m.id, name: m.name })),
  };
}
