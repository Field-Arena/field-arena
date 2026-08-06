import { z } from 'zod';
import { MARK_MAX, MARK_MIN } from './constants';

const seatRoleSchema = z.enum(['judge', 'scribe']);

export const setMarkSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  seatId: z.string().min(1),
  seatRole: seatRoleSchema,
  movementNum: z.number().int(),
  value: z.number().min(MARK_MIN).max(MARK_MAX),
});
export type SetMarkInput = z.infer<typeof setMarkSchema>;

export const setCollectiveSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  seatId: z.string().min(1),
  seatRole: seatRoleSchema,
  key: z.string().min(1),
  value: z.number().min(MARK_MIN).max(MARK_MAX),
});
export type SetCollectiveInput = z.infer<typeof setCollectiveSchema>;

export const setRemarkSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  seatId: z.string().min(1),
  movementNum: z.number().int(),
  text: z.string().max(500),
});
export type SetRemarkInput = z.infer<typeof setRemarkSchema>;

export const setFinalRemarksSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  seatId: z.string().min(1),
  text: z.string().max(2000),
});
export type SetFinalRemarksInput = z.infer<typeof setFinalRemarksSchema>;

export const toggleErrorAtSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  seatId: z.string().min(1),
  movementNum: z.number().int(),
});
export type ToggleErrorAtInput = z.infer<typeof toggleErrorAtSchema>;

export const submitScoresheetSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  seatId: z.string().min(1),
});
export type SubmitScoresheetInput = z.infer<typeof submitScoresheetSchema>;

export const reopenScoresheetSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  seatId: z.string().min(1),
  reason: z.string().trim().min(1, 'A reason is required'),
});
export type ReopenScoresheetInput = z.infer<typeof reopenScoresheetSchema>;

export const correctEntrySchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  note: z.string().trim().max(2000),
});
export type CorrectEntryInput = z.infer<typeof correctEntrySchema>;

export const upsertPanelSeatSchema = z.object({
  classId: z.uuid(),
  seatId: z.string().min(1),
  position: z.string().trim().max(10).nullable().optional(),
  judgeStaffId: z.uuid().nullable().optional(),
  scribeStaffId: z.uuid().nullable().optional(),
});
export type UpsertPanelSeatInput = z.infer<typeof upsertPanelSeatSchema>;

export const removePanelSeatSchema = z.object({
  classId: z.uuid(),
  seatId: z.string().min(1),
});
export type RemovePanelSeatInput = z.infer<typeof removePanelSeatSchema>;

const testMovementSchema = z.object({ num: z.number().int(), text: z.string(), coef: z.number() });
const testCollectiveSchema = z.object({ key: z.string(), label: z.string(), coef: z.number() });

/**
 * No UI calls this in legacy either (`api/shows/[id]/[resource].js`'s
 * `setTest` action has zero client call sites) — kept at code-level parity
 * only, matching legacy's own unreachable shape rather than inventing a
 * live test editor legacy users never had.
 */
export const setClassTestSchema = z.object({
  classId: z.uuid(),
  name: z.string().trim().min(1),
  edition: z.string().trim().nullable().optional(),
  movements: z.array(testMovementSchema),
  collectives: z.array(testCollectiveSchema),
});
export type SetClassTestInput = z.infer<typeof setClassTestSchema>;

/**
 * Legacy's only caller is `showrunner-scoring.html`'s own demo-data bootstrap
 * (seeds sample entries when no real test resolved) — not a real admin
 * "replace the roster" feature. Kept at code-level parity only; deliberately
 * not wired to any UI or to that fallback, which would inject fake rider
 * names into a real class.
 */
export const setClassEntriesSchema = z.object({
  classId: z.uuid(),
  entries: z.array(
    z.object({
      draw: z.number().int().nullable().optional(),
      num: z.string().trim().min(1),
      rider: z.string().trim().nullable().optional(),
      horse: z.string().trim().nullable().optional(),
    })
  ),
});
export type SetClassEntriesInput = z.infer<typeof setClassEntriesSchema>;

export const advanceRideSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
});
export type AdvanceRideInput = z.infer<typeof advanceRideSchema>;

export const scratchRideSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
});
export type ScratchRideInput = z.infer<typeof scratchRideSchema>;

export const disqualifyRideSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
  reason: z.string().trim().min(1, 'A reason is required'),
});
export type DisqualifyRideInput = z.infer<typeof disqualifyRideSchema>;

export const skipRideSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
});
export type SkipRideInput = z.infer<typeof skipRideSchema>;

export const unskipRideSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
});
export type UnskipRideInput = z.infer<typeof unskipRideSchema>;

export const unfinishRideSchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
});
export type UnfinishRideInput = z.infer<typeof unfinishRideSchema>;

export const addHoldingEntrySchema = z.object({
  classId: z.uuid(),
  num: z.string().trim().min(1),
  rider: z.string().trim().max(120).optional(),
  horse: z.string().trim().max(120).optional(),
});
export type AddHoldingEntryInput = z.infer<typeof addHoldingEntrySchema>;

export const removeHoldingEntrySchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid(),
});
export type RemoveHoldingEntryInput = z.infer<typeof removeHoldingEntrySchema>;

export const workInEntrySchema = z.object({
  classId: z.uuid(),
  entryId: z.uuid().nullable(),
});
export type WorkInEntryInput = z.infer<typeof workInEntrySchema>;

export const toggleScoringOpenSchema = z.object({
  classId: z.uuid(),
  open: z.boolean(),
});
export type ToggleScoringOpenInput = z.infer<typeof toggleScoringOpenSchema>;

export const publishResultsSchema = z.object({
  classId: z.uuid(),
});
export type PublishResultsInput = z.infer<typeof publishResultsSchema>;

export const unpublishResultsSchema = z.object({
  classId: z.uuid(),
});
export type UnpublishResultsInput = z.infer<typeof unpublishResultsSchema>;
