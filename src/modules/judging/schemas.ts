import { z } from 'zod';

export const assignJudgeToClassesSchema = z.object({
  staffId: z.uuid(),
  classIds: z.array(z.uuid()).min(1),
});
export type AssignJudgeToClassesInput = z.input<typeof assignJudgeToClassesSchema>;

export const assignScribeToClassesSchema = z.object({
  staffId: z.uuid(),
  classIds: z.array(z.uuid()).min(1),
});
export type AssignScribeToClassesInput = z.input<typeof assignScribeToClassesSchema>;

/**
 * The Setup → Venue "Assign Judges" dialog: set the head-judge seat (J1) for a
 * chosen set of classes in one go. Either role may be null to leave/clear it.
 */
export const setClassPanelSchema = z.object({
  classIds: z.array(z.uuid()).min(1),
  judgeStaffId: z.uuid().nullable(),
  scribeStaffId: z.uuid().nullable(),
});
export type SetClassPanelInput = z.input<typeof setClassPanelSchema>;
