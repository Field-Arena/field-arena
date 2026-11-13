'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput } from '@/shared/lib/action-result';
import {
  assignJudgeToClassesSchema,
  assignScribeToClassesSchema,
  setClassPanelSchema,
} from '@/modules/judging/schemas';
import { JUDGING_PATH } from '@/modules/judging/constants';

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;
type PanelRole = 'judge' | 'scribe';

/* A panel seat may only go to someone staffed on the class's show in the
 * matching role (Judge for the judge seat, Scribe for the scribe seat). The
 * pickers already filter by role; this stops a crafted call seating, say, an
 * Announcer or a judge from another show. */
async function assertPanelRoles(
  supabase: ServerClient,
  classIds: string[],
  picks: { staffId: string; role: PanelRole }[],
): Promise<void> {
  if (picks.length === 0) return;

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, show_id')
    .in('id', [...new Set(classIds)]);
  if (classError) throw new Error(classError.message);
  if (classes.length !== new Set(classIds).size) {
    throw new Error('One of these classes no longer exists.');
  }
  const showIds = new Set(classes.map((c) => c.show_id));

  const { data: staff, error: staffError } = await supabase
    .from('staff_assignments')
    .select('id, show_id, role')
    .in('id', [...new Set(picks.map((p) => p.staffId))]);
  if (staffError) throw new Error(staffError.message);
  const staffById = new Map(staff.map((s) => [s.id, s]));

  for (const pick of picks) {
    const row = staffById.get(pick.staffId);
    const label = pick.role === 'judge' ? 'Judge' : 'Scribe';
    if (row?.role.toLowerCase() !== pick.role) {
      throw new Error(`That person is not staffed as a ${label} on this show.`);
    }
    if (showIds.size !== 1 || !showIds.has(row.show_id)) {
      throw new Error(`That ${label} is staffed on a different show.`);
    }
  }
}

export async function assignJudgeToClasses(input: unknown): Promise<void> {
  const { staffId, classIds } = parseInput(assignJudgeToClassesSchema, input);
  const supabase = await createServerClient();
  await assertPanelRoles(supabase, classIds, [{ staffId, role: 'judge' }]);

  const { data: existingSeats, error: readError } = await supabase
    .from('class_panel')
    .select('class_id, seat_id, position, judge_staff_id, scribe_staff_id')
    .in('class_id', classIds);
  if (readError) throw new Error(readError.message);

  const seatsByClass = new Map<string, typeof existingSeats>();
  for (const seat of existingSeats) {
    const list = seatsByClass.get(seat.class_id) ?? [];
    list.push(seat);
    seatsByClass.set(seat.class_id, list);
  }

  // Already seated on a class (as judge or scribe) → leave it alone rather
  // than opening a second seat for the same person.
  const targetClassIds = [...new Set(classIds)].filter(
    (classId) =>
      !(seatsByClass.get(classId) ?? []).some(
        (s) => s.judge_staff_id === staffId || s.scribe_staff_id === staffId,
      ),
  );
  if (targetClassIds.length === 0) return;

  const rows = targetClassIds.map((classId) => {
    const seats = seatsByClass.get(classId) ?? [];
    const open = seats.find((s) => s.judge_staff_id === null);
    if (open) {
      return {
        class_id: classId,
        seat_id: open.seat_id,
        position: open.position,
        judge_staff_id: staffId,
      };
    }

    const taken = new Set(seats.map((s) => s.seat_id));
    let n = 1;
    while (taken.has(`J${String(n)}`)) n += 1;
    return {
      class_id: classId,
      seat_id: `J${String(n)}`,

      position: n === 1 ? 'C' : null,
      judge_staff_id: staffId,
    };
  });

  const { error } = await supabase
    .from('class_panel')
    .upsert(rows, { onConflict: 'class_id,seat_id' });
  if (error) throw new Error(error.message);

  revalidatePath(JUDGING_PATH);
}

