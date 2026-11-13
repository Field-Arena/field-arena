import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import type { JudgeListItem, JudgePickerOption } from '@/modules/judges/types';
import { isUpcomingShow } from '@/modules/judges/utils/judge-display';

interface StaffLink {
  judge_id: string | null;
  shows: { id: string; name: string; start_date: string | null; end_date: string | null } | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The Judges page: every judge in the organization, with the shows each is in. */
export async function listJudges(orgId: string): Promise<JudgeListItem[]> {
  const supabase = await createServerClient();

  const { data: judges, error } = await supabase
    .from('judges')
    .select(
      'id, first_name, last_name, name, email, phone, usef_id, usef_id_source, usef_id_entered_by, usef_id_verified_at, usef_id_updated_at',
    )
    .eq('org_id', orgId)
    .order('name');
  if (error) throw error;
  if (judges.length === 0) return [];

  const { data: links, error: linkError } = await supabase
    .from('staff_assignments')
    .select('judge_id, shows(id, name, start_date, end_date)')
    .in(
      'judge_id',
      judges.map((j) => j.id),
    );
  if (linkError) throw linkError;

  const today = todayIso();
  const showsByJudge = new Map<string, JudgeListItem['shows']>();
  for (const link of links as unknown as StaffLink[]) {
    if (!link.judge_id || !link.shows) continue;
    const list = showsByJudge.get(link.judge_id) ?? [];
    if (list.some((s) => s.id === link.shows?.id)) continue;
    list.push({
      id: link.shows.id,
      name: link.shows.name,
      upcoming: isUpcomingShow(
        { startDate: link.shows.start_date, endDate: link.shows.end_date },
        today,
      ),
    });
    showsByJudge.set(link.judge_id, list);
  }

  return judges.map((j) => ({
    id: j.id,
    firstName: j.first_name,
    lastName: j.last_name,
    name: j.name,
    email: j.email,
    phone: j.phone,
    usefId: j.usef_id,
    usefIdSource: j.usef_id_source,
    usefIdEnteredBy: j.usef_id_entered_by,
    usefIdVerifiedAt: j.usef_id_verified_at,
    usefIdUpdatedAt: j.usef_id_updated_at,
    shows: showsByJudge.get(j.id) ?? [],
  }));
}

/**
 * The "add from my judges" picker on a show's Users page.
 *
 * Read with the admin client because the caller may be a Show Admin who can
 * manage this show's staff but is not an organization owner (the judges table is
 * owner-only under RLS). The caller must have already passed the Users page's
 * own access gate; the read is scoped to that organization's id only.
 */
export async function listJudgePickerOptions(orgId: string): Promise<JudgePickerOption[]> {
  const admin = createAdminClient();

  const { data: judges, error } = await admin
    .from('judges')
    .select('id, name, email, usef_id')
    .eq('org_id', orgId)
    .order('name');
  if (error) throw error;
  if (judges.length === 0) return [];

  const { data: links, error: linkError } = await admin
    .from('staff_assignments')
    .select('judge_id, show_id')
    .in(
      'judge_id',
      judges.map((j) => j.id),
    );
  if (linkError) throw linkError;

  const showsByJudge = new Map<string, string[]>();
  for (const link of links) {
    if (!link.judge_id) continue;
    const list = showsByJudge.get(link.judge_id) ?? [];
    list.push(link.show_id);
    showsByJudge.set(link.judge_id, list);
  }

  return judges.map((j) => ({
    id: j.id,
    name: j.name,
    email: j.email,
    usefId: j.usef_id,
    showIds: showsByJudge.get(j.id) ?? [],
  }));
}
