'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { parseInput } from '@/shared/lib/action-result';
import { getStaffProfile } from '@/shared/lib/auth/session';
import {
  getEffectiveTestForEntry,
  getMyScoringPermissions,
  getMySeat,
  getTestForClass,
} from '@/modules/scoring/data/queries';
import {
  averagePct,
  clampMark,
  collectivesTotal,
  isSheetComplete,
  sheetPct,
} from '@/modules/scoring/scoring-engine';
import { resolveCurrentRideIndex } from '@/shared/lib/current-ride';
import { asBooleanMap } from '@/modules/scoring/utils/as-boolean-map';
import { asStringMap } from '@/modules/scoring/utils/as-string-map';
import { parseMarkMap } from '@/modules/scoring/utils/parse-mark-map';
import { toSheet } from '@/modules/scoring/utils/to-sheet';
import { JUDGING_PATH, JUDGING_HISTORY_PATH } from '@/modules/scoring/constants';
import type { Json } from '@/shared/types/database.types';
import type { PublishResultsOutcome } from '@/modules/scoring/types';
import {
  addHoldingEntrySchema,
  advanceRideSchema,
  correctEntrySchema,
  disqualifyRideSchema,
  markOrderCheckedSchema,
  publishResultsSchema,
  removeHoldingEntrySchema,
  removePanelSeatSchema,
  reopenScoresheetSchema,
  scratchRideSchema,
  setClassEntriesSchema,
  setClassTestSchema,
  setCollectiveSchema,
  setFinalRemarksSchema,
  setMarkSchema,
  setRemarkSchema,
  skipRideSchema,
  startRideSchema,
  submitScoresheetSchema,
  toggleErrorAtSchema,
  toggleScoringOpenSchema,
  unfinishRideSchema,
  unpublishResultsSchema,
  unskipRideSchema,
  upsertPanelSeatSchema,
  workInEntrySchema,
} from '@/modules/scoring/schemas';

const ORG_LEVEL_ROLES = new Set(['Organizer', 'Show Admin', 'SuperAdmin']);

async function assertSeatAccess(classId: string, seatId: string, seatRole: 'judge' | 'scribe') {
  const profile = await getStaffProfile();
  if (profile?.platform_role && ORG_LEVEL_ROLES.has(profile.platform_role)) {
    return { signerName: profile.name };
  }

  const mySeat = await getMySeat(classId);
  if (mySeat?.seatId !== seatId || mySeat.role !== seatRole) {
    throw new Error('You do not have permission to score this seat.');
  }
  return { signerName: mySeat.name };
}

// Class-level, not per-seat: any scribe seated on this class's panel may
// mark it, not just one specific seat_id. The real boundary is the
// assert_order_check_scribe_seat trigger on class_order_checks — this is
// UX only, same as assertSeatAccess above.
async function assertScribeSeatOnClass(classId: string): Promise<void> {
  const profile = await getStaffProfile();
  if (profile?.platform_role && ORG_LEVEL_ROLES.has(profile.platform_role)) return;

  const mySeat = await getMySeat(classId);
  if (mySeat?.role !== 'scribe') {
    throw new Error('You do not have permission to check ride order for this class.');
  }
}

