import { z } from 'zod';
import { requiredEmailSchema } from '@/shared/schemas/email';
import { isValidPhoneValue, PHONE_INVALID_MESSAGE } from '@/shared/schemas/phone';

/** A USEF ID is digits only. Blank is allowed (not known yet). */
export const usefIdSchema = z
  .string()
  .trim()
  .max(20, 'That USEF ID is too long')
  .regex(/^\d*$/, 'A USEF ID is numbers only');

const judgeFields = {
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: requiredEmailSchema(),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(isValidPhoneValue, PHONE_INVALID_MESSAGE)
    .optional()
    .default(''),
  usefId: usefIdSchema.optional().default(''),
};

export const createJudgeSchema = z.object(judgeFields);
export type CreateJudgeInput = z.input<typeof createJudgeSchema>;

export const updateJudgeSchema = z.object({ id: z.uuid(), ...judgeFields });
export type UpdateJudgeInput = z.input<typeof updateJudgeSchema>;

export const deleteJudgeSchema = z.object({ id: z.uuid() });
