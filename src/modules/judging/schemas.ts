import { z } from 'zod';

export const assignJudgeToClassesSchema = z.object({
  staffId: z.uuid(),
  classIds: z.array(z.uuid()).min(1),
});
export type AssignJudgeToClassesInput = z.input<typeof assignJudgeToClassesSchema>;
