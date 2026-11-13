import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getShowResults } from '@/modules/shows/data/queries';
import { maxPoints } from '@/modules/scoring/scoring-engine';
import { parseTestDefinition } from '@/modules/scoring/utils/parse-test-definition';
import type {
  ExportClass,
  ExportEntry,
  ExportInput,
  ExportJudge,
  ExportPerson,
} from '@/modules/results-export/types';

const text = (value: string | null | undefined): string | null => {
  const v = (value ?? '').trim();
  return v === '' ? null : v;
};

function splitName(name: string): { first: string; last: string } {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return { first: '', last: words[0] ?? '' };
  return { first: words.slice(0, -1).join(' '), last: words[words.length - 1] ?? '' };
}

function judgePctMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [seat, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) out[seat] = n;
  }
  return out;
}

/* Everything the USEF export needs for one show, read as the signed-in user
 * (row-level security applies). Placings come from getShowResults, the same
 * function the Results screen uses, so the file never disagrees with the page. */
export async function getExportInput(showId: string): Promise<ExportInput | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('name, start_date, usef_comp_id')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: classRows, error: classError } = await supabase
    .from('classes')
    .select('id, label, display_name, section_code, qualifying, run_order, date')
    .eq('show_id', showId);
  if (classError) throw classError;
  const classIds = classRows.map((c) => c.id);
  if (classIds.length === 0) {
    return {
      show: { name: show.name, startDate: show.start_date, usefCompId: show.usef_comp_id },
      classes: [],
      entries: [],
    };
  }

  const [entriesRes, testsRes, panelRes, results] = await Promise.all([
    supabase
      .from('class_entries')
      .select(
        'id, class_id, num, rider, rider_id, horse, horse_id, status, final_pct, division, judge_pct, test_override',
      )
      .in('class_id', classIds),
    supabase
      .from('class_tests')
      .select('class_id, name, movements, collectives')
      .in('class_id', classIds),
    supabase
      .from('class_panel')
      .select('class_id, seat_id, judge_staff_id')
      .in('class_id', classIds),
    getShowResults(showId),
  ]);
  if (entriesRes.error) throw entriesRes.error;
  if (testsRes.error) throw testsRes.error;
  if (panelRes.error) throw panelRes.error;
  const entries = entriesRes.data;

  const riderIds = [...new Set(entries.map((e) => e.rider_id).filter((id): id is string => !!id))];
  const horseIds = [...new Set(entries.map((e) => e.horse_id).filter((id): id is string => !!id))];
  const staffIds = [
    ...new Set(panelRes.data.map((p) => p.judge_staff_id).filter((id): id is string => !!id)),
  ];

  const [ridersRes, horsesRes, staffRes] = await Promise.all([
    riderIds.length
      ? supabase
          .from('riders')
          .select(
            'id, first_name, last_name, email, street, city, state, zip, usef, usef_exempt_reason, usdf_number, fei',
          )
          .in('id', riderIds)
      : Promise.resolve({ data: [], error: null }),
    horseIds.length
      ? supabase
          .from('horses')
          .select(
            'id, name, usef_number, passport_number, fei_number, registration_number, year_of_birth, breed, owner_name, owner_street, owner_city, owner_state, owner_zip, owner_usef, owner_usef_exempt_reason, owner_email, trainer, trainer_usef, trainer_street, trainer_city, trainer_state, trainer_zip',
          )
          .in('id', horseIds)
      : Promise.resolve({ data: [], error: null }),
    staffIds.length
      ? supabase
          .from('staff_assignments')
          .select('id, name, first_name, last_name, usef_id, judge_id')
          .in('id', staffIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ridersRes.error) throw ridersRes.error;
  if (horsesRes.error) throw horsesRes.error;
  if (staffRes.error) throw staffRes.error;

  // A judge's USEF ID lives on the organization's judge record, so one correction
  // reaches every class and show they are in. Read with the admin client (the
  // judges table is owner-only under RLS, and the caller may be a Show Admin);
  // the ids come only from this show's own panel, and the access check has
  // already passed. A staff row with no judge record falls back to its own copy.
  const judgeRecordIds = [
    ...new Set(staffRes.data.map((s) => s.judge_id).filter((id): id is string => !!id)),
  ];
  const judgeUsefById = new Map<string, string | null>();
  if (judgeRecordIds.length > 0) {
    const { data: records, error: recordsError } = await createAdminClient()
      .from('judges')
      .select('id, usef_id')
      .in('id', judgeRecordIds);
    if (recordsError) throw recordsError;
    for (const record of records) judgeUsefById.set(record.id, record.usef_id);
  }

  const riderById = new Map(ridersRes.data.map((r) => [r.id, r]));
  const horseById = new Map(horsesRes.data.map((h) => [h.id, h]));
  const staffById = new Map(staffRes.data.map((s) => [s.id, s]));
  const resultByEntry = new Map(results.map((r) => [r.entryId, r]));

  const testByClass = new Map(
    testsRes.data.map((t) => [
      t.class_id,
      parseTestDefinition(t.name, {
        name: t.name,
        movements: t.movements,
        collectives: t.collectives,
      }),
    ]),
  );

  const judgesByClass = new Map<string, ExportJudge[]>();
  for (const seat of [...panelRes.data].sort((a, b) =>
    a.seat_id.localeCompare(b.seat_id, undefined, { numeric: true }),
  )) {
    const staff = seat.judge_staff_id ? staffById.get(seat.judge_staff_id) : undefined;
    if (!staff) continue;
    const fromName = splitName(staff.name);
    const list = judgesByClass.get(seat.class_id) ?? [];
    list.push({
      seatId: seat.seat_id,
      firstName: text(staff.first_name) ?? fromName.first,
      lastName: text(staff.last_name) ?? fromName.last,
      usefId: text(staff.judge_id ? judgeUsefById.get(staff.judge_id) : null) ?? text(staff.usef_id),
    });
    judgesByClass.set(seat.class_id, list);
  }

  const classes: ExportClass[] = classRows.map((c) => ({
    id: c.id,
    title: c.display_name?.trim() ? c.display_name : c.label,
    sectionCode: text(c.section_code),
    qualifying: c.qualifying === true,
    runOrder: c.run_order,
    date: c.date,
    level: testByClass.get(c.id)?.name ?? null,
    judges: judgesByClass.get(c.id) ?? [],
  }));

  const emptyPerson: ExportPerson = {
    firstName: null,
    lastName: null,
    fallbackName: null,
    usef: null,
    noUsefReason: null,
    street: null,
    city: null,
    state: null,
    zip: null,
    email: null,
  };

  const exportEntries: ExportEntry[] = entries.map((e) => {
    const rider = e.rider_id ? riderById.get(e.rider_id) : undefined;
    const horse = e.horse_id ? horseById.get(e.horse_id) : undefined;
    const result = resultByEntry.get(e.id);
    const override = parseTestDefinition(undefined, e.test_override);
    const test = override && override.movements.length > 0 ? override : testByClass.get(e.class_id);

    return {
      classId: e.class_id,
      riderKey: e.rider_id ?? `name:${e.rider ?? e.id}`,
      horseKey: e.horse_id ?? `name:${e.horse ?? e.id}`,
      num: text(e.num),
      status: e.status,
      finalPct: e.final_pct,
      rank: result?.rank ?? null,
      pct: result?.pct ?? null,
      riderDivision: text(e.division),
      judgePct: judgePctMap(e.judge_pct),
      testName: result?.testName ?? null,
      maxPoints: test ? maxPoints(test) : null,
      rider: rider
        ? {
            ...emptyPerson,
            firstName: text(rider.first_name),
            lastName: text(rider.last_name),
            fallbackName: text(e.rider),
            usef: text(rider.usef),
            noUsefReason: text(rider.usef_exempt_reason),
            street: text(rider.street),
            city: text(rider.city),
            state: text(rider.state),
            zip: text(rider.zip),
            email: text(rider.email),
          }
        : { ...emptyPerson, fallbackName: text(e.rider) },
      horse: {
        name: text(horse?.name) ?? text(e.horse),
        usef: text(horse?.usef_number),
        passport: text(horse?.passport_number),
        fei: text(horse?.fei_number),
        registration: text(horse?.registration_number),
        yearOfBirth: text(horse?.year_of_birth),
        breed: text(horse?.breed),
      },
      owner: {
        ...emptyPerson,
        fallbackName: text(horse?.owner_name),
        usef: text(horse?.owner_usef),
        noUsefReason: text(horse?.owner_usef_exempt_reason),
        street: text(horse?.owner_street),
        city: text(horse?.owner_city),
        state: text(horse?.owner_state),
        zip: text(horse?.owner_zip),
        email: text(horse?.owner_email),
      },
      trainer: {
        name: text(horse?.trainer),
        usef: text(horse?.trainer_usef),
        street: text(horse?.trainer_street),
        city: text(horse?.trainer_city),
        state: text(horse?.trainer_state),
        zip: text(horse?.trainer_zip),
      },
      riderDisciplineNumber: text(rider?.usdf_number) ?? text(rider?.fei),
    };
  });

  return {
    show: { name: show.name, startDate: show.start_date, usefCompId: text(show.usef_comp_id) },
    classes,
    entries: exportEntries,
  };
}
