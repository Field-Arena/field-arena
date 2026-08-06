'use server';

/**
 * `revalidatePath` is deliberately NOT called from the high-frequency,
 * per-field mutations here (setMark, setCollective, setRemark,
 * setFinalRemarks, toggleErrorAt). Calling it triggers a Next.js router
 * refresh that re-renders the Server Component tree — which remounts
 * `ScoringScreen`, a Client Component, discarding whatever local state
 * (marks not yet echoed back from the poll, an in-progress keystroke) it
 * was holding. On a screen where a judge fires one of these writes every
 * few seconds, that's a real, observed bug: mid-entry marks getting wiped
 * out from under the person typing them. `useScoringState`'s own 4s poll
 * already keeps the screen current without this. The infrequent, terminal
 * actions below (submit, scratch, disqualify, skip, undo, holding queue,
 * open/close, publish) keep `revalidatePath` — a fresh reload there is
 * expected, not disruptive.
 */
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { getMySeat, getTestForClass } from './queries';
import { averagePct, clampMark, collectivesTotal, sheetPct } from '../scoring-engine';
import { asBooleanMap, asStringMap, parseMarkMap, toSheet } from '../utils';
import type { Json } from '@/shared/types/database.types';
import {
  addHoldingEntrySchema,
  advanceRideSchema,
  correctEntrySchema,
  disqualifyRideSchema,
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
  submitScoresheetSchema,
  toggleErrorAtSchema,
  toggleScoringOpenSchema,
  unfinishRideSchema,
  unpublishResultsSchema,
  unskipRideSchema,
  upsertPanelSeatSchema,
  workInEntrySchema,
} from '../schemas';

const ORG_LEVEL_ROLES = new Set(['Organizer', 'Show Admin', 'SuperAdmin']);

/**
 * The caller must hold the exact seat they're claiming to write as — not
 * just "be a Judge/Scribe somewhere on this show." Org-level roles (who
 * hold no seat at all) bypass this, matching legacy's own admin/testing
 * path. Throws rather than returning a boolean so every call site fails
 * loudly instead of silently no-op'ing.
 */
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

