'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import {
  assignJudgeToClassesSchema,
  assignScribeToClassesSchema,
  setClassPanelSchema,
} from '@/modules/judging/schemas';
import { JUDGING_PATH } from '@/modules/judging/constants';

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

  revalidatePath(JUDGING_PATH);
}

export async function setClassPanel(input: unknown): Promise<void> {
  const { classIds, judgeStaffId, scribeStaffId } = setClassPanelSchema.parse(input);
  const supabase = await createServerClient();

  const rows = classIds.map((classId) => ({
    class_id: classId,
    seat_id: 'J1',
    position: 'C',
    judge_staff_id: judgeStaffId,
    scribe_staff_id: scribeStaffId,
  }));

  const { error } = await supabase
    .from('class_panel')
    .upsert(rows, { onConflict: 'class_id,seat_id' });
  if (error) throw new Error(error.message);

  revalidatePath(JUDGING_PATH);
}