/** Seats a scribe beside a judge on each class. A scribe-only seat can never
 * be signed, so classes with no judge seat free for a scribe are skipped and
 * returned for the caller to surface. */
export async function assignScribeToClasses(input: unknown): Promise<{ skipped: string[] }> {
  const { staffId, classIds } = parseInput(assignScribeToClassesSchema, input);
  const supabase = await createServerClient();
  await assertPanelRoles(supabase, classIds, [{ staffId, role: 'scribe' }]);

  const { data: existingSeats, error: readError } = await supabase
    .from('class_panel')
    .select('class_id, seat_id, position, judge_staff_id, scribe_staff_id')
    .in('class_id', classIds);
  if (readError) throw new Error(readError.message);

  const seatsByClass = new Map<string, typeof existingSeats>();
  for (const seat of existingSeats) {
    const list = seatsByClass.get(seat.class_id) ?? [];
    list.push(seat);
    seatsByClass.set(seat.class_id, list);
  }

  const skipped: string[] = [];
  const rows: {
    class_id: string;
    seat_id: string;
    position: string | null;
    scribe_staff_id: string;
  }[] = [];
  for (const classId of new Set(classIds)) {
    const seats = seatsByClass.get(classId) ?? [];
    if (seats.some((s) => s.judge_staff_id === staffId || s.scribe_staff_id === staffId)) continue;
    const open = seats.find((s) => s.judge_staff_id !== null && s.scribe_staff_id === null);
    if (!open) {
      skipped.push(classId);
      continue;
    }
    rows.push({
      class_id: classId,
      seat_id: open.seat_id,
      position: open.position,
      scribe_staff_id: staffId,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from('class_panel')
      .upsert(rows, { onConflict: 'class_id,seat_id' });
    if (error) throw new Error(error.message);
  }

  revalidatePath(JUDGING_PATH);
  return { skipped };
}

export async function setClassPanel(input: unknown): Promise<void> {
  const { classIds, judgeStaffId, scribeStaffId } = parseInput(setClassPanelSchema, input);
  const supabase = await createServerClient();
  await assertPanelRoles(supabase, classIds, [
    ...(judgeStaffId ? [{ staffId: judgeStaffId, role: 'judge' as const }] : []),
    ...(scribeStaffId ? [{ staffId: scribeStaffId, role: 'scribe' as const }] : []),
  ]);

  const { data: existingSeats, error: readError } = await supabase
    .from('class_panel')
    .select('class_id, seat_id, judge_staff_id, scribe_staff_id')
    .in('class_id', classIds);
  if (readError) throw new Error(readError.message);

  // A field left at "— none —" keeps what J1 already has instead of wiping it,
  // so saving only a scribe can't strip the seat's judge and leave a seat
  // nobody can sign.
  const rows = [...new Set(classIds)].map((classId) => {
    const seats = existingSeats.filter((s) => s.class_id === classId);
    const j1 = seats.find((s) => s.seat_id === 'J1');
    const judge = judgeStaffId ?? j1?.judge_staff_id ?? null;
    const scribe = scribeStaffId ?? j1?.scribe_staff_id ?? null;
    if (judge === null) {
      throw new Error('Pick a judge — a scribe can only sit beside a judge.');
    }
    if (judge === scribe) {
      throw new Error('The same person cannot be both judge and scribe on a seat.');
    }
    const elsewhere = seats.filter((s) => s.seat_id !== 'J1');
    if (
      elsewhere.some((s) =>
        [s.judge_staff_id, s.scribe_staff_id].some(
          (id) => id !== null && (id === judge || id === scribe),
        ),
      )
    ) {
      throw new Error('That person already sits on another seat in one of these classes.');
    }
    return {
      class_id: classId,
      seat_id: 'J1',
      position: 'C',
      judge_staff_id: judge,
      scribe_staff_id: scribe,
    };
  });

  const { error } = await supabase
    .from('class_panel')
    .upsert(rows, { onConflict: 'class_id,seat_id' });
  if (error) throw new Error(error.message);

  revalidatePath(JUDGING_PATH);
}