async function getScoreRow(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  entryId: string,
  seatId: string
) {
  const { data, error } = await supabase
    .from('scores')
    .select(
      'id, class_id, entry_id, seat_id, movements, collectives, errors, error_at, remarks, final_remarks, submitted'
    )
    .eq('entry_id', entryId)
    .eq('seat_id', seatId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * One judge-locks-scribe-guarded mark write, shared by setMark/setCollective.
 *
 * The actual write goes through `merge_score_json` — a single atomic
 * `jsonb || patch` UPDATE — rather than reading the row, merging in JS, and
 * upserting the whole column back. That read-modify-write shape has a real
 * race: a judge filling out several marks in quick succession fires
 * multiple writes to the SAME `movements`/`collectives` column, and two
 * requests can each read the row before the other's write lands, silently
 * dropping whichever key isn't in the last one to commit. The lock check
 * below still reads first (it's a permission decision, not the write
 * payload), but the write itself only ever patches the one key changing,
 * so it can never clobber a sibling key regardless of ordering.
 */
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

  // A late correction can't silently ride along as still-confirmed.
  if (existing?.submitted) {
    const { error } = await supabase
      .from('scores')
      .update({ submitted: false })
      .eq('entry_id', params.entryId)
      .eq('seat_id', params.seatId);
    if (error) throw error;
  }

  // No revalidatePath here deliberately — see the module doc comment at the
  // top of this file.
}

export async function setMark(input: unknown) {
  const parsed = setMarkSchema.parse(input);
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
  const parsed = setCollectiveSchema.parse(input);
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
  const parsed = setRemarkSchema.parse(input);
  await assertSeatAccess(parsed.classId, parsed.seatId, await seatRoleFor(parsed.classId, parsed.seatId));

  const supabase = await createServerClient();
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
  const parsed = setFinalRemarksSchema.parse(input);
  await assertSeatAccess(parsed.classId, parsed.seatId, await seatRoleFor(parsed.classId, parsed.seatId));

  const supabase = await createServerClient();
  const existing = await getScoreRow(supabase, parsed.entryId, parsed.seatId);

  const { error } = await supabase.from('scores').upsert(
    {
      id: existing?.id,
      class_id: parsed.classId,
      entry_id: parsed.entryId,
      seat_id: parsed.seatId,
      final_remarks: parsed.text,
    },
    { onConflict: 'entry_id,seat_id' }
  );
  if (error) throw error;
}

export async function toggleErrorAt(input: unknown) {
  const parsed = toggleErrorAtSchema.parse(input);
  await assertSeatAccess(parsed.classId, parsed.seatId, await seatRoleFor(parsed.classId, parsed.seatId));

  const supabase = await createServerClient();
  const existing = await getScoreRow(supabase, parsed.entryId, parsed.seatId);
  const errorAt = asBooleanMap(existing?.error_at);
  const key = String(parsed.movementNum);
  const nextValue = !errorAt[key];
  errorAt[key] = nextValue;
  const errors = Object.values(errorAt).filter(Boolean).length;

  const patch = { [key]: nextValue } as unknown as Json;
  const { error: mergeError } = await supabase.rpc('merge_score_json', {
    p_class_id: parsed.classId,
    p_entry_id: parsed.entryId,
    p_seat_id: parsed.seatId,
    p_field: 'error_at',
    p_patch: patch,
  });
  if (mergeError) throw mergeError;

  const { error } = await supabase
    .from('scores')
    .update({ errors })
    .eq('entry_id', parsed.entryId)
    .eq('seat_id', parsed.seatId);
  if (error) throw error;
}

/** Judges sign; scribes cannot — enforced here regardless of what the client sends. */
export async function submitScoresheet(input: unknown) {
  const parsed = submitScoresheetSchema.parse(input);

  const mySeat = await getMySeat(parsed.classId);
  if (mySeat?.seatId !== parsed.seatId || mySeat.role !== 'judge') {
    throw new Error('Only the judge on this seat can sign and submit.');
  }

  const supabase = await createServerClient();
  const existing = await getScoreRow(supabase, parsed.entryId, parsed.seatId);
  if (!existing) throw new Error('Nothing has been scored yet.');

  const { error } = await supabase
    .from('scores')
    .update({ submitted: true, signed_by: mySeat.name, signed_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/** Admin-only: clears submitted/signed state and leaves an audit trail on the entry. */
export async function reopenScoresheet(input: unknown) {
  const parsed = reopenScoresheetSchema.parse(input);
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

/** Admin free-text note on an already-confirmed ride — a plain overwrite, unlike reopen's append-with-timestamp. */
export async function correctEntry(input: unknown) {
  const parsed = correctEntrySchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('class_entries')
    .update({ correction: parsed.note })
    .eq('id', parsed.entryId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/**
 * Every panel seat has submitted for this ride: compute the final numbers
 * and move on. For a holding-queue ride this only clears workingInEntryId —
 * scoringPos, which tracks the normal draw, is untouched.
 */
export async function advanceRide(input: unknown) {
  const parsed = advanceRideSchema.parse(input);
  const supabase = await createServerClient();

  const [entryRes, panelRes, scoresRes, classRes] = await Promise.all([
    supabase.from('class_entries').select('*').eq('id', parsed.entryId).single(),
    supabase.from('class_panel').select('seat_id').eq('class_id', parsed.classId),
    supabase.from('scores').select('*').eq('entry_id', parsed.entryId),
    supabase
      .from('classes')
      .select('scoring_pos, working_in_entry_id')
      .eq('id', parsed.classId)
      .single(),
  ]);
  if (entryRes.error) throw entryRes.error;
  if (panelRes.error) throw panelRes.error;
  if (scoresRes.error) throw scoresRes.error;
  if (classRes.error) throw classRes.error;

  const scoreBySeat = new Map(scoresRes.data.map((s) => [s.seat_id, s]));
  const allReady = panelRes.data.every((seat) => scoreBySeat.get(seat.seat_id)?.submitted);
  if (!allReady) throw new Error('Not every judge has submitted yet.');

  const test = await getTestForClass(parsed.classId);
  const judgePct: Record<string, string> = {};
  const perSeatScores = [];
  for (const seat of panelRes.data) {
    const row = scoreBySeat.get(seat.seat_id);
    if (!row) continue;
    const pct = test ? sheetPct(toSheet(toPlainSheetInput(row)), test) : null;
    if (pct !== null) judgePct[seat.seat_id] = String(pct);
    perSeatScores.push({ row, pct });
  }

  const finalPct = averagePct(perSeatScores.map((s) => (typeof s.pct === 'number' || s.pct === 'ELIM' ? s.pct : null)));
  const ctot = test
    ? collectivesTotal(
        perSeatScores.map((s) => toSheet(toPlainSheetInput(s.row))),
        test
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

  await advanceClassPointer(supabase, parsed.classId, entryRes.data, classRes.data);

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function scratchRide(input: unknown) {
  const parsed = scratchRideSchema.parse(input);
  await setTerminalStatus(parsed.classId, parsed.entryId, 'scratched', null);
}

export async function disqualifyRide(input: unknown) {
  const parsed = disqualifyRideSchema.parse(input);
  await setTerminalStatus(parsed.classId, parsed.entryId, 'disqualified', parsed.reason);
}

async function setTerminalStatus(
  classId: string,
  entryId: string,
  status: 'scratched' | 'disqualified',
  reason: string | null
) {
  const supabase = await createServerClient();

  const [entryRes, classRes] = await Promise.all([
    supabase.from('class_entries').select('*').eq('id', entryId).single(),
    supabase.from('classes').select('scoring_pos, working_in_entry_id').eq('id', classId).single(),
  ]);
  if (entryRes.error) throw entryRes.error;
  if (classRes.error) throw classRes.error;

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

  await advanceClassPointer(supabase, classId, entryRes.data, classRes.data);

  revalidatePath(`/dashboard/scoring/${classId}`);
}

/**
 * Reverses the last scratch/disqualify — the single-level, 20s-window undo.
 * Blocked unless the entry is currently scratched/disqualified, matching
 * legacy: skip has its own dedicated reversal, `unskipRide` below.
 */
export async function unfinishRide(input: unknown) {
  const parsed = unfinishRideSchema.parse(input);
  const supabase = await createServerClient();

  const { data: entry, error: entryError } = await supabase
    .from('class_entries')
    .select('ride_order, status, holding')
    .eq('id', parsed.entryId)
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

  if (!entry.holding) {
    const { error: rewindError } = await supabase
      .from('classes')
      .update({ scoring_pos: entry.ride_order })
      .eq('id', parsed.classId);
    if (rewindError) throw rewindError;
  }

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/** Swaps this rider with whoever's immediately next in the running order. */
export async function skipRide(input: unknown) {
  const parsed = skipRideSchema.parse(input);
  await swapRideOrder(parsed.classId, parsed.entryId, 1);
  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/** Reverses a skip — swaps with whoever's immediately before, the exact mirror. */
export async function unskipRide(input: unknown) {
  const parsed = unskipRideSchema.parse(input);
  await swapRideOrder(parsed.classId, parsed.entryId, -1);
  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

async function swapRideOrder(classId: string, entryId: string, direction: 1 | -1) {
  const supabase = await createServerClient();

  const { data: entries, error } = await supabase
    .from('class_entries')
    .select('id, ride_order')
    .eq('class_id', classId)
    .eq('holding', false)
    .order('ride_order');
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

export async function addHoldingEntry(input: unknown) {
  const parsed = addHoldingEntrySchema.parse(input);
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
  const parsed = removeHoldingEntrySchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('class_entries')
    .delete()
    .eq('id', parsed.entryId)
    .eq('holding', true);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/** Works one holding-queue rider in without disturbing the normal draw's scoringPos. */
export async function workInEntry(input: unknown) {
  const parsed = workInEntrySchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ working_in_entry_id: parsed.entryId })
    .eq('id', parsed.classId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/**
 * Live in-scoring-screen panel edit — upserts one seat's judge/scribe/
 * position, distinct from `judging/data/mutations.ts`'s
 * assignJudgeToClasses/assignScribeToClasses (the pre-show "+ Add User"
 * bulk checklist writers, which stay as they are). Only the fields present
 * in the input are written — omitted fields keep their existing value.
 */
export async function upsertPanelSeat(input: unknown) {
  const parsed = upsertPanelSeatSchema.parse(input);
  const supabase = await createServerClient();

  const row: { class_id: string; seat_id: string; position?: string | null; judge_staff_id?: string | null; scribe_staff_id?: string | null } = {
    class_id: parsed.classId,
    seat_id: parsed.seatId,
  };
  if (parsed.position !== undefined) row.position = parsed.position;
  if (parsed.judgeStaffId !== undefined) row.judge_staff_id = parsed.judgeStaffId;
  if (parsed.scribeStaffId !== undefined) row.scribe_staff_id = parsed.scribeStaffId;

  const { error } = await supabase.from('class_panel').upsert(row, { onConflict: 'class_id,seat_id' });
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function removePanelSeat(input: unknown) {
  const parsed = removePanelSeatSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('class_panel')
    .delete()
    .eq('class_id', parsed.classId)
    .eq('seat_id', parsed.seatId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/**
 * No UI reaches this in legacy either — see the doc comment on
 * `setClassTestSchema`. Kept callable for code-level parity only.
 */
export async function setClassTest(input: unknown) {
  const parsed = setClassTestSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase.from('class_tests').upsert(
    {
      class_id: parsed.classId,
      name: parsed.name,
      edition: parsed.edition ?? null,
      movements: parsed.movements,
      collectives: parsed.collectives,
    },
    { onConflict: 'class_id' }
  );
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

/**
 * Wipes and replaces the whole roster (and every score tied to it) — exactly
 * as destructive as legacy's own `setEntries` action. No UI reaches this in
 * legacy either — see the doc comment on `setClassEntriesSchema`. Kept
 * callable for code-level parity only.
 */
export async function setClassEntries(input: unknown) {
  const parsed = setClassEntriesSchema.parse(input);
  const supabase = await createServerClient();

  const { error: deleteScoresError } = await supabase.from('scores').delete().eq('class_id', parsed.classId);
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
      }))
    );
    if (insertError) throw insertError;
  }

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function toggleScoringOpen(input: unknown) {
  const parsed = toggleScoringOpenSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ scoring_open: parsed.open })
    .eq('id', parsed.classId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
}

export async function publishResults(input: unknown) {
  const parsed = publishResultsSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ results_published: true, results_published_at: new Date().toISOString() })
    .eq('id', parsed.classId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
  revalidatePath('/dashboard/judging');
  revalidatePath('/dashboard/judging/history');
}

export async function unpublishResults(input: unknown) {
  const parsed = unpublishResultsSchema.parse(input);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ results_published: false, results_published_at: null })
    .eq('id', parsed.classId);
  if (error) throw error;

  revalidatePath(`/dashboard/scoring/${parsed.classId}`);
  revalidatePath('/dashboard/judging');
  revalidatePath('/dashboard/judging/history');
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function seatRoleFor(classId: string, seatId: string): Promise<'judge' | 'scribe'> {
  const mySeat = await getMySeat(classId);
  if (mySeat?.seatId === seatId) return mySeat.role;
  // Org-level caller with no seat of their own — assertSeatAccess still runs
  // and will accept them; default to 'judge' only for the mark-lock check's
  // sake, since an org-level write should never be blocked by that rule.
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
  entry: { ride_order: number; holding: boolean | null },
  classRow: { scoring_pos: number | null; working_in_entry_id: string | null }
) {
  if (entry.holding || classRow.working_in_entry_id) {
    const { error } = await supabase
      .from('classes')
      .update({ working_in_entry_id: null })
      .eq('id', classId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('classes')
    .update({ scoring_pos: Math.max(classRow.scoring_pos ?? 0, entry.ride_order) })
    .eq('id', classId);
  if (error) throw error;
}
