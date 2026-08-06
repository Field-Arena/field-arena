'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assignJudgeToClassesSchema, assignScribeToClassesSchema } from '../schemas';

/**
 * Seats a judge on a class's panel — the write side of what
 * `listMyAssignments` (data/queries.ts) reads from `class_panel`, which had
 * no write path anywhere in this codebase before this.
 *
 * Ported from legacy's addJudgeToClass/realSyncPanel (showstaff.html
 * ~9679-9696, 9646-9656), called from the "+ Add User" modal's Judge-classes
 * checklist right after the new staff row is created — adapted to this
 * schema's real seat model rather than legacy's: legacy used the judge's own
 * id as a free-text seat identifier directly; here `class_panel.seat_id`
 * follows the seeded 'J1'/'J2'/... convention (see supabase/seed.sql's
 * judge-panel block), enforced by a real `unique (class_id, seat_id)`
 * constraint.
 *
 * Fills the first open seat (no judge yet) on each class if one exists,
 * otherwise opens a fresh 'J{n}' seat — good enough for "check some classes
 * while inviting a judge," not a full multi-judge seat picker, which the
 * per-class panel screen already owns and this does not attempt to replace.
 */
export async function assignJudgeToClasses(input: unknown): Promise<void> {
  const { staffId, classIds } = assignJudgeToClassesSchema.parse(input);
  const supabase = await createServerClient();

  const { data: existingSeats, error: readError } = await supabase
    .from('class_panel')
    .select('class_id, seat_id, position, judge_staff_id')
    .in('class_id', classIds);
  if (readError) throw new Error(readError.message);

  const seatsByClass = new Map<string, typeof existingSeats>();
  for (const seat of existingSeats) {
    const list = seatsByClass.get(seat.class_id) ?? [];
    list.push(seat);
    seatsByClass.set(seat.class_id, list);
  }

  const rows = classIds.map((classId) => {
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
      // 'C' matches the seeded single-judge default; a second-or-later seat
      // opened here has no natural default position, left for the per-class
      // panel screen to set.
      position: n === 1 ? 'C' : null,
      judge_staff_id: staffId,
    };
  });

  const { error } = await supabase
    .from('class_panel')
    .upsert(rows, { onConflict: 'class_id,seat_id' });
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/judging');
}

/**
 * Seats a scribe on a class's panel — the scribe-side counterpart of
 * `assignJudgeToClasses` above, called from the same "+ Add User" modal's
 * class checklist when the invited role is Scribe instead of Judge.
 *
 * A scribe records for a specific judge's seat, so this prefers an existing
 * seat that already has a judge but no scribe yet (the real pairing case)
 * over opening a brand-new seat — but falls back to opening one if every
 * seat on this class already has a scribe, same "good enough for check some
 * classes while inviting" scope as the judge version; a seat with neither a
 * judge nor a scribe yet is filled in either order, whichever gets assigned
 * first.
 */
export async function assignScribeToClasses(input: unknown): Promise<void> {
  const { staffId, classIds } = assignScribeToClassesSchema.parse(input);
  const supabase = await createServerClient();

  const { data: existingSeats, error: readError } = await supabase
    .from('class_panel')
    .select('class_id, seat_id, position, scribe_staff_id')
    .in('class_id', classIds);
  if (readError) throw new Error(readError.message);

  const seatsByClass = new Map<string, typeof existingSeats>();
  for (const seat of existingSeats) {
    const list = seatsByClass.get(seat.class_id) ?? [];
    list.push(seat);
    seatsByClass.set(seat.class_id, list);
  }

  const rows = classIds.map((classId) => {
    const seats = seatsByClass.get(classId) ?? [];
    const open = seats.find((s) => s.scribe_staff_id === null);
    if (open) {
      return {
        class_id: classId,
        seat_id: open.seat_id,
        position: open.position,
        scribe_staff_id: staffId,
      };
    }

    const taken = new Set(seats.map((s) => s.seat_id));
    let n = 1;
    while (taken.has(`J${String(n)}`)) n += 1;
    return {
      class_id: classId,
      seat_id: `J${String(n)}`,
      position: n === 1 ? 'C' : null,
      scribe_staff_id: staffId,
    };
  });

  const { error } = await supabase
    .from('class_panel')
    .upsert(rows, { onConflict: 'class_id,seat_id' });
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/judging');
}