async function getScoreRow(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  entryId: string,
  seatId: string,
) {
  const { data, error } = await supabase
    .from('scores')
    .select(
      'id, class_id, entry_id, seat_id, movements, collectives, errors, error_at, remarks, final_remarks, submitted, signed_by',
    )
    .eq('entry_id', entryId)
    .eq('seat_id', seatId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Once a judge signs and submits, the sheet is frozen until it is reopened
// (reopenScoresheet clears submitted + signature). Edits used to silently
// un-submit a signed sheet while leaving the signature in place.
function assertSheetEditable(row: { submitted: boolean | null; signed_by?: string | null } | null) {
  if (row?.submitted || row?.signed_by) {
    throw new Error('This scoresheet has been signed and submitted — reopen it before editing.');
  }
}

async function writeMark(params: {
  classId: string;
  entryId: string;
  seatId: string;
  seatRole: 'judge' | 'scribe';
  field: 'movements' | 'collectives';
  key: string;
  value: number;
}) {
  await assertSeatAccess(params.classId, params.seatId, params.seatRole);

  const supabase = await createServerClient();
  const existing = await getScoreRow(supabase, params.entryId, params.seatId);
  assertSheetEditable(existing);
  const map = parseMarkMap(existing?.[params.field]);

  const current = map[params.key];
  if (current?.enteredBy === 'judge' && params.seatRole === 'scribe') {
    throw new Error("This mark was entered by the judge and can't be overwritten by a scribe.");
  }

  const patch = {
    [params.key]: { value: clampMark(params.value), enteredBy: params.seatRole },
  } as unknown as Json;

  const { error: mergeError } = await supabase.rpc('merge_score_json', {
    p_class_id: params.classId,
    p_entry_id: params.entryId,
    p_seat_id: params.seatId,
    p_field: params.field,
    p_patch: patch,
  });
  if (mergeError) throw mergeError;

  // No revalidatePath here deliberately — see the module doc comment at the
  // top of this file.
}

export async function setMark(input: unknown) {
  const parsed = parseInput(setMarkSchema, input);
  await writeMark({
    classId: parsed.classId,
    entryId: parsed.entryId,
    seatId: parsed.seatId,
    seatRole: parsed.seatRole,
    field: 'movements',
    key: String(parsed.movementNum),
    value: parsed.value,
  });
}

export async function setCollective(input: unknown) {
  const parsed = parseInput(setCollectiveSchema, input);
  await writeMark({
    classId: parsed.classId,
    entryId: parsed.entryId,
    seatId: parsed.seatId,
    seatRole: parsed.seatRole,
    field: 'collectives',
    key: parsed.key,
    value: parsed.value,
  });
}

export async function setRemark(input: unknown) {
  const parsed = parseInput(setRemarkSchema, input);
  await assertSeatAccess(
    parsed.classId,
    parsed.seatId,
    await seatRoleFor(parsed.classId, parsed.seatId),
  );

  const supabase = await createServerClient();
  assertSheetEditable(await getScoreRow(supabase, parsed.entryId, parsed.seatId));
  const patch = { [String(parsed.movementNum)]: parsed.text } as unknown as Json;

  const { error } = await supabase.rpc('merge_score_json', {
    p_class_id: parsed.classId,
    p_entry_id: parsed.entryId,
    p_seat_id: parsed.seatId,
    p_field: 'remarks',
    p_patch: patch,
  });
  if (error) throw error;
}

export async function setFinalRemarks(input: unknown) {
  const parsed = parseInput(setFinalRemarksSchema, input);
  await assertSeatAccess(
    parsed.classId,
    parsed.seatId,
    await seatRoleFor(parsed.classId, parsed.seatId),
  );

  const supabase = await createServerClient();
  const existing = await getScoreRow(supabase, parsed.entryId, parsed.seatId);
  assertSheetEditable(existing);

  const { error } = await supabase.from('scores').upsert(
    {
      id: existing?.id,
      class_id: parsed.classId,
      entry_id: parsed.entryId,
      seat_id: parsed.seatId,
      final_remarks: parsed.text,
    },
    { onConflict: 'entry_id,seat_id' },
  );
  if (error) throw error;
}

export async function toggleErrorAt(input: unknown) {
  const parsed = parseInput(toggleErrorAtSchema, input);
  await assertSeatAccess(
    parsed.classId,
    parsed.seatId,
    await seatRoleFor(parsed.classId, parsed.seatId),
  );

  const supabase = await createServerClient();
  const existing = await getScoreRow(supabase, parsed.entryId, parsed.seatId);
  assertSheetEditable(existing);
  const key = String(parsed.movementNum);
  // The client sends the state it wants; toggling server-side from a stale
  // read let two quick taps cancel out or double-apply.
  const nextValue = parsed.value ?? !asBooleanMap(existing?.error_at)[key];

  const patch = { [key]: nextValue } as unknown as Json;
  const { error: mergeError } = await supabase.rpc('merge_score_json', {
    p_class_id: parsed.classId,
    p_entry_id: parsed.entryId,
    p_seat_id: parsed.seatId,
    p_field: 'error_at',
    p_patch: patch,
  });
  if (mergeError) throw mergeError;
  // scores.errors is recomputed from error_at by the scores_sync_error_count
  // trigger inside the same UPDATE, so judge and scribe toggles can't race.
}

export async function submitScoresheet(input: unknown) {
  const parsed = parseInput(submitScoresheetSchema, input);

  const mySeat = await getMySeat(parsed.classId);
  if (mySeat?.seatId !== parsed.seatId || mySeat.role !== 'judge') {
    throw new Error('Only the judge on this seat can sign and submit.');
  }

  const supabase = await createServerClient();
  const existing = await getScoreRow(supabase, parsed.entryId, parsed.seatId);
  if (!existing) throw new Error('Nothing has been scored yet.');
  if (existing.submitted) throw new Error('This scoresheet is already signed and submitted.');

  const test = await getEffectiveTestForEntry(parsed.classId, parsed.entryId);
  if (!test) throw new Error('This class has no test assigned, so it cannot be signed.');
  if (!isSheetComplete(toSheet(toPlainSheetInput(existing)), test)) {
    throw new Error('Every movement and collective mark needs a value before signing.');
  }

  const { error } = await supabase
    .from('scores')
    .update({ submitted: true, signed_by: mySeat.name, signed_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function reopenScoresheet(input: unknown) {
  const parsed = parseInput(reopenScoresheetSchema, input);
  const permissions = await getMyScoringPermissions(parsed.classId);
  if (!permissions.canEditShow) {
    throw new Error('Only show management can reopen a signed scoresheet.');
  }
  const supabase = await createServerClient();

  const existing = await getScoreRow(supabase, parsed.entryId, parsed.seatId);
  if (!existing) throw new Error('Nothing to reopen.');

  const { error } = await supabase
    .from('scores')
    .update({ submitted: false, signed_by: null, signed_at: null })
    .eq('id', existing.id);
  if (error) throw error;

  const { data: entry, error: entryError } = await supabase
    .from('class_entries')
    .select('correction')
    .eq('id', parsed.entryId)
    .single();
  if (entryError) throw entryError;

  const note = `Scoresheet reopened: ${parsed.reason} — ${new Date().toLocaleString()}`;
  const correction = entry.correction ? `${entry.correction}\n${note}` : note;

  const { error: updateError } = await supabase
    .from('class_entries')
    .update({ correction })
    .eq('id', parsed.entryId);
  if (updateError) throw updateError;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function correctEntry(input: unknown) {
  const parsed = parseInput(correctEntrySchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('class_entries')
    .update({ correction: parsed.note })
    .eq('id', parsed.entryId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function advanceRide(input: unknown) {
  const parsed = parseInput(advanceRideSchema, input);
  const supabase = await createServerClient();

  const [entryRes, panelRes, scoresRes, classRes] = await Promise.all([
    supabase
      .from('class_entries')
      .select('*')
      .eq('id', parsed.entryId)
      .eq('class_id', parsed.classId)
      .single(),
    supabase.from('class_panel').select('seat_id, judge_staff_id').eq('class_id', parsed.classId),
    supabase.from('scores').select('*').eq('entry_id', parsed.entryId),
    supabase.from('classes').select('working_in_entry_id').eq('id', parsed.classId).single(),
  ]);
  if (entryRes.error) throw entryRes.error;
  if (panelRes.error) throw panelRes.error;
  if (scoresRes.error) throw scoresRes.error;
  if (classRes.error) throw classRes.error;

  // A second client's auto-advance (or a retry) landing after the first one
  // must not re-finalize the ride with a new timestamp.
  if (entryRes.data.advanced_past || entryRes.data.status !== 'scheduled') {
    await syncScoringPointer(parsed.classId);
    return;
  }

  // Only seats with a judge can ever sign, so they are the panel. With none,
  // there is nothing to wait for — refusing here stops an empty panel from
  // auto-advancing through the whole class with blank scores.
  const judgeSeats = panelRes.data.filter((seat) => seat.judge_staff_id !== null);
  if (judgeSeats.length === 0) throw new Error('No judges are assigned to this class yet.');

  const scoreBySeat = new Map(scoresRes.data.map((s) => [s.seat_id, s]));
  const allReady = judgeSeats.every((seat) => scoreBySeat.get(seat.seat_id)?.submitted);
  if (!allReady) throw new Error('Not every judge has submitted yet.');

  // Score against the ride's own test when it has one (test_override), the
  // same test the sheet was marked on — not always the class test.
  const test = await getEffectiveTestForEntry(parsed.classId, parsed.entryId);
  const judgePct: Record<string, string> = {};
  const perSeatScores = [];
  for (const seat of judgeSeats) {
    const row = scoreBySeat.get(seat.seat_id);
    if (!row) continue;
    const pct = test ? sheetPct(toSheet(toPlainSheetInput(row)), test) : null;
    if (pct !== null) judgePct[seat.seat_id] = String(pct);
    perSeatScores.push({ row, pct });
  }

  const finalPct = averagePct(
    perSeatScores.map((s) => (typeof s.pct === 'number' || s.pct === 'ELIM' ? s.pct : null)),
  );
  const ctot = test
    ? collectivesTotal(
        perSeatScores.map((s) => toSheet(toPlainSheetInput(s.row))),
        test,
      )
    : null;

  const { error: entryUpdateError } = await supabase
    .from('class_entries')
    .update({
      status: 'scored',
      advanced_past: true,
      final_pct: finalPct === null ? null : String(finalPct),
      judge_pct: judgePct,
      collective_total: ctot,
      finalized_at: new Date().toISOString(),
    })
    .eq('id', parsed.entryId);
  if (entryUpdateError) throw entryUpdateError;

  await advanceClassPointer(supabase, parsed.classId, parsed.entryId, classRes.data);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function scratchRide(input: unknown) {
  const parsed = parseInput(scratchRideSchema, input);
  await setTerminalStatus(parsed.classId, parsed.entryId, 'scratched', null);
}

export async function disqualifyRide(input: unknown) {
  const parsed = parseInput(disqualifyRideSchema, input);
  await setTerminalStatus(parsed.classId, parsed.entryId, 'disqualified', parsed.reason);
}

async function setTerminalStatus(
  classId: string,
  entryId: string,
  status: 'scratched' | 'disqualified',
  reason: string | null,
) {
  const supabase = await createServerClient();

  const { data: classRow, error: classError } = await supabase
    .from('classes')
    .select('working_in_entry_id')
    .eq('id', classId)
    .single();
  if (classError) throw classError;

  const { error } = await supabase
    .from('class_entries')
    .update({
      status,
      advanced_past: true,
      final_pct: status === 'scratched' ? 'SCR' : 'ELIM',
      reason,
      finalized_at: new Date().toISOString(),
    })
    .eq('id', entryId);
  if (error) throw error;

  await advanceClassPointer(supabase, classId, entryId, classRow);

  revalidatePath(`/dashboard/scoring/${classId}`);
}

export async function unfinishRide(input: unknown) {
  const parsed = parseInput(unfinishRideSchema, input);
  const supabase = await createServerClient();

  const { data: entry, error: entryError } = await supabase
    .from('class_entries')
    .select('status')
    .eq('id', parsed.entryId)
    .eq('class_id', parsed.classId)
    .single();
  if (entryError) throw entryError;

  if (entry.status !== 'scratched' && entry.status !== 'disqualified') {
    throw new Error("This rider isn't currently scratched or disqualified.");
  }

  const { error } = await supabase
    .from('class_entries')
    .update({
      status: 'scheduled',
      advanced_past: false,
      final_pct: null,
      reason: null,
      finalized_at: null,
    })
    .eq('id', parsed.entryId);
  if (error) throw error;

  // The restored ride is unfinished again, so if it sits before the current
  // one it becomes the ride in the ring — the pointer is re-derived from the
  // rides rather than set from ride_order (which may be 0-based or gappy).
  await syncScoringPointer(parsed.classId);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function skipRide(input: unknown) {
  const parsed = parseInput(skipRideSchema, input);
  await swapRideOrder(parsed.classId, parsed.entryId, 1);
  await syncScoringPointer(parsed.classId);
  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function unskipRide(input: unknown) {
  const parsed = parseInput(unskipRideSchema, input);
  await swapRideOrder(parsed.classId, parsed.entryId, -1);
  await syncScoringPointer(parsed.classId);
  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

async function swapRideOrder(classId: string, entryId: string, direction: 1 | -1) {
  const supabase = await createServerClient();

  const { data: entries, error } = await supabase
    .from('class_entries')
    .select('id, ride_order')
    .eq('class_id', classId)
    .eq('holding', false)
    .order('ride_order')
    .order('id');
  if (error) throw error;

  const idx = entries.findIndex((e) => e.id === entryId);
  const neighborIdx = idx + direction;
  if (idx === -1 || neighborIdx < 0 || neighborIdx >= entries.length) return;

  const current = entries[idx];
  const neighbor = entries[neighborIdx];
  if (!current || !neighbor) return;

  const { error: e1 } = await supabase
    .from('class_entries')
    .update({ ride_order: neighbor.ride_order })
    .eq('id', current.id);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('class_entries')
    .update({ ride_order: current.ride_order })
    .eq('id', neighbor.id);
  if (e2) throw e2;
}

/**
 * Stamps ride_started_at on the ride now in the ring (first time only) and
 * freezes the catalog test into class_tests if the class has none yet. This
 * used to happen as a side effect of the polled GET; it now only runs for a
 * panel member or show manager, and never overwrites an existing value.
 */
export async function startRide(input: unknown) {
  const parsed = parseInput(startRideSchema, input);

  const supabase = await createServerClient();

  // Scoped to this show (has_show_permission covers the owning org and
  // SuperAdmin), not to the caller's platform role: the writes below use the
  // admin client, and classes of published shows are readable by anyone.
  const mySeat = await getMySeat(parsed.classId);
  if (!mySeat) {
    const { data: cls, error: clsError } = await supabase
      .from('classes')
      .select('show_id')
      .eq('id', parsed.classId)
      .single();
    if (clsError) throw clsError;
    const { data: allowed } = await supabase.rpc('has_show_permission', {
      target_show_id: cls.show_id,
      permission_key: 'canEnterScores',
    });
    if (allowed !== true) {
      throw new Error('You do not have permission to start rides in this class.');
    }
  }

  const [classRes, ridesRes] = await Promise.all([
    supabase.from('classes').select('working_in_entry_id').eq('id', parsed.classId).single(),
    supabase
      .from('class_entries')
      .select('id, status, advanced_past')
      .eq('class_id', parsed.classId)
      .eq('holding', false)
      .order('ride_order')
      .order('id'),
  ]);
  if (classRes.error) throw classRes.error;
  if (ridesRes.error) throw ridesRes.error;

  const rides = ridesRes.data.map((r) => ({
    id: r.id,
    status: r.status,
    advancedPast: r.advanced_past ?? false,
  }));
  const currentId =
    classRes.data.working_in_entry_id ?? rides[resolveCurrentRideIndex(rides)]?.id ?? null;
  // A stale client asking to start a ride that is no longer in the ring.
  if (currentId !== parsed.entryId) return;

  // Admin client: ride_started_at / class_tests are bookkeeping a judge's own
  // role can't write. Access was checked above; both writes are first-only.
  const admin = createAdminClient();
  const { error: stampError } = await admin
    .from('class_entries')
    .update({ ride_started_at: new Date().toISOString() })
    .eq('id', parsed.entryId)
    .eq('class_id', parsed.classId)
    .is('ride_started_at', null);
  if (stampError) throw stampError;

  const test = await getTestForClass(parsed.classId);
  if (test) {
    const { error: seedError } = await admin.from('class_tests').upsert(
      {
        class_id: parsed.classId,
        name: test.name,
        movements: test.movements as unknown as Json,
        collectives: test.collectives as unknown as Json,
      },
      { onConflict: 'class_id', ignoreDuplicates: true },
    );
    if (seedError) throw seedError;
  }
}

export async function addHoldingEntry(input: unknown) {
  const parsed = parseInput(addHoldingEntrySchema, input);
  const supabase = await createServerClient();

  const { data: entries, error: countError } = await supabase
    .from('class_entries')
    .select('ride_order')
    .eq('class_id', parsed.classId)
    .order('ride_order', { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextOrder = (entries[0]?.ride_order ?? 0) + 1;

  const { error } = await supabase.from('class_entries').insert({
    class_id: parsed.classId,
    num: parsed.num,
    rider: parsed.rider ?? null,
    horse: parsed.horse ?? null,
    ride_order: nextOrder,
    status: 'scheduled',
    holding: true,
  });
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function removeHoldingEntry(input: unknown) {
  const parsed = parseInput(removeHoldingEntrySchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('class_entries')
    .delete()
    .eq('id', parsed.entryId)
    .eq('holding', true);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function workInEntry(input: unknown) {
  const parsed = parseInput(workInEntrySchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ working_in_entry_id: parsed.entryId })
    .eq('id', parsed.classId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function upsertPanelSeat(input: unknown) {
  const parsed = parseInput(upsertPanelSeatSchema, input);
  const supabase = await createServerClient();

  const [panelRes, classRes] = await Promise.all([
    supabase
      .from('class_panel')
      .select('seat_id, judge_staff_id, scribe_staff_id')
      .eq('class_id', parsed.classId),
    supabase.from('classes').select('show_id').eq('id', parsed.classId).single(),
  ]);
  if (panelRes.error) throw panelRes.error;
  if (classRes.error) throw classRes.error;

  const others = panelRes.data.filter((p) => p.seat_id !== parsed.seatId);
  const current = panelRes.data.find((p) => p.seat_id === parsed.seatId);
  const nextJudge =
    parsed.judgeStaffId !== undefined ? parsed.judgeStaffId : (current?.judge_staff_id ?? null);
  const nextScribe =
    parsed.scribeStaffId !== undefined ? parsed.scribeStaffId : (current?.scribe_staff_id ?? null);

  const assigned = [nextJudge, nextScribe].filter((id): id is string => id !== null);
  if (nextJudge !== null && nextJudge === nextScribe) {
    throw new Error('The same person cannot be both judge and scribe on a seat.');
  }
  for (const staffId of assigned) {
    if (others.some((p) => p.judge_staff_id === staffId || p.scribe_staff_id === staffId)) {
      throw new Error('That person already sits on another seat in this class.');
    }
  }
  if (nextScribe !== null && nextJudge === null) {
    throw new Error('Assign a judge to this seat before adding a scribe.');
  }

  if (assigned.length > 0) {
    const { data: staff, error: staffError } = await supabase
      .from('staff_assignments')
      .select('id, role')
      .eq('show_id', classRes.data.show_id)
      .in('id', assigned);
    if (staffError) throw staffError;
    const roleById = new Map(staff.map((s) => [s.id, s.role]));
    if (nextJudge !== null && roleById.get(nextJudge) !== 'Judge') {
      throw new Error('That judge is not on staff for this show.');
    }
    if (nextScribe !== null && roleById.get(nextScribe) !== 'Scribe') {
      throw new Error('That scribe is not on staff for this show.');
    }
  }

  const row: {
    class_id: string;
    seat_id: string;
    position?: string | null;
    judge_staff_id?: string | null;
    scribe_staff_id?: string | null;
  } = {
    class_id: parsed.classId,
    seat_id: parsed.seatId,
  };
  if (parsed.position !== undefined) row.position = parsed.position;
  if (parsed.judgeStaffId !== undefined) row.judge_staff_id = parsed.judgeStaffId;
  if (parsed.scribeStaffId !== undefined) row.scribe_staff_id = parsed.scribeStaffId;

  const { error } = await supabase
    .from('class_panel')
    .upsert(row, { onConflict: 'class_id,seat_id' });
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function removePanelSeat(input: unknown) {
  const parsed = parseInput(removePanelSeatSchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('class_panel')
    .delete()
    .eq('class_id', parsed.classId)
    .eq('seat_id', parsed.seatId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function setClassTest(input: unknown) {
  const parsed = parseInput(setClassTestSchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('class_tests').upsert(
    {
      class_id: parsed.classId,
      name: parsed.name,
      edition: parsed.edition ?? null,
      movements: parsed.movements,
      collectives: parsed.collectives,
    },
    { onConflict: 'class_id' },
  );
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function setClassEntries(input: unknown) {
  const parsed = parseInput(setClassEntriesSchema, input);
  const supabase = await createServerClient();

  const { error: deleteScoresError } = await supabase
    .from('scores')
    .delete()
    .eq('class_id', parsed.classId);
  if (deleteScoresError) throw deleteScoresError;

  const { error: deleteEntriesError } = await supabase
    .from('class_entries')
    .delete()
    .eq('class_id', parsed.classId);
  if (deleteEntriesError) throw deleteEntriesError;

  if (parsed.entries.length > 0) {
    const { error: insertError } = await supabase.from('class_entries').insert(
      parsed.entries.map((e, i) => ({
        class_id: parsed.classId,
        draw: e.draw ?? null,
        num: e.num,
        rider: e.rider ?? null,
        horse: e.horse ?? null,
        ride_order: i + 1,
        status: 'scheduled',
        holding: false,
      })),
    );
    if (insertError) throw insertError;
  }
  await syncScoringPointer(parsed.classId);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function toggleScoringOpen(input: unknown) {
  const parsed = parseInput(toggleScoringOpenSchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ scoring_open: parsed.open })
    .eq('id', parsed.classId);
  if (error) throw error;
  if (parsed.open) await syncScoringPointer(parsed.classId);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function markOrderChecked(input: unknown) {
  const parsed = parseInput(markOrderCheckedSchema, input);
  await assertScribeSeatOnClass(parsed.classId);
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { error } = await supabase
    .from('class_order_checks')
    .upsert(
      { class_id: parsed.classId, checked_at: new Date().toISOString(), checked_by: user.id },
      { onConflict: 'class_id' },
    );
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function publishResults(input: unknown): Promise<PublishResultsOutcome> {
  const parsed = parseInput(publishResultsSchema, input);
  const supabase = await createServerClient();

  if (!parsed.force) {
    const [entriesRes, panelRes, scoresRes] = await Promise.all([
      supabase
        .from('class_entries')
        .select('id, status, advanced_past, holding')
        .eq('class_id', parsed.classId),
      supabase.from('class_panel').select('seat_id, judge_staff_id').eq('class_id', parsed.classId),
      supabase.from('scores').select('entry_id, seat_id, submitted').eq('class_id', parsed.classId),
    ]);
    if (entriesRes.error) throw entriesRes.error;
    if (panelRes.error) throw panelRes.error;
    if (scoresRes.error) throw scoresRes.error;

    const judgeSeatIds = panelRes.data
      .filter((p) => p.judge_staff_id !== null)
      .map((p) => p.seat_id);
    const submitted = new Set(
      scoresRes.data.filter((s) => s.submitted).map((s) => `${s.entry_id}:${s.seat_id}`),
    );
    // A ride still to go, or a scored ride whose sheet was reopened and not
    // re-signed, would publish a wrong or missing result.
    const incomplete = entriesRes.data.filter((e) => {
      if (e.status === 'scratched' || e.status === 'disqualified') return false;
      if (e.status !== 'scored' && !e.advanced_past) return !e.holding;
      return judgeSeatIds.some((seatId) => !submitted.has(`${e.id}:${seatId}`));
    }).length;
    if (incomplete > 0) return { published: false, incomplete };
  }

  const { error } = await supabase
    .from('classes')
    .update({ results_published: true, results_published_at: new Date().toISOString() })
    .eq('id', parsed.classId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
  revalidatePath(JUDGING_PATH);
  revalidatePath(JUDGING_HISTORY_PATH);
  return { published: true, incomplete: 0 };
}

export async function unpublishResults(input: unknown) {
  const parsed = parseInput(unpublishResultsSchema, input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ results_published: false, results_published_at: null })
    .eq('id', parsed.classId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
  revalidatePath(JUDGING_PATH);
  revalidatePath(JUDGING_HISTORY_PATH);
}

async function seatRoleFor(classId: string, seatId: string): Promise<'judge' | 'scribe'> {
  const mySeat = await getMySeat(classId);
  if (mySeat?.seatId === seatId) return mySeat.role;

  return 'judge';
}

function toPlainSheetInput(row: {
  movements: unknown;
  collectives: unknown;
  errors: number | null;
  final_remarks: string | null;
  remarks: unknown;
  submitted: boolean | null;
}) {
  return {
    movements: parseMarkMap(row.movements),
    collectives: parseMarkMap(row.collectives),
    errors: row.errors ?? 0,
    finalRemarks: row.final_remarks ?? '',
    remarks: asStringMap(row.remarks),
    submitted: row.submitted ?? false,
  };
}

async function advanceClassPointer(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  classId: string,
  entryId: string,
  classRow: { working_in_entry_id: string | null },
) {
  if (classRow.working_in_entry_id === entryId) {
    const { error } = await supabase
      .from('classes')
      .update({ working_in_entry_id: null })
      .eq('id', classId);
    if (error) throw error;
  }

  await syncScoringPointer(classId);
}

/**
 * Stores the index of the ride in the ring (first unfinished, non-holding
 * entry in running order) in classes.scoring_pos. Readers outside scoring
 * (rider schedule estimate) use it as "rides already through"; scoring and
 * the announcer always re-derive the current ride from the entries.
 *
 * Runs after the caller's own write succeeded, as the caller:
 * assert_classes_write_permission admits a scoring_pos-only change for
 * canEnterScores. Best effort — the pointer is a cache for the rider
 * estimate, so a failure here is logged rather than failing the action
 * whose real write already committed.
 */
async function syncScoringPointer(classId: string) {
  try {
    await writeScoringPointer(classId);
  } catch (error) {
    console.error('syncScoringPointer failed', classId, error);
  }
}

async function writeScoringPointer(classId: string) {
  const supabase = await createServerClient();
  const [classRes, ridesRes] = await Promise.all([
    supabase.from('classes').select('scoring_pos').eq('id', classId).single(),
    supabase
      .from('class_entries')
      .select('status, advanced_past')
      .eq('class_id', classId)
      .eq('holding', false)
      .order('ride_order')
      .order('id'),
  ]);
  if (classRes.error) throw classRes.error;
  if (ridesRes.error) throw ridesRes.error;

  const pos = resolveCurrentRideIndex(
    ridesRes.data.map((r) => ({ status: r.status, advancedPast: r.advanced_past ?? false })),
  );
  if (classRes.data.scoring_pos === pos) return;
  const { error } = await supabase.from('classes').update({ scoring_pos: pos }).eq('id', classId);
  if (error) throw error;
}
