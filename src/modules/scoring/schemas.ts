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
